import React, { useState } from "react";
import { Box, Text, Static, useApp, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { InputBox } from "./components/InputBox.js";
import { Confirm } from "./components/Confirm.js";
import { TodoList } from "./components/TodoList.js";
import { ToolOutputDisplay } from "./components/ToolOutputDisplay.js";
import { onStatus, getStatus } from "../core/status.js";
import { getLastTruncatedOutput } from "../core/output.js";
import type { AIAgent } from "../core/agent.js";
import { getSlashCommandRegistry } from "../core/slash-commands.js";
import { getSessionManager } from "../core/session-manager.js";
import { getTokenTracker } from "../core/token-tracker.js";
import { getDryRunManager } from "../core/dry-run.js";

const HEADER = `
  ██████╗  ██████╗  ██████╗ ████████╗███████╗████████╗██████╗  █████╗ ██████╗
  ██╔══██╗██╔═══██╗██╔═══██╗╚══██╔══╝██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗
  ██████╔╝██║   ██║██║   ██║   ██║   ███████╗   ██║   ██████╔╝███████║██████╔╝
  ██╔══██╗██║   ██║██║   ██║   ██║   ╚════██║   ██║   ██╔══██╗██╔══██║██╔═══╝
  ██████╔╝╚██████╔╝╚██████╔╝   ██║   ███████║   ██║   ██║  ██║██║  ██║██║
  ╚═════╝  ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝
`;

interface AppProps {
  onSubmit: (input: string) => Promise<void>;
  onConfirmRequest?: (handler: (message: string) => Promise<boolean>) => void;
  agentRef?: React.RefObject<AIAgent>;
}

export function App({ onSubmit, onConfirmRequest, agentRef }: AppProps) {
  const { exit } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionNum] = useState(1);
  const [statusMessage, setStatusMessage] = useState<string>(
    getStatus().message || "Thinking..."
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

  // Poll for todo updates
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (agentRef?.current) {
      interval = setInterval(() => {
        try {
          const todoState = agentRef.current!.getTodos();
          setTodos(todoState.todos);
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
        // Update session ID
        const sessionMgr = getSessionManager();
        const session = sessionMgr.getCurrentSession();
        if (session) {
          setSessionId(session.metadata.id);
        }

        // Update token stats
        const tracker = getTokenTracker();
        setTokenStats({
          total: tracker.getTotalTokens(),
          cost: tracker.getTotalCost()
        });

        // Update dry-run status
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

  useInput(
    (input, key) => {
      const isCtrlC = (key.ctrl && input === "c") || input === "\u0003";
      if (isCtrlC) {
        console.log("\n\nGoodbye!");
        exit();
      }

      const isCtrlO = (key.ctrl && input === "o") || input === "\u000f";

      // Handle expanded output view
      if (expandedOutputId) {
        if (isCtrlO || key.escape || input === "q" || input === "Q") {
          setExpandedOutputId(null);
          setInputResetToken((prev) => prev + 1);
        }
        return;
      }

      // Ctrl+O: Expand truncated output
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

    // Check for slash commands
    const cmdRegistry = getSlashCommandRegistry();
    let finalInput = value;

    if (cmdRegistry.isSlashCommand(value)) {
      try {
        const parsed = cmdRegistry.parseCommand(value);
        if (parsed) {
          finalInput = cmdRegistry.expandCommand(parsed.command, parsed.args);
          console.log(`\n💡 Expanded /${parsed.command.name} → "${finalInput.substring(0, 60)}..."\n`);
        }
      } catch (error: any) {
        console.log(`\n❌ ${error.message}\n`);
        return;
      }
    }

    setIsProcessing(true);
    try {
      await onSubmit(finalInput);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box flexDirection="row">
      {/* Main content area */}
      <Box flexDirection="column" flexGrow={1}>
        <Static items={["header"]}>
          {() => (
            <Box key="header" flexDirection="column">
              <Text color="cyan" bold>{HEADER}</Text>

              {/* Status Banner */}
              {isDryRun && (
                <Box marginBottom={1}>
                  <Text backgroundColor="yellow" color="black" bold> [DRY RUN MODE] </Text>
                  <Text color="yellow"> No changes will be applied</Text>
                </Box>
              )}

              {/* System Info */}
              <Box flexDirection="column" marginBottom={1}>
                <Box>
                  <Text color="green">✓</Text>
                  <Text> Safe mode enabled </Text>
                  <Text dimColor>(Ctrl+C to quit)</Text>
                </Box>
                <Box>
                  <Text color="cyan">●</Text>
                  <Text> Claude Sonnet 4.5 via OpenRouter</Text>
                </Box>
                <Box>
                  <Text color="magenta">📁</Text>
                  <Text> {process.cwd()}</Text>
                </Box>
              </Box>

              {/* Session Info */}
              {(sessionId || tokenStats.total > 0) && (
                <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1} marginBottom={1}>
                  {sessionId && (
                    <Box>
                      <Text color="yellow">Session:</Text>
                      <Text> {sessionId}</Text>
                    </Box>
                  )}
                  {tokenStats.total > 0 && (
                    <Box>
                      <Text color="blue">Usage:</Text>
                      <Text> {tokenStats.total.toLocaleString()} tokens</Text>
                      <Text dimColor> | </Text>
                      <Text color="green">${tokenStats.cost.toFixed(4)}</Text>
                    </Box>
                  )}
                </Box>
              )}

              {/* Quick Reference */}
              <Box flexDirection="column" borderStyle="single" borderColor="cyan" paddingX={1} marginBottom={1}>
                <Text bold color="cyan">Quick Reference</Text>
                <Box>
                  <Text color="yellow">/</Text>
                  <Text> Slash commands - Type / to see all commands</Text>
                </Box>
                <Box>
                  <Text color="yellow">Ctrl+C</Text>
                  <Text> Exit the application</Text>
                </Box>
                <Box>
                  <Text color="yellow">Ctrl+O</Text>
                  <Text> Expand truncated output</Text>
                </Box>
              </Box>

              {/* Separator */}
              <Text color="gray">{'─'.repeat(80)}</Text>
              <Text> </Text>
            </Box>
          )}
        </Static>

        {isProcessing && (
          <Box marginBottom={1}>
            <Spinner label={statusMessage || "Thinking..."} />
          </Box>
        )}

        {todos.length > 0 && <TodoList todos={todos} />}

        <ToolOutputDisplay expandedOutputId={expandedOutputId} />

        {confirmState && (
          <Box marginBottom={1}>
            <Confirm
              message={confirmState.message}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          </Box>
        )}

        <InputBox
          onSubmit={handleSubmit}
          isDisabled={isProcessing || !!confirmState || !!expandedOutputId}
          sessionNum={sessionNum}
          resetToken={inputResetToken}
        />
      </Box>
    </Box>
  );
}
