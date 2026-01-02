/* @jsxImportSource @opentui/solid */
/// <reference path="../../types.d.ts" />
/**
 * Session Header
 *
 * Top bar with session info, model indicator, and navigation.
 */

import { createMemo } from "solid-js";
import { useTheme } from "../../context/theme.js";
import { useAgent } from "../../context/agent.js";
import { useKeybind } from "../../context/keybind.js";

export function Header() {
  const { theme } = useTheme();
  const { getModel } = useAgent();
  const { formatKeybind, getBindingForAction } = useKeybind();

  const modelDisplay = createMemo(() => {
    const model = getModel();
    // Shorten model name for display
    if (model.includes("claude")) {
      if (model.includes("opus")) return "claude-opus";
      if (model.includes("sonnet")) return "claude-sonnet";
      if (model.includes("haiku")) return "claude-haiku";
    }
    return model.split("/").pop() || model;
  });

  const shortcuts = createMemo(() => {
    const bindings = [
      { action: "exit", label: "quit" },
      { action: "command.open", label: "cmds" },
      { action: "output.expand", label: "output" },
    ];

    return bindings
      .map((b) => {
        const binding = getBindingForAction(b.action);
        return binding ? `${formatKeybind(binding)} ${b.label}` : null;
      })
      .filter(Boolean);
  });

  return (
    <box
      borderStyle="single"
      borderBottom
      paddingX={1}
      flexDirection="row"
      justifyContent="space-between"
    >
      {/* Left: Logo and session info */}
      <box flexDirection="row" gap={2}>
        <text color={theme().colors.primary} bold>
          Bootstrap
        </text>
        <text color={theme().colors.muted}>|</text>
        <text color={theme().colors.accent}>{modelDisplay()}</text>
      </box>

      {/* Right: Shortcuts */}
      <box flexDirection="row" gap={2}>
        {shortcuts().map((shortcut) => (
          <text color={theme().colors.muted}>{shortcut}</text>
        ))}
      </box>
    </box>
  );
}
