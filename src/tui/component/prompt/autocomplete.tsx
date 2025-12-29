/* @jsxImportSource solid-js */
/// <reference path="../../types.d.ts" />
/**
 * Autocomplete Component
 *
 * Dropdown for command suggestions.
 */

import { For, createMemo, createSignal } from "solid-js";
import { useTheme } from "../../context/theme.js";

interface AutocompleteProps {
  query: string;
  onSelect: (command: string) => void;
  onClose: () => void;
}

// Built-in slash commands
const COMMANDS = [
  { name: "plan", description: "Enter planning mode" },
  { name: "lsp", description: "Toggle LSP diagnostics" },
  { name: "agents", description: "Toggle sub-agents" },
  { name: "clear", description: "Clear conversation" },
  { name: "help", description: "Show help" },
  { name: "exit", description: "Exit application" },
  { name: "model", description: "Switch model" },
  { name: "session", description: "Session management" },
  { name: "theme", description: "Change theme" },
];

export function Autocomplete(props: AutocompleteProps) {
  const { theme } = useTheme();
  const [selectedIndex, setSelectedIndex] = createSignal(0);

  const filteredCommands = createMemo(() => {
    const query = props.query.toLowerCase();
    if (!query) return COMMANDS;

    return COMMANDS.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query)
    );
  });

  // Reset selection when results change
  createMemo(() => {
    if (selectedIndex() >= filteredCommands().length) {
      setSelectedIndex(0);
    }
  });

  const handleSelect = () => {
    const selected = filteredCommands()[selectedIndex()];
    if (selected) {
      props.onSelect(selected.name);
    }
  };

  return (
    <box
      flexDirection="column"
      borderStyle="single"
      borderColor={theme().colors.accent}
      marginBottom={1}
      maxHeight={10}
    >
      <For each={filteredCommands()}>
        {(cmd, index) => (
          <box
            paddingX={1}
            backgroundColor={
              index() === selectedIndex() ? theme().colors.accent : undefined
            }
          >
            <text
              color={
                index() === selectedIndex()
                  ? theme().colors.background
                  : theme().colors.foreground
              }
              bold={index() === selectedIndex()}
            >
              /{cmd.name}
            </text>
            <text
              color={
                index() === selectedIndex()
                  ? theme().colors.background
                  : theme().colors.muted
              }
            >
              {" "}
              - {cmd.description}
            </text>
          </box>
        )}
      </For>

      {/* Navigation hint */}
      <box paddingX={1} borderTop borderColor={theme().colors.border}>
        <text color={theme().colors.muted}>
          {theme().icons.arrow} Tab to select | Esc to close
        </text>
      </box>
    </box>
  );
}
