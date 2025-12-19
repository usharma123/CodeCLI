import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { icons } from "../theme.js";

interface ConfirmProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "default" | "danger";
}

export function Confirm({
  message,
  onConfirm,
  onCancel,
  variant = "default",
}: ConfirmProps) {
  const [selected, setSelected] = useState<"yes" | "no">("yes");

  useInput((input, key) => {
    if (key.leftArrow || key.rightArrow || input === "h" || input === "l") {
      setSelected((prev) => (prev === "yes" ? "no" : "yes"));
    }
    if (key.return) {
      selected === "yes" ? onConfirm() : onCancel();
    }
    if (input === "y" || input === "Y") onConfirm();
    if (input === "n" || input === "N") onCancel();
    if (key.escape) onCancel();
  });

  const isDanger = variant === "danger";
  const borderColor = isDanger ? "red" : "yellow";

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={borderColor}
      paddingX={1}
    >
      {/* Question */}
      <Box marginBottom={1}>
        <Text color={borderColor}>{isDanger ? "!" : "?"} </Text>
        <Text>{message}</Text>
      </Box>

      {/* Options */}
      <Box gap={2}>
        <Box>
          <Text color={selected === "yes" ? "green" : "gray"}>
            {selected === "yes" ? ">" : " "} yes
          </Text>
          <Text dimColor> (y)</Text>
        </Box>
        <Box>
          <Text color={selected === "no" ? "red" : "gray"}>
            {selected === "no" ? ">" : " "} no
          </Text>
          <Text dimColor> (n)</Text>
        </Box>
      </Box>

      {/* Hint */}
      <Box marginTop={1}>
        <Text dimColor>
          arrows select {icons.bullet} enter confirm {icons.bullet} esc cancel
        </Text>
      </Box>
    </Box>
  );
}

// Quick inline confirm
interface QuickConfirmProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function QuickConfirm({ message, onConfirm, onCancel }: QuickConfirmProps) {
  useInput((input, key) => {
    if (input === "y" || input === "Y") onConfirm();
    if (input === "n" || input === "N" || key.escape) onCancel();
  });

  return (
    <Box>
      <Text color="yellow">? </Text>
      <Text>{message}</Text>
      <Text dimColor> (y/n)</Text>
    </Box>
  );
}

// Danger confirm requiring typed confirmation
interface DangerConfirmProps {
  message: string;
  action: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DangerConfirm({
  message,
  action,
  onConfirm,
  onCancel,
}: DangerConfirmProps) {
  const [confirmText, setConfirmText] = useState("");
  const isConfirmed = confirmText.toLowerCase() === action.toLowerCase();

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.return && isConfirmed) {
      onConfirm();
      return;
    }
    if (key.backspace || key.delete) {
      setConfirmText((prev) => prev.slice(0, -1));
      return;
    }
    if (input && input.length === 1 && !key.ctrl && !key.meta) {
      setConfirmText((prev) => prev + input);
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="red"
      paddingX={1}
    >
      <Box marginBottom={1}>
        <Text color="red">! danger</Text>
      </Box>

      <Box marginBottom={1}>
        <Text>{message}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>type "</Text>
        <Text color="red">{action}</Text>
        <Text dimColor>" to confirm:</Text>
      </Box>

      <Box>
        <Text color={isConfirmed ? "green" : "white"}>{icons.chevron} {confirmText}</Text>
        <Text dimColor>_</Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>esc cancel</Text>
      </Box>
    </Box>
  );
}
