import React, { useState } from "react";
import { Box, Text, Static, useApp, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { InputBox } from "./components/InputBox.js";
import { Confirm } from "./components/Confirm.js";
import { TodoList } from "./components/TodoList.js";
import { ToolOutputDisplay } from "./components/ToolOutputDisplay.js";
import { AgentActivityPanel } from "./components/AgentActivityPanel.js";
import { onStatus, getStatus } from "../core/status.js";
import { getLastTruncatedOutput } from "../core/output.js";
import { onAgentTask } from "../core/agent-events.js";
import { isSubAgentsEnabled } from "../core/feature-flags.js";
import type { AIAgent } from "../core/agent.js";

const HEADER = `
   █████╗ ██╗     █████╗  ██████╗ ███████╗███╗   ██╗████████╗
  ██╔══██╗██║    ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
  ███████║██║    ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║
  ██╔══██║██║    ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║
  ██║  ██║██║    ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║
  ╚═╝  ╚═╝╚═╝    ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝
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
  const [showAgentPanel, setShowAgentPanel] = useState(isSubAgentsEnabled());
  const [showMetrics, setShowMetrics] = useState(false);

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

  // Event-driven todo updates (replaces polling)
  React.useEffect(() => {
    // Subscribe to agent task events for todo updates
    const unsubscribe = onAgentTask((event) => {
      if (event.type === "completed" && event.result?.data?.todos) {
        setTodos(event.result.data.todos);
      }
    });

    // Fallback: Poll if agentRef is available (for backward compatibility)
    let interval: NodeJS.Timeout | null = null;
    if (agentRef?.current && !isSubAgentsEnabled()) {
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
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [agentRef]);

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
      const isCtrlA = (key.ctrl && input === "a") || input === "\u0001";
      const isCtrlM = (key.ctrl && input === "m") || input === "\r";

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

      // Ctrl+A: Toggle agent activity panel
      if (isCtrlA && isSubAgentsEnabled()) {
        setShowAgentPanel((prev) => !prev);
      }

      // Ctrl+M: Toggle metrics (future feature)
      if (isCtrlM && isSubAgentsEnabled()) {
        setShowMetrics((prev) => !prev);
      }
    },
    { isActive: process.stdin.isTTY ?? false }
  );

  const handleSubmit = async (value: string) => {
    if (!value.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      await onSubmit(value);
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
              <Text color="cyan">{HEADER}</Text>
              <Text dimColor>Safe mode enabled (ctrl+c to quit)</Text>
              <Text dimColor>File changes require your approval before being applied</Text>
              <Text dimColor>Using Claude Sonnet 4.5 via OpenRouter</Text>
              {isSubAgentsEnabled() && (
                <Text dimColor>
                  Multi-agent mode: Ctrl+A to toggle panel{showMetrics ? ", Ctrl+M for metrics" : ""}
                </Text>
              )}
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

      {/* Right sidebar - Agent activity panel */}
      {showAgentPanel && isSubAgentsEnabled() && (
        <Box marginLeft={1}>
          <AgentActivityPanel />
        </Box>
      )}
    </Box>
  );
}
