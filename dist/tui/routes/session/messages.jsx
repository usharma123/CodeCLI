/* @jsxImportSource solid-js */
/// <reference path="../../types.d.ts" />
/**
 * Messages Component
 *
 * Renders the conversation history with user and assistant messages.
 */
import { For, Show, createMemo } from "solid-js";
import { useTheme } from "../../context/theme.js";
import { useSync } from "../../context/sync.js";
import { AssistantMessage } from "../../component/message/assistant-message.js";
export function Messages(props) {
    const { theme } = useTheme();
    const { state } = useSync();
    // Group outputs by type for display
    const groupedOutputs = createMemo(() => {
        return state.outputs.map((output) => ({
            ...output,
            isExpanded: props.expandedOutputId === output.id,
        }));
    });
    return (<box flexDirection="column" padding={1}>
      {/* Welcome message if no outputs */}
      <Show when={state.outputs.length === 0}>
        <box flexDirection="column" alignItems="center" marginY={2}>
          <text color={theme().colors.primary} bold>
            Welcome to CodeCLI
          </text>
          <text color={theme().colors.muted}>
            Start typing to begin a conversation
          </text>
          <box marginTop={1}>
            <text color={theme().colors.muted}>
              Use / for commands, @ for files, ! for shell
            </text>
          </box>
        </box>
      </Show>

      {/* Message list - all outputs are tool outputs from the agent */}
      <For each={groupedOutputs()}>
        {(output) => (<box marginBottom={1}>
            <AssistantMessage output={output} isExpanded={output.isExpanded}/>
          </box>)}
      </For>

      {/* Processing indicator */}
      <Show when={state.isProcessing}>
        <box marginTop={1}>
          <text color={theme().colors.primary}>
            {theme().icons.active} {state.status.message || "Thinking..."}
          </text>
        </box>
      </Show>
    </box>);
}
