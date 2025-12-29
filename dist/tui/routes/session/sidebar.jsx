/* @jsxImportSource solid-js */
/// <reference path="../../types.d.ts" />
/**
 * Session Sidebar
 *
 * Right panel showing session info, tokens, LSP status, todos, and files.
 */
import { Show, For, createMemo } from "solid-js";
import { useTheme } from "../../context/theme.js";
import { useSync } from "../../context/sync.js";
import { useAgent } from "../../context/agent.js";
export function Sidebar() {
    const { theme } = useTheme();
    const { state } = useSync();
    const { getModel } = useAgent();
    const activeTodos = createMemo(() => state.todos.filter((t) => t.status === "in_progress"));
    const pendingTodos = createMemo(() => state.todos.filter((t) => t.status === "pending"));
    const completedTodos = createMemo(() => state.todos.filter((t) => t.status === "completed"));
    const todoProgress = createMemo(() => {
        const total = state.todos.length;
        if (total === 0)
            return 0;
        return Math.round((completedTodos().length / total) * 100);
    });
    return (<box width={30} borderStyle="single" borderLeft flexDirection="column" padding={1}>
      {/* Session Info */}
      <box flexDirection="column" marginBottom={1}>
        <text bold color={theme().colors.primary}>
          Session
        </text>
        <text color={theme().colors.muted} wrap="truncate">
          Model: {getModel().split("/").pop()}
        </text>
      </box>

      {/* Separator */}
      <text color={theme().colors.border}>{"─".repeat(26)}</text>

      {/* Todos Section */}
      <Show when={state.todos.length > 0}>
        <box flexDirection="column" marginY={1}>
          <box flexDirection="row" justifyContent="space-between">
            <text bold>Tasks</text>
            <text color={theme().colors.muted}>
              {completedTodos().length}/{state.todos.length}
            </text>
          </box>

          {/* Progress bar */}
          <box marginY={1}>
            <text color={theme().colors.muted}>[</text>
            <text color={theme().colors.success}>
              {"█".repeat(Math.floor(todoProgress() / 5))}
            </text>
            <text color={theme().colors.border}>
              {"░".repeat(20 - Math.floor(todoProgress() / 5))}
            </text>
            <text color={theme().colors.muted}>] {todoProgress()}%</text>
          </box>

          {/* Active task */}
          <Show when={activeTodos().length > 0}>
            <For each={activeTodos()}>
              {(todo) => (<box>
                  <text color={theme().colors.warning}>
                    {theme().icons.active}{" "}
                  </text>
                  <text wrap="truncate">{todo.activeForm || todo.content}</text>
                </box>)}
            </For>
          </Show>

          {/* Pending tasks (show max 3) */}
          <Show when={pendingTodos().length > 0}>
            <For each={pendingTodos().slice(0, 3)}>
              {(todo) => (<box>
                  <text color={theme().colors.muted}>
                    {theme().icons.pending}{" "}
                  </text>
                  <text color={theme().colors.muted} wrap="truncate">
                    {todo.content}
                  </text>
                </box>)}
            </For>
            <Show when={pendingTodos().length > 3}>
              <text color={theme().colors.muted}>
                +{pendingTodos().length - 3} more...
              </text>
            </Show>
          </Show>
        </box>

        {/* Separator */}
        <text color={theme().colors.border}>{"─".repeat(26)}</text>
      </Show>

      {/* Status Section */}
      <box flexDirection="column" marginY={1}>
        <text bold>Status</text>
        <Show when={state.isProcessing} fallback={<text color={theme().colors.success}>
              {theme().icons.success} Idle
            </text>}>
          <text color={theme().colors.warning}>
            {theme().icons.active} Processing
          </text>
        </Show>
      </box>

      {/* Help hint at bottom */}
      <box flexGrow={1}/>
      <text color={theme().colors.muted} wrap="wrap">
        ^P command palette
      </text>
    </box>);
}
