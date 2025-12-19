import React from "react";
import { Box, Text } from "ink";
import { useAnimatedProgress } from "../hooks/useAnimation.js";
import { icons } from "../theme.js";

type ProgressBarColor = "cyan" | "magenta" | "blue" | "green" | "yellow";
type ProgressBarSize = "compact" | "standard" | "large";

interface ProgressBarProps {
  progress: number; // 0-100
  width?: number;
  color?: ProgressBarColor;
  size?: ProgressBarSize;
  showPercentage?: boolean;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
}

const sizeWidths: Record<ProgressBarSize, number> = {
  compact: 20,
  standard: 30,
  large: 50,
};

const fillChars = {
  full: "█",
  empty: "░",
  partial: ["▏", "▎", "▍", "▌", "▋", "▊", "▉"],
};

export function ProgressBar({
  progress,
  width,
  color = "cyan",
  size = "standard",
  showPercentage = true,
  showLabel = false,
  label,
  animated = true,
}: ProgressBarProps) {
  const barWidth = width || sizeWidths[size];
  const animatedProgress = animated ? useAnimatedProgress(progress) : progress;

  // Clamp progress
  const clampedProgress = Math.max(0, Math.min(100, animatedProgress));

  // Calculate filled width
  const filledWidth = (clampedProgress / 100) * barWidth;
  const fullBlocks = Math.floor(filledWidth);
  const partialIndex = Math.floor((filledWidth - fullBlocks) * 7);

  // Build the bar
  const filled = fillChars.full.repeat(fullBlocks);
  const partial = partialIndex > 0 ? fillChars.partial[partialIndex - 1] : "";
  const empty = fillChars.empty.repeat(Math.max(0, barWidth - fullBlocks - (partial ? 1 : 0)));

  return (
    <Box>
      {showLabel && label && (
        <Box marginRight={1}>
          <Text dimColor>{label}</Text>
        </Box>
      )}
      <Text color={color}>{filled}{partial}</Text>
      <Text dimColor>{empty}</Text>
      {showPercentage && (
        <Text dimColor> {Math.round(clampedProgress)}%</Text>
      )}
    </Box>
  );
}

// Indeterminate progress bar (animated pattern)
interface IndeterminateProgressProps {
  width?: number;
  color?: ProgressBarColor;
  label?: string;
}

export function IndeterminateProgress({
  width = 30,
  color = "cyan",
  label,
}: IndeterminateProgressProps) {
  const [offset, setOffset] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setOffset((o) => (o + 1) % width);
    }, 100);

    return () => clearInterval(interval);
  }, [width]);

  // Create a moving highlight pattern
  const pattern = Array(width)
    .fill(null)
    .map((_, i) => {
      const distance = Math.abs(i - offset);
      if (distance < 3) {
        return fillChars.full;
      }
      return fillChars.empty;
    })
    .join("");

  return (
    <Box>
      {label && (
        <Box marginRight={1}>
          <Text dimColor>{label}</Text>
        </Box>
      )}
      <Text color={color}>{pattern}</Text>
    </Box>
  );
}

// Progress with stages
interface StagedProgressProps {
  stages: Array<{
    label: string;
    status: "pending" | "current" | "completed";
  }>;
  color?: ProgressBarColor;
}

export function StagedProgress({ stages, color = "cyan" }: StagedProgressProps) {
  const completedCount = stages.filter((s) => s.status === "completed").length;
  const progress = (completedCount / stages.length) * 100;

  return (
    <Box flexDirection="column">
      <ProgressBar progress={progress} color={color} showPercentage={false} />
      <Box marginTop={1}>
        {stages.map((stage, i) => {
          const icon =
            stage.status === "completed"
              ? icons.success
              : stage.status === "current"
              ? icons.inProgress
              : icons.pending;

          const textColor =
            stage.status === "completed"
              ? "green"
              : stage.status === "current"
              ? color
              : "gray";

          return (
            <Box key={i} marginRight={2}>
              <Text color={textColor as any}>{icon} </Text>
              <Text
                color={textColor as any}
                dimColor={stage.status === "pending"}
              >
                {stage.label}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// Compact progress indicator (just percentage with icon)
interface CompactProgressProps {
  progress: number;
  color?: ProgressBarColor;
}

export function CompactProgress({ progress, color = "cyan" }: CompactProgressProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <Box>
      <Text color={color}>{icons.inProgress}</Text>
      <Text> </Text>
      <Text color={color} bold>
        {Math.round(clampedProgress)}%
      </Text>
    </Box>
  );
}
