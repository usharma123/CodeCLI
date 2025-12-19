import React, { useState } from "react";
import { Box, Text } from "ink";
import { TextInput } from "@inkjs/ui";
import { SlashCommandHelp } from "./SlashCommandHelp.js";
import { getSlashCommandRegistry } from "../../core/slash-commands.js";
import { icons } from "../theme.js";

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
    setInputKey((prev) => prev + 1);
    setCurrentInput("");
  };

  const handleChange = (value: string) => {
    setCurrentInput(value);
  };

  const showSlashHelp = currentInput.startsWith("/") && currentInput.length >= 1;
  const registry = getSlashCommandRegistry();
  const allCommands = registry.listCommands();

  // Detect input mode
  const inputMode = currentInput.startsWith("/")
    ? "command"
    : currentInput.startsWith("@")
    ? "file"
    : currentInput.startsWith("!")
    ? "shell"
    : null;

  // Mode-based styling (subtle) - only change border color, not prompt
  // This avoids duplication since the input already contains the mode character
  const borderColor = inputMode === "command"
    ? "blue"
    : inputMode === "file"
    ? "green"
    : inputMode === "shell"
    ? "yellow"
    : "gray";

  return (
    <Box flexDirection="column">
      {showSlashHelp && (
        <SlashCommandHelp
          commands={allCommands}
          filter={currentInput.length > 1 ? currentInput : undefined}
        />
      )}

      <Box borderStyle="single" borderColor={borderColor} paddingX={1}>
        <Text color={inputMode ? borderColor : "gray"}>
          {">"}{" "}
        </Text>
        <TextInput
          key={`${resetToken}-${inputKey}`}
          placeholder="ask anything..."
          onSubmit={handleSubmit}
          onChange={handleChange}
          isDisabled={isDisabled}
        />
      </Box>

      {/* Minimal status line */}
      <Box paddingLeft={1}>
        <Text dimColor>
          session {sessionNum}
          {currentInput.length > 80 && ` ${icons.bullet} ${currentInput.length} chars`}
        </Text>
      </Box>
    </Box>
  );
}

// Minimal input variant
interface MinimalInputProps {
  onSubmit: (value: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
}

export function MinimalInput({
  onSubmit,
  placeholder = "...",
  isDisabled = false,
}: MinimalInputProps) {
  const [inputKey, setInputKey] = useState(0);

  const handleSubmit = (value: string) => {
    onSubmit(value);
    setInputKey((prev) => prev + 1);
  };

  return (
    <Box>
      <Text dimColor>{icons.chevron} </Text>
      <TextInput
        key={inputKey}
        placeholder={placeholder}
        onSubmit={handleSubmit}
        isDisabled={isDisabled}
      />
    </Box>
  );
}
