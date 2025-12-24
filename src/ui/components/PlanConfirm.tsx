import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { icons } from "../theme.js";
import { PlanDisplay } from "./PlanDisplay.js";
import type { Plan } from "../../core/types.js";

type PlanOption = "yes" | "no" | "modify";

interface PlanConfirmProps {
  plan: Plan;
  onApprove: () => void;
  onReject: () => void;
  onModify: (instructions: string) => void;
}

export function PlanConfirm({
  plan,
  onApprove,
  onReject,
  onModify,
}: PlanConfirmProps) {
  const [selected, setSelected] = useState<PlanOption>("yes");
  const [showModifyInput, setShowModifyInput] = useState(false);
  const [modifyText, setModifyText] = useState("");

  useInput((input, key) => {
    // If in modify input mode, handle text input
    if (showModifyInput) {
      if (key.escape) {
        setShowModifyInput(false);
        setModifyText("");
        return;
      }
      if (key.return && modifyText.trim()) {
        onModify(modifyText.trim());
        return;
      }
      if (key.backspace || key.delete) {
        setModifyText((prev) => prev.slice(0, -1));
        return;
      }
      if (input && input.length === 1 && !key.ctrl && !key.meta) {
        setModifyText((prev) => prev + input);
      }
      return;
    }

    // Navigation between options
    if (key.leftArrow || input === "h") {
      setSelected((prev) => {
        if (prev === "yes") return "modify";
        if (prev === "no") return "yes";
        return "no";
      });
    }
    if (key.rightArrow || input === "l") {
      setSelected((prev) => {
        if (prev === "yes") return "no";
        if (prev === "no") return "modify";
        return "yes";
      });
    }

    // Quick shortcuts
    if (input === "y" || input === "Y") {
      onApprove();
      return;
    }
    if (input === "n" || input === "N") {
      onReject();
      return;
    }
    if (input === "m" || input === "M") {
      setShowModifyInput(true);
      return;
    }

    // Enter to confirm selection
    if (key.return) {
      if (selected === "yes") {
        onApprove();
      } else if (selected === "no") {
        onReject();
      } else {
        setShowModifyInput(true);
      }
    }

    // Escape to cancel
    if (key.escape) {
      onReject();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
      paddingY={0}
    >
      {/* Header */}
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          {icons.section} Plan: {plan.title}
        </Text>
      </Box>

      {/* Plan content */}
      <PlanDisplay plan={plan} />

      {/* Options */}
      <Box gap={2} marginTop={1}>
        <Box>
          <Text color={selected === "yes" ? "green" : "gray"}>
            {selected === "yes" ? icons.chevron : " "} Yes, proceed
          </Text>
          <Text dimColor> (y)</Text>
        </Box>
        <Box>
          <Text color={selected === "no" ? "red" : "gray"}>
            {selected === "no" ? icons.chevron : " "} No, cancel
          </Text>
          <Text dimColor> (n)</Text>
        </Box>
        <Box>
          <Text color={selected === "modify" ? "yellow" : "gray"}>
            {selected === "modify" ? icons.chevron : " "} Modify...
          </Text>
          <Text dimColor> (m)</Text>
        </Box>
      </Box>

      {/* Modify input (shown only when selected) */}
      {showModifyInput && (
        <Box flexDirection="column" marginTop={1} borderStyle="single" borderColor="yellow" paddingX={1}>
          <Box marginBottom={1}>
            <Text color="yellow">What would you like to change?</Text>
          </Box>
          <Box>
            <Text color="yellow">{icons.chevron} </Text>
            <Text>{modifyText}</Text>
            <Text dimColor>_</Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>enter submit {icons.bullet} esc cancel</Text>
          </Box>
        </Box>
      )}

      {/* Hint */}
      {!showModifyInput && (
        <Box marginTop={1}>
          <Text dimColor>
            arrows select {icons.bullet} enter confirm {icons.bullet} esc cancel
          </Text>
        </Box>
      )}
    </Box>
  );
}
