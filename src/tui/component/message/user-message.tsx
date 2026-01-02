/* @jsxImportSource @opentui/solid */
/// <reference path="../../types.d.ts" />
/**
 * User Message Component
 *
 * Displays a user's input message.
 */

import { useTheme } from "../../context/theme.js";

interface UserMessageProps {
  content: string;
  timestamp?: number;
}

export function UserMessage(props: UserMessageProps) {
  const { theme } = useTheme();

  return (
    <box flexDirection="column">
      {/* Header */}
      <box flexDirection="row" gap={1}>
        <text color={theme().colors.accent} bold>
          You
        </text>
        {props.timestamp && (
          <text color={theme().colors.muted}>
            {new Date(props.timestamp).toLocaleTimeString()}
          </text>
        )}
      </box>

      {/* Content */}
      <box marginLeft={2} marginTop={1}>
        <text wrap="wrap">{props.content}</text>
      </box>
    </box>
  );
}
