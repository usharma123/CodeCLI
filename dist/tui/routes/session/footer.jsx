/* @jsxImportSource solid-js */
/// <reference path="../../types.d.ts" />
/**
 * Session Footer
 *
 * Bottom status bar with processing status, tokens, and hints.
 */
import { Show, createMemo, createSignal, createEffect, onCleanup } from "solid-js";
import { useTheme } from "../../context/theme.js";
import { useSync } from "../../context/sync.js";
import { usePrompt } from "../../context/prompt.js";
export function Footer() {
    const { theme } = useTheme();
    const { state } = useSync();
    const { mode } = usePrompt();
    // Elapsed time tracking
    const [elapsed, setElapsed] = createSignal(0);
    createEffect(() => {
        if (state.isProcessing && state.processingStartTime) {
            const interval = setInterval(() => {
                setElapsed(Math.floor((Date.now() - state.processingStartTime) / 1000));
            }, 1000);
            onCleanup(() => clearInterval(interval));
        }
        else {
            setElapsed(0);
        }
    });
    const formatElapsed = (seconds) => {
        if (seconds < 60)
            return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };
    const modeIndicator = createMemo(() => {
        const m = mode();
        switch (m) {
            case "command":
                return { label: "CMD", color: theme().colors.accent };
            case "file":
                return { label: "FILE", color: theme().colors.info };
            case "shell":
                return { label: "SHELL", color: theme().colors.warning };
            default:
                return null;
        }
    });
    const spinnerFrames = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
    const [spinnerIndex, setSpinnerIndex] = createSignal(0);
    createEffect(() => {
        if (state.isProcessing) {
            const interval = setInterval(() => {
                setSpinnerIndex((i) => (i + 1) % spinnerFrames.length);
            }, 80);
            onCleanup(() => clearInterval(interval));
        }
    });
    return (<box borderStyle="single" borderTop paddingX={1} flexDirection="row" justifyContent="space-between">
      {/* Left: Status */}
      <box flexDirection="row" gap={2}>
        <Show when={state.isProcessing}>
          <text color={theme().colors.primary}>
            {spinnerFrames[spinnerIndex()]} {state.status.message || "Processing..."}
          </text>
          <text color={theme().colors.muted}>({formatElapsed(elapsed())})</text>
        </Show>

        <Show when={!state.isProcessing}>
          <text color={theme().colors.success}>{theme().icons.success} Ready</text>
        </Show>

        {/* Mode indicator */}
        <Show when={modeIndicator()}>
          {(indicator) => (<text color={indicator().color} bold>
              [{indicator().label}]
            </text>)}
        </Show>
      </box>

      {/* Right: Token info placeholder */}
      <box flexDirection="row" gap={2}>
        <text color={theme().colors.muted}>
          / command | @ file | ! shell
        </text>
      </box>
    </box>);
}
