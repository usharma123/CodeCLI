import React from "react";
import { Box, Text } from "ink";
import { useSpinnerFrames, useElapsedTime } from "../hooks/useAnimation.js";
import { icons } from "../theme.js";

type SpinnerStyle = "dots" | "line" | "pulse";

interface SpinnerProps {
  label?: string;
  style?: SpinnerStyle;
  color?: "cyan" | "blue" | "green" | "yellow" | "white";
  showElapsed?: boolean;
  startTime?: number;
}

const spinnerFrames: Record<SpinnerStyle, readonly string[]> = {
  dots: icons.spinnerDots,
  line: icons.spinnerLine,
  pulse: icons.spinnerPulse,
};

const spinnerSpeeds: Record<SpinnerStyle, number> = {
  dots: 80,
  line: 100,
  pulse: 200,
};

export function Spinner({
  label = "processing...",
  style = "dots",
  color = "cyan",
  showElapsed = true,
  startTime,
}: SpinnerProps) {
  const frames = spinnerFrames[style];
  const speed = spinnerSpeeds[style];
  const frame = useSpinnerFrames(frames, speed);
  const elapsed = useElapsedTime(showElapsed ? (startTime || Date.now()) : null);

  return (
    <Box>
      <Text color={color}>{frame} </Text>
      <Text>{label}</Text>
      {showElapsed && elapsed && <Text dimColor> {elapsed}</Text>}
    </Box>
  );
}

// Spinner with end state
interface StatusSpinnerProps extends SpinnerProps {
  status?: "loading" | "success" | "error";
  successMessage?: string;
  errorMessage?: string;
}

export function StatusSpinner({
  label = "processing...",
  style = "dots",
  color = "cyan",
  showElapsed = true,
  startTime,
  status = "loading",
  successMessage = "done",
  errorMessage = "failed",
}: StatusSpinnerProps) {
  const frames = spinnerFrames[style];
  const speed = spinnerSpeeds[style];
  const frame = useSpinnerFrames(frames, speed);
  const elapsed = useElapsedTime(status === "loading" ? (startTime || Date.now()) : null);

  if (status === "success") {
    return (
      <Box>
        <Text color="green">{icons.success} </Text>
        <Text color="green">{successMessage}</Text>
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box>
        <Text color="red">{icons.error} </Text>
        <Text color="red">{errorMessage}</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text color={color}>{frame} </Text>
      <Text>{label}</Text>
      {showElapsed && elapsed && <Text dimColor> {elapsed}</Text>}
    </Box>
  );
}

// Inline spinner
export function InlineSpinner({ color = "cyan" }: { color?: "cyan" | "blue" | "green" | "yellow" }) {
  const frame = useSpinnerFrames(icons.spinnerDots, 80);
  return <Text color={color}>{frame}</Text>;
}

// Multi-stage spinner
interface MultiStageSpinnerProps {
  stages: Array<{
    label: string;
    status: "pending" | "loading" | "success" | "error";
  }>;
}

export function MultiStageSpinner({ stages }: MultiStageSpinnerProps) {
  const frame = useSpinnerFrames(icons.spinnerDots, 80);

  return (
    <Box flexDirection="column">
      {stages.map((stage, i) => {
        let icon: string;
        let color: string;

        switch (stage.status) {
          case "success":
            icon = icons.success;
            color = "green";
            break;
          case "error":
            icon = icons.error;
            color = "red";
            break;
          case "loading":
            icon = frame;
            color = "cyan";
            break;
          default:
            icon = icons.pending;
            color = "gray";
        }

        return (
          <Box key={i}>
            <Text color={color as any}>{icon} </Text>
            <Text color={color as any} dimColor={stage.status === "pending"}>
              {stage.label}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
