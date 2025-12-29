/* @jsxImportSource solid-js */
/// <reference path="../types.d.ts" />
/**
 * Home Route
 *
 * Welcome screen with session list and quick actions.
 */

import { For, Show } from "solid-js";
import { useRoute } from "../context/route.js";
import { useTheme } from "../context/theme.js";
import { useKeybind } from "../context/keybind.js";

export function Home() {
  const route = useRoute();
  const { theme } = useTheme();
  const { formatKeybind, getBindingForAction } = useKeybind();

  const shortcuts = [
    { action: "session.new", label: "New Session" },
    { action: "session.list", label: "Session List" },
    { action: "command.open", label: "Command Palette" },
    { action: "theme.toggle", label: "Toggle Theme" },
  ];

  return (
    <box flexDirection="column" padding={1}>
      {/* Logo */}
      <box marginBottom={1}>
        <text color={theme().colors.primary} bold>
          {`
   ______          __     ________    ____
  / ____/___  ____/ /__  / ____/ /   /  _/
 / /   / __ \\/ __  / _ \\/ /   / /    / /
/ /___/ /_/ / /_/ /  __/ /___/ /____/ /
\\____/\\____/\\__,_/\\___/\\____/_____/___/
          `}
        </text>
      </box>

      <text color={theme().colors.muted}>AI-powered coding assistant</text>

      {/* Quick actions */}
      <box marginTop={2} flexDirection="column">
        <text bold marginBottom={1}>
          Quick Actions
        </text>
        <For each={shortcuts}>
          {(shortcut) => {
            const binding = getBindingForAction(shortcut.action);
            return (
              <box>
                <text color={theme().colors.accent}>
                  {binding ? formatKeybind(binding) : ""}
                </text>
                <text> {shortcut.label}</text>
              </box>
            );
          }}
        </For>
      </box>

      {/* Start session prompt */}
      <box marginTop={2}>
        <text color={theme().colors.muted}>
          Press Enter or start typing to begin a new session...
        </text>
      </box>
    </box>
  );
}
