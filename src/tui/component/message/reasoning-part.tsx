/* @jsxImportSource @opentui/solid */
/// <reference path="../../types.d.ts" />
/**
 * Reasoning Part Component
 *
 * Displays thinking/reasoning blocks with collapse functionality.
 */

import { Show, createSignal, createMemo } from "solid-js";
import { useTheme } from "../../context/theme.js";

interface ReasoningPartProps {
  content: string;
  defaultCollapsed?: boolean;
}

export function ReasoningPart(props: ReasoningPartProps) {
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = createSignal(props.defaultCollapsed ?? true);

  // Extract thinking content from tags if present
  const reasoningContent = createMemo(() => {
    const content = props.content;
    const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
    if (thinkingMatch) {
      return thinkingMatch[1].trim();
    }
    return content;
  });

  // Summary for collapsed view
  const summary = createMemo(() => {
    const content = reasoningContent();
    const firstLine = content.split("\n")[0];
    if (firstLine.length > 60) {
      return firstLine.slice(0, 57) + "...";
    }
    return firstLine;
  });

  const lineCount = createMemo(() => {
    return reasoningContent().split("\n").length;
  });

  return (
    <box
      flexDirection="column"
      borderStyle="single"
      borderColor={theme().colors.muted}
      padding={1}
    >
      {/* Header */}
      <box
        flexDirection="row"
        justifyContent="space-between"
        marginBottom={isCollapsed() ? 0 : 1}
      >
        <box flexDirection="row" gap={1}>
          <text color={theme().colors.muted}>{"\u{1F4AD}"}</text>
          <text color={theme().colors.muted} bold>
            Thinking
          </text>
          <text color={theme().colors.muted}>({lineCount()} lines)</text>
        </box>
        <text color={theme().colors.muted}>
          {isCollapsed() ? "[space to expand]" : "[space to collapse]"}
        </text>
      </box>

      {/* Content */}
      <Show
        when={!isCollapsed()}
        fallback={
          <text color={theme().colors.muted} italic>
            {summary()}
          </text>
        }
      >
        <box flexDirection="column">
          <text wrap="wrap" color={theme().colors.muted}>
            {reasoningContent()}
          </text>
        </box>
      </Show>
    </box>
  );
}
