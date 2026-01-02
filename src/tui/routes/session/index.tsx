/* @jsxImportSource @opentui/solid */
/// <reference path="../../types.d.ts" />
/**
 * Session Route
 *
 * Main conversation view with header, messages, prompt, footer, and sidebar.
 */

import { Show, createSignal } from "solid-js";
import { useTheme } from "../../context/theme.js";
import { useSync } from "../../context/sync.js";
import { useAgent } from "../../context/agent.js";
import { useDialog } from "../../context/dialog.js";
import { Header } from "./header.js";
import { Footer } from "./footer.js";
import { Sidebar } from "./sidebar.js";
import { Messages } from "./messages.js";
import { Prompt } from "../../component/prompt/index.js";
import { TodoList } from "../../component/todo-item.js";
import { DialogContainer } from "../../ui/dialog.js";
import { ToastContainer } from "../../ui/toast.js";

export function Session() {
  const { theme } = useTheme();
  const { state } = useSync();
  const { processInput } = useAgent();
  const dialog = useDialog();

  const [showSidebar, setShowSidebar] = createSignal(false);
  const [expandedOutputId, setExpandedOutputId] = createSignal<string | null>(null);

  const handleSubmit = async (input: string) => {
    if (!input.trim()) return;

    try {
      await processInput(input);
    } catch (error) {
      // Error is handled by sync context
    }
  };

  return (
    <box flexDirection="column" flexGrow={1}>
      <Header />

      <box flexDirection="row" flexGrow={1}>
        <box flexDirection="column" flexGrow={1}>
          <box flexGrow={1} overflow="scroll">
            <Messages expandedOutputId={expandedOutputId()} />
          </box>

          <Show when={state.todos.length > 0}>
            <TodoList todos={state.todos} />
          </Show>

          <Prompt onSubmit={handleSubmit} />
        </box>

        <Show when={showSidebar()}>
          <Sidebar />
        </Show>
      </box>

      <Footer />

      <Show when={dialog.isOpen()}>
        <DialogContainer />
      </Show>

      <ToastContainer />
    </box>
  );
}
