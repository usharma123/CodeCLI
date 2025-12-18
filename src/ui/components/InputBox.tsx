import React, { useState } from "react";
import { Box, Text } from "ink";
import { TextInput } from "@inkjs/ui";
import { SlashCommandHelp } from "./SlashCommandHelp.js";
import { getSlashCommandRegistry } from "../../core/slash-commands.js";

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
  const [currentInput, setCurrentInput] = useState("");

  const handleSubmit = (submittedValue: string) => {
    onSubmit(submittedValue);
    setInputKey((prev) => prev + 1); // Force remount to clear input
    setCurrentInput(""); // Reset input tracking
  };

  const handleChange = (value: string) => {
    setCurrentInput(value);
  };

  const showSlashHelp = currentInput.startsWith("/") && currentInput.length >= 1;
  const registry = getSlashCommandRegistry();
  const allCommands = registry.listCommands();

  return (
    <Box flexDirection="column">
      {showSlashHelp && (
        <SlashCommandHelp
          commands={allCommands}
          filter={currentInput.length > 1 ? currentInput : undefined}
        />
      )}

      <Box borderStyle="round" borderColor="cyan" paddingX={1}>
        <Text color="gray">→ </Text>
        <TextInput
          key={`${resetToken}-${inputKey}`}
          placeholder="Plan, search, build anything"
          onSubmit={handleSubmit}
          onChange={handleChange}
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
