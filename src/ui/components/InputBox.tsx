import React, { useState } from "react";
import { Box, Text } from "ink";
import { TextInput } from "@inkjs/ui";

interface InputBoxProps {
  onSubmit: (value: string) => void;
  isDisabled?: boolean;
  sessionNum: number;
  resetToken?: number;
}

export function InputBox({
  onSubmit,
  isDisabled = false,
  sessionNum,
  resetToken = 0,
}: InputBoxProps) {
  const [inputKey, setInputKey] = useState(0);

  const handleSubmit = (submittedValue: string) => {
    onSubmit(submittedValue);
    setInputKey((prev) => prev + 1); // Force remount to clear input
  };

  return (
    <Box flexDirection="column">
      <Box borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text color="gray">→ </Text>
        <TextInput
          key={`${resetToken}-${inputKey}`}
          placeholder="Plan, search, build anything"
          onSubmit={handleSubmit}
          isDisabled={isDisabled}
        />
      </Box>
      <Box paddingLeft={1} gap={1}>
        <Text dimColor>Session {sessionNum}</Text>
        <Text dimColor>/ commands · @ files · ! shell</Text>
      </Box>
    </Box>
  );
}
