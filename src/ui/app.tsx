import React, { useState } from "react";
import { Box, Text, Static, useApp, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { InputBox } from "./components/InputBox.js";
import { Confirm } from "./components/Confirm.js";
import { onStatus, getStatus } from "../core/status.js";

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
}

export function App({ onSubmit, onConfirmRequest }: AppProps) {
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
      if (key.ctrl && input === "c") {
        console.log("\n\nGoodbye!");
        exit();
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
    <Box flexDirection="column">
      <Static items={["header"]}>
        {() => (
          <Box key="header" flexDirection="column">
            <Text color="cyan">{HEADER}</Text>
            <Text dimColor>Safe mode enabled (ctrl+c to quit)</Text>
            <Text dimColor>File changes require your approval before being applied</Text>
            <Text dimColor>Using Claude Sonnet 4.5 via OpenRouter</Text>
            <Text> </Text>
          </Box>
        )}
      </Static>

      {isProcessing && (
        <Box marginBottom={1}>
          <Spinner label={statusMessage || "Thinking..."} />
        </Box>
      )}

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
        isDisabled={isProcessing || !!confirmState}
        sessionNum={sessionNum}
      />
    </Box>
  );
}
