/* @jsxImportSource @opentui/solid */
/// <reference path="../types.d.ts" />
/**
 * Todo List Component
 *
 * Displays task list with progress tracking.
 */

import { For, Show, createMemo, createSignal, createEffect, onCleanup } from "solid-js";
import { useTheme } from "../context/theme.js";
import type { TodoItem as TodoItemType } from "../context/sync.js";

interface TodoListProps {
  todos: TodoItemType[];
}

export function TodoList(props: TodoListProps) {
  const { theme } = useTheme();

  const completedCount = createMemo(() =>
    props.todos.filter((t) => t.status === "completed").length
  );

  const progress = createMemo(() => {
    if (props.todos.length === 0) return 0;
    return Math.round((completedCount() / props.todos.length) * 100);
  });

  // Spinner animation for in-progress items
  const spinnerFrames = ["\u25D0", "\u25D3", "\u25D1", "\u25D2"];
  const [spinnerIndex, setSpinnerIndex] = createSignal(0);

  createEffect(() => {
    const hasInProgress = props.todos.some((t) => t.status === "in_progress");
    if (hasInProgress) {
      const interval = setInterval(() => {
        setSpinnerIndex((i) => (i + 1) % spinnerFrames.length);
      }, 100);
      onCleanup(() => clearInterval(interval));
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return { icon: theme().icons.completed, color: theme().colors.success };
      case "in_progress":
        return { icon: spinnerFrames[spinnerIndex()], color: theme().colors.warning };
      default:
        return { icon: theme().icons.pending, color: theme().colors.muted };
    }
  };

  return (
    <box
      flexDirection="column"
      borderStyle="single"
      borderColor={theme().colors.border}
      marginY={1}
      padding={1}
    >
      {/* Header with progress */}
      <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
        <text bold>Tasks</text>
        <text color={theme().colors.muted}>
          {completedCount()}/{props.todos.length} ({progress()}%)
        </text>
      </box>

      {/* Progress bar */}
      <box marginBottom={1}>
        <text color={theme().colors.muted}>[</text>
        <text color={theme().colors.success}>
          {"█".repeat(Math.floor(progress() / 5))}
        </text>
        <text color={theme().colors.border}>
          {"░".repeat(20 - Math.floor(progress() / 5))}
        </text>
        <text color={theme().colors.muted}>]</text>
      </box>

      {/* Todo items */}
      <For each={props.todos}>
        {(todo) => {
          const status = getStatusIcon(todo.status);
          return (
            <box flexDirection="row">
              <text color={status.color}>{status.icon} </text>
              <text
                color={
                  todo.status === "completed"
                    ? theme().colors.muted
                    : theme().colors.foreground
                }
                strikethrough={todo.status === "completed"}
                wrap="truncate"
              >
                {todo.status === "in_progress" && todo.activeForm
                  ? todo.activeForm
                  : todo.content}
              </text>
            </box>
          );
        }}
      </For>
    </box>
  );
}
