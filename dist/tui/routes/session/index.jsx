/* @jsxImportSource solid-js */
/// <reference path="../../types.d.ts" />
/**
 * Session Route
 *
 * Main conversation view with header, messages, prompt, footer, and sidebar.
 */
import { Show, createSignal, createEffect, onCleanup } from "solid-js";
import { useTheme } from "../../context/theme.js";
import { useSync } from "../../context/sync.js";
import { useAgent } from "../../context/agent.js";
import { usePrompt } from "../../context/prompt.js";
import { useDialog } from "../../context/dialog.js";
import { useKeybind } from "../../context/keybind.js";
import { useExit } from "../../context/exit.js";
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
    const prompt = usePrompt();
    const dialog = useDialog();
    const { match } = useKeybind();
    const { exit } = useExit();
    const [showSidebar, setShowSidebar] = createSignal(true);
    const [expandedOutputId, setExpandedOutputId] = createSignal(null);
    // Handle keyboard input
    createEffect(() => {
        const handleKeypress = (key, ctrl, alt, shift) => {
            const action = match({ key, ctrl, alt, shift });
            if (action) {
                switch (action) {
                    case "exit":
                        exit();
                        break;
                    case "output.expand":
                        // Toggle last output expansion
                        const outputs = state.outputs;
                        if (outputs.length > 0) {
                            const lastId = outputs[outputs.length - 1].id;
                            setExpandedOutputId((current) => (current === lastId ? null : lastId));
                        }
                        break;
                    case "theme.toggle":
                        // Handled by theme context
                        break;
                    case "command.open":
                        // Open command palette
                        break;
                }
            }
        };
        // Note: Actual key handling will be done by OpenTUI's input system
        // This is a placeholder for the keybind logic
        onCleanup(() => {
            // Cleanup if needed
        });
    });
    const handleSubmit = async (input) => {
        if (!input.trim())
            return;
        prompt.addToHistory(input);
        prompt.clear();
        try {
            await processInput(input);
        }
        catch (error) {
            console.error("Error processing input:", error);
        }
    };
    return (<box flexDirection="column" height="100%">
      {/* Header */}
      <Header />

      {/* Main content area */}
      <box flexDirection="row" flexGrow={1}>
        {/* Left: Messages and prompt */}
        <box flexDirection="column" flexGrow={1}>
          {/* Messages scroll area */}
          <box flexGrow={1} overflow="scroll">
            <Messages expandedOutputId={expandedOutputId()}/>
          </box>

          {/* Todo list (if any) */}
          <Show when={state.todos.length > 0}>
            <TodoList todos={state.todos}/>
          </Show>

          {/* Prompt */}
          <Prompt onSubmit={handleSubmit}/>
        </box>

        {/* Right: Sidebar */}
        <Show when={showSidebar()}>
          <Sidebar />
        </Show>
      </box>

      {/* Footer */}
      <Footer />

      {/* Dialog overlay */}
      <Show when={dialog.isOpen()}>
        <DialogContainer />
      </Show>

      {/* Toast notifications */}
      <ToastContainer />
    </box>);
}
