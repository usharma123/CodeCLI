/* @jsxImportSource @opentui/solid */
/**
 * Dialog Context Provider
 *
 * Manages modal dialogs with a stack-based approach.
 */

import { createContext, useContext, createSignal, type JSXElement } from "solid-js";

export type DialogType =
  | "confirm"
  | "alert"
  | "prompt"
  | "select"
  | "command"
  | "model"
  | "session"
  | "theme"
  | "plan";

export interface DialogConfig {
  type: DialogType;
  title?: string;
  message?: string;
  options?: Array<{ label: string; value: string }>;
  defaultValue?: string;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
}

interface DialogContextValue {
  current: () => DialogConfig | null;
  isOpen: () => boolean;
  open: (config: DialogConfig) => void;
  close: () => void;
  confirm: (message: string) => Promise<boolean>;
  alert: (message: string) => Promise<void>;
  prompt: (message: string, defaultValue?: string) => Promise<string | null>;
  select: <T extends string>(
    message: string,
    options: Array<{ label: string; value: T }>
  ) => Promise<T | null>;
}

const DialogContext = createContext<DialogContextValue>();

export function DialogProvider(props: { children: JSXElement }) {
  const [dialogStack, setDialogStack] = createSignal<DialogConfig[]>([]);

  const current = () => {
    const stack = dialogStack();
    return stack.length > 0 ? stack[stack.length - 1] : null;
  };

  const isOpen = () => dialogStack().length > 0;

  const open = (config: DialogConfig) => {
    setDialogStack((stack) => [...stack, config]);
  };

  const close = () => {
    setDialogStack((stack) => stack.slice(0, -1));
  };

  const confirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      open({
        type: "confirm",
        message,
        onConfirm: () => {
          close();
          resolve(true);
        },
        onCancel: () => {
          close();
          resolve(false);
        },
      });
    });
  };

  const alert = (message: string): Promise<void> => {
    return new Promise((resolve) => {
      open({
        type: "alert",
        message,
        onConfirm: () => {
          close();
          resolve();
        },
      });
    });
  };

  const prompt = (message: string, defaultValue?: string): Promise<string | null> => {
    return new Promise((resolve) => {
      open({
        type: "prompt",
        message,
        defaultValue,
        onConfirm: (value) => {
          close();
          resolve(value || null);
        },
        onCancel: () => {
          close();
          resolve(null);
        },
      });
    });
  };

  const select = <T extends string>(
    message: string,
    options: Array<{ label: string; value: T }>
  ): Promise<T | null> => {
    return new Promise((resolve) => {
      open({
        type: "select",
        message,
        options,
        onConfirm: (value) => {
          close();
          resolve(value as T);
        },
        onCancel: () => {
          close();
          resolve(null);
        },
      });
    });
  };

  return (
    <DialogContext.Provider
      value={{
        current,
        isOpen,
        open,
        close,
        confirm,
        alert,
        prompt,
        select,
      }}
    >
      {props.children}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within DialogProvider");
  }
  return context;
}
