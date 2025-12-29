/**
 * OpenTUI Type Declarations
 *
 * Type definitions for OpenTUI JSX elements used with SolidJS.
 */

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      box: BoxProps;
      text: TextProps;
      input: InputProps;
      scrollbox: ScrollBoxProps;
    }

    interface BoxProps {
      children?: any;
      flexDirection?: "row" | "column";
      flexGrow?: number;
      flexShrink?: number;
      flexWrap?: "wrap" | "nowrap";
      justifyContent?: "flex-start" | "flex-end" | "center" | "space-between" | "space-around";
      alignItems?: "flex-start" | "flex-end" | "center" | "stretch";
      gap?: number;
      padding?: number;
      paddingX?: number;
      paddingY?: number;
      paddingTop?: number;
      paddingBottom?: number;
      paddingLeft?: number;
      paddingRight?: number;
      margin?: number;
      marginX?: number;
      marginY?: number;
      marginTop?: number;
      marginBottom?: number;
      marginLeft?: number;
      marginRight?: number;
      width?: number | string;
      height?: number | string;
      minWidth?: number;
      maxWidth?: number;
      minHeight?: number;
      maxHeight?: number;
      borderStyle?: "single" | "double" | "round" | "bold" | "none";
      borderColor?: string;
      borderTop?: boolean;
      borderBottom?: boolean;
      borderLeft?: boolean;
      borderRight?: boolean;
      backgroundColor?: string;
      overflow?: "visible" | "hidden" | "scroll";
      position?: "relative" | "absolute";
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
      textAlign?: "left" | "center" | "right";
    }

    interface TextProps {
      children?: any;
      color?: string;
      backgroundColor?: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strikethrough?: boolean;
      dimColor?: boolean;
      wrap?: "wrap" | "truncate" | "truncate-end" | "truncate-middle" | "truncate-start";
      marginTop?: number;
      marginBottom?: number;
      marginLeft?: number;
      marginRight?: number;
      textAlign?: "left" | "center" | "right";
    }

    interface InputProps {
      value?: string;
      placeholder?: string;
      onChange?: (e: { target: { value: string } }) => void;
      onKeyDown?: (e: { key: string; ctrlKey: boolean; altKey: boolean; shiftKey: boolean }) => void;
      onSubmit?: (value: string) => void;
      focus?: boolean;
      disabled?: boolean;
      flexGrow?: number;
    }

    interface ScrollBoxProps extends BoxProps {
      sticky?: boolean;
      acceleration?: number;
      scrollToBottom?: boolean;
    }
  }
}

export {};
