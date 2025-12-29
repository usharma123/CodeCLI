/* @jsxImportSource solid-js */
/// <reference path="../../types.d.ts" />
/**
 * Text Part Component
 *
 * Renders markdown-formatted text content.
 */

import { createMemo } from "solid-js";
import { useTheme } from "../../context/theme.js";
import { renderMarkdownToAnsi } from "../../../utils/markdown.js";

interface TextPartProps {
  content: string;
}

export function TextPart(props: TextPartProps) {
  const { theme } = useTheme();

  // Render markdown to ANSI for display
  const renderedContent = createMemo(() => {
    try {
      return renderMarkdownToAnsi(props.content);
    } catch {
      return props.content;
    }
  });

  return (
    <box flexDirection="column">
      <text wrap="wrap">{renderedContent()}</text>
    </box>
  );
}
