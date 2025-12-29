/* @jsxImportSource solid-js */
/// <reference path="../types.d.ts" />
/**
 * Spinner UI Component
 *
 * Animated loading indicators.
 */

import { createSignal, createEffect, onCleanup } from "solid-js";
import { useTheme } from "../context/theme.js";

export type SpinnerStyle = "dots" | "line" | "pulse";

interface SpinnerProps {
  style?: SpinnerStyle;
  color?: string;
  label?: string;
}

const SPINNER_FRAMES: Record<SpinnerStyle, string[]> = {
  dots: ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"],
  line: ["-", "\\", "|", "/"],
  pulse: ["\u25CF", "\u25CB"],
};

export function Spinner(props: SpinnerProps) {
  const { theme } = useTheme();
  const style = () => props.style || "dots";
  const frames = () => SPINNER_FRAMES[style()];

  const [frameIndex, setFrameIndex] = createSignal(0);

  createEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((i) => (i + 1) % frames().length);
    }, style() === "pulse" ? 500 : 80);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <box flexDirection="row" gap={1}>
      <text color={props.color || theme().colors.primary}>
        {frames()[frameIndex()]}
      </text>
      {props.label && <text>{props.label}</text>}
    </box>
  );
}

/**
 * Multi-stage spinner for showing progress through multiple steps.
 */
interface MultiSpinnerProps {
  stages: string[];
  currentStage: number;
  color?: string;
}

export function MultiSpinner(props: MultiSpinnerProps) {
  const { theme } = useTheme();

  return (
    <box flexDirection="column">
      {props.stages.map((stage, index) => {
        const isComplete = index < props.currentStage;
        const isCurrent = index === props.currentStage;
        const isPending = index > props.currentStage;

        return (
          <box flexDirection="row" gap={1}>
            {isComplete && (
              <text color={theme().colors.success}>{theme().icons.success}</text>
            )}
            {isCurrent && <Spinner color={props.color} />}
            {isPending && (
              <text color={theme().colors.muted}>{theme().icons.pending}</text>
            )}
            <text
              color={isPending ? theme().colors.muted : undefined}
              strikethrough={isComplete}
            >
              {stage}
            </text>
          </box>
        );
      })}
    </box>
  );
}
