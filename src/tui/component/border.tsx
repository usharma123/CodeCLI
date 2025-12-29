/* @jsxImportSource solid-js */
/// <reference path="../types.d.ts" />
/**
 * Border Component
 *
 * Custom border styles and separators.
 */

import { useTheme } from "../context/theme.js";

interface SeparatorProps {
  width?: number;
  style?: "single" | "double" | "dashed";
  color?: string;
}

export function Separator(props: SeparatorProps) {
  const { theme } = useTheme();
  const width = props.width || 40;

  const getChar = () => {
    switch (props.style) {
      case "double":
        return "═";
      case "dashed":
        return "─";
      default:
        return "─";
    }
  };

  return (
    <text color={props.color || theme().colors.border}>
      {getChar().repeat(width)}
    </text>
  );
}

interface PanelProps {
  title?: string;
  variant?: "default" | "accent" | "success" | "warning" | "error";
  children: any;
}

export function Panel(props: PanelProps) {
  const { theme } = useTheme();

  const getBorderColor = () => {
    switch (props.variant) {
      case "accent":
        return theme().colors.accent;
      case "success":
        return theme().colors.success;
      case "warning":
        return theme().colors.warning;
      case "error":
        return theme().colors.error;
      default:
        return theme().colors.border;
    }
  };

  return (
    <box
      borderStyle="single"
      borderColor={getBorderColor()}
      flexDirection="column"
      padding={1}
    >
      {props.title && (
        <box marginBottom={1}>
          <text bold color={getBorderColor()}>
            {props.title}
          </text>
        </box>
      )}
      {props.children}
    </box>
  );
}
