/* @jsxImportSource @opentui/solid */
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
    ____              __       __
   / __ )____  ____  / /______/ /__________ _____
  / __  / __ \\/ __ \\/ __/ ___/ __/ ___/ __ '/ __ \\
 / /_/ / /_/ / /_/ / /_(__  ) /_/ /  / /_/ / /_/ /
/_____/\\____/\\____/\\__/____/\\__/_/   \\__,_/ .___/
                                         /_/
`;

const COMPACT_LOGO = "Bootstrap";

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
      <text color={theme().colors.muted}>AI-powered coding agent</text>
    </box>
  );
}
