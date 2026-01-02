/* @jsxImportSource @opentui/solid */
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
    ____              __       __
   / __ )____  ____  / /______/ /__________ _____
  / __  / __ \\/ __ \\/ __/ ___/ __/ ___/ __ '/ __ \\
 / /_/ / /_/ / /_/ / /_(__  ) /_/ /  / /_/ / /_/ /
/_____/\\____/\\____/\\__/____/\\__/_/   \\__,_/ .___/
                                         /_/
          `}
        </text>
      </box>

      <text color={theme().colors.muted}>AI-powered coding agent</text>

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
