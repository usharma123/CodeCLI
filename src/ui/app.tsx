import React, { useState } from "react";
import { Box, Text, Static, useApp, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { InputBox } from "./components/InputBox.js";

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
}

export function App({ onSubmit }: AppProps) {
  const { exit } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionNum] = useState(1);

  useInput(
    (input, key) => {
      if (key.ctrl && input === "c") {
        console.log("\n\nGoodbye!");
        exit();
      }
    },
    { isActive: !isProcessing && (process.stdin.isTTY ?? false) }
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
          <Spinner label="Thinking..." />
        </Box>
      )}

      <InputBox onSubmit={handleSubmit} isDisabled={isProcessing} sessionNum={sessionNum} />
    </Box>
  );
}
