/* @jsxImportSource solid-js */
/// <reference path="../../types.d.ts" />
/**
 * Assistant Message Component
 *
 * Displays assistant responses including text, tool outputs, and reasoning.
 */
import { Show, createMemo } from "solid-js";
import { useTheme } from "../../context/theme.js";
import { TextPart } from "./text-part.js";
import { ToolPart } from "./tool-part.js";
import { ReasoningPart } from "./reasoning-part.js";
export function AssistantMessage(props) {
    const { theme } = useTheme();
    // All outputs from the output manager are tool outputs
    const isToolOutput = createMemo(() => {
        return !!props.output.toolName;
    });
    const isReasoningOutput = createMemo(() => {
        return props.output.result?.includes("<thinking>");
    });
    const content = createMemo(() => props.output.displayedResult || props.output.result);
    return (<box flexDirection="column">
      {/* Header */}
      <box flexDirection="row" gap={1}>
        <text color={theme().colors.primary} bold>
          Assistant
        </text>
        <Show when={props.output.toolName}>
          <text color={theme().colors.muted}>
            {theme().icons.arrow} {props.output.toolName}
          </text>
        </Show>
      </box>

      {/* Content based on type */}
      <box marginLeft={2} marginTop={1}>
        <Show when={isToolOutput()} fallback={<Show when={isReasoningOutput()} fallback={<TextPart content={content()}/>}>
              <ReasoningPart content={content()}/>
            </Show>}>
          <ToolPart output={props.output} isExpanded={props.isExpanded || false}/>
        </Show>
      </box>
    </box>);
}
