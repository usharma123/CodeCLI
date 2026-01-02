/* @jsxImportSource @opentui/solid */
/// <reference path="../../types.d.ts" />
/**
 * History Component
 *
 * Displays prompt history for navigation.
 */

import { For, Show } from "solid-js";
import { useTheme } from "../../context/theme.js";
import { usePrompt } from "../../context/prompt.js";

interface HistoryProps {
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function History(props: HistoryProps) {
  const { theme } = useTheme();
  const { history, historyIndex } = usePrompt();

  return (
    <Show when={history().length > 0}>
      <box
        flexDirection="column"
        borderStyle="single"
        borderColor={theme().colors.muted}
        marginBottom={1}
        maxHeight={8}
      >
        <box paddingX={1} borderBottom borderColor={theme().colors.border}>
          <text bold>History</text>
        </box>

        <For each={history().slice(0, 10)}>
          {(item, index) => (
            <box
              paddingX={1}
              backgroundColor={
                index() === historyIndex() ? theme().colors.accent : undefined
              }
            >
              <text
                color={
                  index() === historyIndex()
                    ? theme().colors.background
                    : theme().colors.foreground
                }
                wrap="truncate"
              >
                {item}
              </text>
            </box>
          )}
        </For>

        <Show when={history().length > 10}>
          <box paddingX={1}>
            <text color={theme().colors.muted}>
              +{history().length - 10} more...
            </text>
          </box>
        </Show>
      </box>
    </Show>
  );
}
