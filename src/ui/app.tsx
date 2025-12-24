import React, { useState } from "react";
import { Box, Text, Static, useApp, useInput } from "ink";
import { InputBox } from "./components/InputBox.js";
import { Confirm } from "./components/Confirm.js";
import { TodoList } from "./components/TodoList.js";
import { ToolOutputDisplay } from "./components/ToolOutputDisplay.js";
import { StatusBar } from "./components/StatusBar.js";
import { PlanConfirm } from "./components/PlanConfirm.js";
import { onStatus, getStatus } from "../core/status.js";
import { getLastTruncatedOutput } from "../core/output.js";
import type { AIAgent } from "../core/agent.js";
import type { Plan } from "../core/types.js";
import { getSlashCommandRegistry } from "../core/slash-commands.js";
import { getSessionManager } from "../core/session-manager.js";
import { getTokenTracker } from "../core/token-tracker.js";
import { getDryRunManager } from "../core/dry-run.js";
import { brand, icons, createSeparator } from "./theme.js";

interface AppProps {
  onSubmit: (input: string) => Promise<void>;
  onConfirmRequest?: (handler: (message: string) => Promise<boolean>) => void;
  agentRef?: React.RefObject<AIAgent | null>;
}

export function App({ onSubmit, onConfirmRequest, agentRef }: AppProps) {
  const { exit } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [sessionNum] = useState(1);
  const [statusMessage, setStatusMessage] = useState<string>(
    getStatus().message || "thinking..."
  );
  const [confirmState, setConfirmState] = useState<{
    message: string;
    resolver: (value: boolean) => void;
  } | null>(null);
  const [todos, setTodos] = useState<any[]>([]);
  const [expandedOutputId, setExpandedOutputId] = useState<string | null>(null);
  const [inputResetToken, setInputResetToken] = useState(0);

  // Feature state
  const [sessionId, setSessionId] = useState<string>("");
  const [tokenStats, setTokenStats] = useState({ total: 0, cost: 0 });
  const [isDryRun, setIsDryRun] = useState(false);

  // Plan mode state
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [isPlanningMode, setIsPlanningMode] = useState(false);

  const [modelName, setModelName] = useState<string>("claude-sonnet-4.5");
  // Register confirmation handler
  React.useEffect(() => {
    if (onConfirmRequest) {
      onConfirmRequest(async (message: string) => {
        return new Promise<boolean>((resolve) => {
          setConfirmState({ message, resolver: resolve });
        });
      });
    }
  }, [onConfirmRequest]);

  React.useEffect(() => {
    const unsubscribe = onStatus((s) => {
      setStatusMessage(s.message);
    });
    return unsubscribe;
  }, []);

  // Poll for todo and plan updates
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (agentRef?.current) {
      interval = setInterval(() => {
        try {
          const todoState = agentRef.current!.getTodos();
          setTodos(todoState.todos);
          const model = agentRef.current!.getModel();
          setModelName(model);

          // Check for pending plan
          const planState = agentRef.current!.getPlanState();
          if (planState.status === "pending_approval" && planState.plan) {
            setPendingPlan(planState.plan);
            setIsProcessing(false); // Stop processing indicator while waiting for approval
          } else if (planState.status !== "pending_approval") {
            setPendingPlan(null);
          }
        } catch (err) {
          // Silently ignore polling errors
        }
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [agentRef]);

  // Poll for feature updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      try {
        const sessionMgr = getSessionManager();
        const session = sessionMgr.getCurrentSession();
        if (session) {
          setSessionId(session.metadata.id);
        }

        const tracker = getTokenTracker();
        setTokenStats({
          total: tracker.getTotalTokens(),
          cost: tracker.getTotalCost()
        });

        const dryRun = getDryRunManager();
        setIsDryRun(dryRun.isEnabled());
      } catch (err) {
        // Silently ignore polling errors
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleConfirm = () => {
    if (confirmState) {
      confirmState.resolver(true);
      setConfirmState(null);
    }
  };

  const handleCancel = () => {
    if (confirmState) {
      confirmState.resolver(false);
      setConfirmState(null);
    }
  };

  // Plan approval handlers
  const handlePlanApprove = async () => {
    if (agentRef?.current && pendingPlan) {
      setPendingPlan(null);
      setIsProcessing(true);
      setProcessingStartTime(Date.now());
      await agentRef.current.approvePlan();
      setIsProcessing(false);
      setProcessingStartTime(null);
    }
  };

  const handlePlanReject = () => {
    if (agentRef?.current) {
      agentRef.current.rejectPlan();
      setPendingPlan(null);
    }
  };

  const handlePlanModify = async (instructions: string) => {
    if (agentRef?.current) {
      setPendingPlan(null);
      setIsProcessing(true);
      setProcessingStartTime(Date.now());
      await agentRef.current.modifyPlan(instructions);
      setIsProcessing(false);
      setProcessingStartTime(null);
    }
  };

  useInput(
    (input, key) => {
      const isCtrlC = (key.ctrl && input === "c") || input === "\u0003";
      if (isCtrlC) {
        console.log("\n");
        exit();
      }

      const isCtrlO = (key.ctrl && input === "o") || input === "\u000f";

      if (expandedOutputId) {
        if (isCtrlO || key.escape || input === "q" || input === "Q") {
          setExpandedOutputId(null);
          setInputResetToken((prev) => prev + 1);
        }
        return;
      }

      if (isCtrlO) {
        setExpandedOutputId((current) => {
          const lastTruncated = getLastTruncatedOutput();
          return lastTruncated ? lastTruncated.id : null;
        });
        setInputResetToken((prev) => prev + 1);
      }
    },
    { isActive: process.stdin.isTTY ?? false }
  );

  const handleSubmit = async (value: string) => {
    if (!value.trim() || isProcessing) return;

    const cmdRegistry = getSlashCommandRegistry();
    let finalInput = value;

    // Check for /plan command - toggle planning mode
    if (cmdRegistry.isSlashCommand(value)) {
      const parsed = cmdRegistry.parseCommand(value);
      if (parsed && parsed.command.name === "plan") {
        setIsPlanningMode(true);
        console.log(`\n${icons.arrow} Entering planning mode. Describe what you want to build:\n`);
        return;
      }

      try {
        if (parsed) {
          finalInput = cmdRegistry.expandCommand(parsed.command, parsed.args);
          console.log(`\n${icons.arrow} /${parsed.command.name}\n`);
        }
      } catch (error: any) {
        console.log(`\n${icons.error} ${error.message}\n`);
        return;
      }
    }

    // If in planning mode, wrap input with planning instructions
    if (isPlanningMode) {
      finalInput = `Enter planning mode. Explore the codebase and create a detailed implementation plan for: ${value}

Use the plan_write tool to display the plan for my approval. The plan should have:
- A clear title and summary
- Sections representing phases of work
- Specific tasks within each section
- Files that will be created or modified

Do NOT start implementation until I approve the plan.`;
      setIsPlanningMode(false);
      console.log(`\n${icons.section} Planning: ${value}\n`);
    }

    setIsProcessing(true);
    setProcessingStartTime(Date.now());
    try {
      await onSubmit(finalInput);
    } finally {
      setIsProcessing(false);
      setProcessingStartTime(null);
    }
  };

  // Get working directory (last 2 segments)
  const cwd = process.cwd().split('/').slice(-2).join('/');

  return (
    <Box flexDirection="row">
      <Box flexDirection="column" flexGrow={1}>
        <Static items={["header"]}>
          {() => (
            <Box key="header" flexDirection="column">
              {/* Logo */}
              <Text color="cyan" bold>{brand.logo}</Text>

              {/* Status line */}
              <Box marginBottom={1}>
                <Text dimColor>{brand.tagline}</Text>
              </Box>

              {/* Info bar - single line, clean */}
              <Box marginBottom={1}>
                {isDryRun && (
                  <>
                    <Text color="yellow">[dry-run]</Text>
                    <Text dimColor> {icons.pipe} </Text>
                  </>
                )}
                <Text dimColor>model:</Text>
                <Text color="cyan"> {modelName}</Text>
                <Text dimColor> {icons.pipe} </Text>
                <Text dimColor>cwd:</Text>
                <Text> {cwd}</Text>
                {sessionId && (
                  <>
                    <Text dimColor> {icons.pipe} </Text>
                    <Text dimColor>session:</Text>
                    <Text color="blue"> {sessionId.substring(0, 8)}</Text>
                  </>
                )}
                {tokenStats.total > 0 && (
                  <>
                    <Text dimColor> {icons.pipe} </Text>
                    <Text dimColor>tokens:</Text>
                    <Text> {tokenStats.total.toLocaleString()}</Text>
                  </>
                )}
                {tokenStats.cost > 0 && (
                  <>
                    <Text dimColor> {icons.pipe} </Text>
                    <Text color="green">${tokenStats.cost.toFixed(4)}</Text>
                  </>
                )}
              </Box>

              {/* Keyboard shortcuts - minimal */}
              <Box marginBottom={1}>
                <Text dimColor>
                  ^c quit {icons.bullet} ^o output {icons.bullet} / commands {icons.bullet} @ files {icons.bullet} ! shell
                </Text>
              </Box>

              {/* Separator */}
              <Text dimColor>{createSeparator(70)}</Text>
              <Text> </Text>
            </Box>
          )}
        </Static>

        {/* Processing status */}
        {isProcessing && (
          <StatusBar
            message={statusMessage || "thinking..."}
            isProcessing={isProcessing}
            startTime={processingStartTime || undefined}
          />
        )}

        {/* Todo list */}
        {todos.length > 0 && <TodoList todos={todos} />}

        {/* Expanded tool output */}
        <ToolOutputDisplay expandedOutputId={expandedOutputId} />

        {/* Confirmation dialog */}
        {confirmState && (
          <Box marginBottom={1}>
            <Confirm
              message={confirmState.message}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          </Box>
        )}

        {/* Plan confirmation dialog */}
        {pendingPlan && (
          <Box marginBottom={1}>
            <PlanConfirm
              plan={pendingPlan}
              onApprove={handlePlanApprove}
              onReject={handlePlanReject}
              onModify={handlePlanModify}
            />
          </Box>
        )}

        {/* Input */}
        <InputBox
          onSubmit={handleSubmit}
          isDisabled={isProcessing || !!confirmState || !!expandedOutputId || !!pendingPlan}
          sessionNum={sessionNum}
          resetToken={inputResetToken}
          isPlanningMode={isPlanningMode}
        />
      </Box>
    </Box>
  );
}
