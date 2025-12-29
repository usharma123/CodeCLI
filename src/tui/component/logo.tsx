/* @jsxImportSource solid-js */
/// <reference path="../types.d.ts" />
/**
 * Logo Component
 *
 * ASCII art logo for the application.
 */

import { useTheme } from "../context/theme.js";

interface LogoProps {
  compact?: boolean;
}

const FULL_LOGO = `
   ______          __     ________    ____
  / ____/___  ____/ /__  / ____/ /   /  _/
 / /   / __ \\/ __  / _ \\/ /   / /    / /
/ /___/ /_/ / /_/ /  __/ /___/ /____/ /
\\____/\\____/\\__,_/\\___/\\____/_____/___/
`;

const COMPACT_LOGO = "CodeCLI";

export function Logo(props: LogoProps) {
  const { theme } = useTheme();

  if (props.compact) {
    return (
      <text color={theme().colors.primary} bold>
        {COMPACT_LOGO}
      </text>
    );
  }

  return (
    <box flexDirection="column">
      <text color={theme().colors.primary}>{FULL_LOGO}</text>
      <text color={theme().colors.muted}>AI-powered coding assistant</text>
    </box>
  );
}
