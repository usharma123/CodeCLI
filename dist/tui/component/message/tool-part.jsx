/* @jsxImportSource solid-js */
/// <reference path="../../types.d.ts" />
/**
 * Tool Part Component
 *
 * Displays tool execution output with expandable content.
 */
import { Show, createMemo, createSignal } from "solid-js";
import { useTheme } from "../../context/theme.js";
const MAX_COLLAPSED_LINES = 10;
const MAX_LINE_LENGTH = 200;
export function ToolPart(props) {
    const { theme } = useTheme();
    const [localExpanded, setLocalExpanded] = createSignal(false);
    const isExpanded = () => props.isExpanded || localExpanded();
    const processedContent = createMemo(() => {
        const content = props.output.displayedResult || props.output.result || "";
        const lines = content.split("\n");
        // Determine if content needs truncation
        const needsTruncation = lines.length > MAX_COLLAPSED_LINES;
        // Process lines for display
        const displayLines = isExpanded()
            ? lines
            : lines.slice(0, MAX_COLLAPSED_LINES);
        const processed = displayLines.map((line, index) => {
            // Truncate long lines
            if (line.length > MAX_LINE_LENGTH && !isExpanded()) {
                return `${line.slice(0, MAX_LINE_LENGTH)}...`;
            }
            return line;
        });
        return {
            lines: processed,
            totalLines: lines.length,
            needsTruncation,
            hiddenLines: lines.length - MAX_COLLAPSED_LINES,
        };
    });
    const getToolIcon = () => {
        const toolName = props.output.toolName?.toLowerCase() || "";
        if (toolName.includes("read") || toolName.includes("file")) {
            return "\u{1F4C4}"; // File icon
        }
        if (toolName.includes("write") || toolName.includes("edit")) {
            return "\u270F"; // Pencil icon
        }
        if (toolName.includes("bash") || toolName.includes("shell")) {
            return "\u{1F4BB}"; // Computer icon
        }
        if (toolName.includes("search") || toolName.includes("grep")) {
            return "\u{1F50D}"; // Magnifying glass
        }
        return "\u2699"; // Gear icon
    };
    // Infer status from result
    const getStatusColor = () => {
        const result = props.output.result || "";
        if (result.toLowerCase().includes("error"))
            return theme().colors.error;
        return theme().colors.success;
    };
    return (<box flexDirection="column" borderStyle="single" padding={1}>
      {/* Tool header */}
      <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
        <box flexDirection="row" gap={1}>
          <text>{getToolIcon()}</text>
          <text bold color={theme().colors.accent}>
            {props.output.toolName || "Tool"}
          </text>
        </box>
        <text color={getStatusColor()}>
          {props.output.result?.toLowerCase().includes("error")
            ? theme().icons.error
            : theme().icons.success}
        </text>
      </box>

      {/* Content */}
      <box flexDirection="column">
        {processedContent().lines.map((line, index) => (<box flexDirection="row">
            <text color={theme().colors.muted} dimColor>
              {String(index + 1).padStart(4, " ")} {theme().icons.pipe}{" "}
            </text>
            <text wrap="truncate">{line}</text>
          </box>))}
      </box>

      {/* Truncation indicator */}
      <Show when={processedContent().needsTruncation && !isExpanded()}>
        <box marginTop={1}>
          <text color={theme().colors.muted}>
            ... {processedContent().hiddenLines} more lines (^O to expand)
          </text>
        </box>
      </Show>

      {/* Collapse indicator when expanded */}
      <Show when={isExpanded() && processedContent().needsTruncation}>
        <box marginTop={1}>
          <text color={theme().colors.muted}>
            {processedContent().totalLines} lines total (^O to collapse)
          </text>
        </box>
      </Show>
    </box>);
}
