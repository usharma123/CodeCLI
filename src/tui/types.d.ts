/**
 * OpenTUI Type Declarations
 *
 * Type definitions for OpenTUI JSX elements used with SolidJS.
 * Based on OpenCode's implementation.
 */

declare module "@opentui/solid" {
  namespace JSX {
    interface IntrinsicElements {
      box: BoxProps;
      text: TextProps;
      input: InputProps;
      textarea: TextareaProps;
      scrollbox: ScrollBoxProps;
      ascii_font: AsciiFontProps;
      span: SpanProps;
      spinner: SpinnerProps;
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
      border?: ("top" | "bottom" | "left" | "right")[];
      backgroundColor?: string;
      overflow?: "visible" | "hidden" | "scroll";
      position?: "relative" | "absolute";
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
      textAlign?: "left" | "center" | "right";
      zIndex?: number;
      visible?: boolean;
      ref?: (el: any) => void;
      onMouseUp?: (event: any) => void;
      onMouseDown?: (event: any) => void;
    }

    interface TextProps {
      children?: any;
      color?: string;
      fg?: string;
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
      flexShrink?: number;
      attributes?: any;
    }

    interface SpanProps {
      children?: any;
      style?: {
        fg?: string;
        bold?: boolean;
        italic?: boolean;
      };
    }

    interface InputProps {
      value?: string;
      placeholder?: string;
      onInput?: (value: string) => void;
      onChange?: (value: string) => void;
      onKeyDown?: (e: KeyEvent) => void;
      onSubmit?: (value: string) => void;
      focused?: boolean;
      disabled?: boolean;
      flexGrow?: number;
    }

    interface TextareaProps {
      value?: string;
      placeholder?: string;
      onContentChange?: () => void;
      onKeyDown?: (e: KeyEvent) => void;
      onSubmit?: () => void;
      onPaste?: (event: any) => void;
      focused?: boolean;
      disabled?: boolean;
      flexGrow?: number;
      minHeight?: number;
      maxHeight?: number;
      textColor?: string;
      focusedTextColor?: string;
      cursorColor?: string;
      focusedBackgroundColor?: string;
      keyBindings?: Array<{ name: string; ctrl?: boolean; meta?: boolean; shift?: boolean; action: string }>;
      ref?: (el: any) => void;
      syntaxStyle?: any;
    }

    interface ScrollBoxProps extends BoxProps {
      sticky?: boolean;
      acceleration?: number;
      scrollToBottom?: boolean;
    }

    interface AsciiFontProps {
      font?: string;
      text?: string;
    }

    interface SpinnerProps {
      color?: any;
      frames?: string[];
      interval?: number;
    }

    interface KeyEvent {
      name: string;
      sequence?: string;
      ctrl: boolean;
      shift: boolean;
      alt: boolean;
      option?: boolean;
      meta: boolean;
      preventDefault?: () => void;
    }
  }
}

export {};
