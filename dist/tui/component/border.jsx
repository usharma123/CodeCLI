/* @jsxImportSource solid-js */
/// <reference path="../types.d.ts" />
/**
 * Border Component
 *
 * Custom border styles and separators.
 */
import { useTheme } from "../context/theme.js";
export function Separator(props) {
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
    return (<text color={props.color || theme().colors.border}>
      {getChar().repeat(width)}
    </text>);
}
export function Panel(props) {
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
    return (<box borderStyle="single" borderColor={getBorderColor()} flexDirection="column" padding={1}>
      {props.title && (<box marginBottom={1}>
          <text bold color={getBorderColor()}>
            {props.title}
          </text>
        </box>)}
      {props.children}
    </box>);
}
