import React from "react";
import { Box, Text } from "ink";
import { useSpinnerFrames, useElapsedTime } from "../hooks/useAnimation.js";
import { icons } from "../theme.js";

interface StatusBarProps {
  message: string;
  isProcessing?: boolean;
  startTime?: number;
  phase?: string;
  progress?: { current: number; total: number };
}

export function StatusBar({
  message,
  isProcessing = false,
  startTime,
  phase,
  progress,
}: StatusBarProps) {
  const spinnerFrame = useSpinnerFrames(icons.spinnerDots, 80);
  const elapsed = useElapsedTime(isProcessing ? startTime || null : null);

  if (!isProcessing) {
    return null;
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      marginBottom={1}
    >
      {/* Main status */}
      <Box>
        <Text color="cyan">{spinnerFrame} </Text>
        <Text>{message}</Text>
        {elapsed && <Text dimColor> {elapsed}</Text>}
      </Box>

      {/* Phase */}
      {phase && (
        <Box>
          <Text dimColor>  {icons.arrowRight} {phase}</Text>
        </Box>
      )}

      {/* Progress */}
      {progress && progress.total > 0 && (
        <Box>
          <Text dimColor>
            {"  "}step {progress.current}/{progress.total}
          </Text>
        </Box>
      )}
    </Box>
  );
}

// Inline status (compact)
interface InlineStatusProps {
  message: string;
  isProcessing?: boolean;
}

export function InlineStatus({
  message,
  isProcessing = false,
}: InlineStatusProps) {
  const spinnerFrame = useSpinnerFrames(icons.spinnerDots, 80);

  if (!isProcessing) {
    return null;
  }

  return (
    <Box>
      <Text color="cyan">{spinnerFrame} </Text>
      <Text dimColor>{message}</Text>
    </Box>
  );
}

// Status with completion state
interface CompletableStatusProps {
  status: "idle" | "loading" | "success" | "error";
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  startTime?: number;
}

export function CompletableStatus({
  status,
  loadingMessage = "processing...",
  successMessage = "done",
  errorMessage = "failed",
  startTime,
}: CompletableStatusProps) {
  const spinnerFrame = useSpinnerFrames(icons.spinnerDots, 80);
  const elapsed = useElapsedTime(status === "loading" ? startTime || Date.now() : null);

  if (status === "idle") {
    return null;
  }

  if (status === "success") {
    return (
      <Box marginBottom={1}>
        <Text color="green">{icons.success} </Text>
        <Text color="green">{successMessage}</Text>
      </Box>
    );
  }

  if (status === "error") {
    return (
      <Box marginBottom={1}>
        <Text color="red">{icons.error} </Text>
        <Text color="red">{errorMessage}</Text>
      </Box>
    );
  }

  return (
    <Box marginBottom={1}>
      <Text color="cyan">{spinnerFrame} </Text>
      <Text>{loadingMessage}</Text>
      {elapsed && <Text dimColor> {elapsed}</Text>}
    </Box>
  );
}

// Multi-step status
interface StepStatusProps {
  steps: Array<{
    id: string;
    label: string;
    status: "pending" | "current" | "completed" | "error";
  }>;
  currentStepMessage?: string;
}

export function StepStatus({ steps, currentStepMessage }: StepStatusProps) {
  const spinnerFrame = useSpinnerFrames(icons.spinnerDots, 80);

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const totalCount = steps.length;

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      marginBottom={1}
    >
      {/* Header */}
      <Box marginBottom={1}>
        <Text>progress</Text>
        <Text dimColor> {completedCount}/{totalCount}</Text>
      </Box>

      {/* Steps */}
      {steps.map((step) => {
        let icon: string;
        let color: string;

        switch (step.status) {
          case "completed":
            icon = icons.success;
            color = "green";
            break;
          case "current":
            icon = spinnerFrame;
            color = "cyan";
            break;
          case "error":
            icon = icons.error;
            color = "red";
            break;
          default:
            icon = icons.pending;
            color = "gray";
        }

        return (
          <Box key={step.id}>
            <Text color={color as any}>{icon} </Text>
            <Text color={color as any} dimColor={step.status === "pending"}>
              {step.label}
            </Text>
          </Box>
        );
      })}

      {/* Current message */}
      {currentStepMessage && (
        <Box marginTop={1}>
          <Text dimColor>{icons.arrowRight} {currentStepMessage}</Text>
        </Box>
      )}
    </Box>
  );
}
