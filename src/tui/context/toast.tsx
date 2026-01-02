/* @jsxImportSource @opentui/solid */
/**
 * Toast Context Provider
 *
 * Manages toast notifications with auto-dismiss.
 */

import { createContext, useContext, createSignal, type JSXElement } from "solid-js";

export type ToastType = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: () => Toast[];
  show: (toast: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  info: (message: string, duration?: number) => string;
  success: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextValue>();

let toastId = 0;

export function ToastProvider(props: { children: JSXElement }) {
  const [toasts, setToasts] = createSignal<Toast[]>([]);

  const show = (toast: Omit<Toast, "id">): string => {
    const id = `toast-${++toastId}`;
    const duration = toast.duration ?? 3000;

    setToasts((prev) => [...prev, { ...toast, id }]);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }

    return id;
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const dismissAll = () => {
    setToasts([]);
  };

  const info = (message: string, duration?: number) =>
    show({ type: "info", message, duration });

  const success = (message: string, duration?: number) =>
    show({ type: "success", message, duration });

  const warning = (message: string, duration?: number) =>
    show({ type: "warning", message, duration });

  const error = (message: string, duration?: number) =>
    show({ type: "error", message, duration });

  return (
    <ToastContext.Provider
      value={{
        toasts,
        show,
        dismiss,
        dismissAll,
        info,
        success,
        warning,
        error,
      }}
    >
      {props.children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
