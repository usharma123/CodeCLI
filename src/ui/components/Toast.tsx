import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import { Box, Text } from "ink";
import { icons } from "../theme.js";

type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    return {
      success: (message: string) => {},
      error: (message: string) => {},
      warning: (message: string) => {},
      info: (message: string) => {},
      toast: (toast: Omit<Toast, "id">) => {},
    };
  }

  return {
    success: (message: string, duration?: number) =>
      context.addToast({ message, variant: "success", duration }),
    error: (message: string, duration?: number) =>
      context.addToast({ message, variant: "error", duration: duration || 5000 }),
    warning: (message: string, duration?: number) =>
      context.addToast({ message, variant: "warning", duration }),
    info: (message: string, duration?: number) =>
      context.addToast({ message, variant: "info", duration }),
    toast: (toast: Omit<Toast, "id">) => context.addToast(toast),
  };
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <Box flexDirection="column" marginTop={1}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </Box>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const duration = toast.duration ?? 3000;
    const timeout = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => clearTimeout(timeout);
  }, [toast.id, toast.duration, onDismiss]);

  const variantConfig = {
    success: { icon: icons.success, color: "green" as const },
    error: { icon: icons.error, color: "red" as const },
    warning: { icon: icons.warning, color: "yellow" as const },
    info: { icon: icons.info, color: "cyan" as const },
  };

  const config = variantConfig[toast.variant];

  return (
    <Box marginBottom={1}>
      <Text color={config.color}>{config.icon} </Text>
      <Text color={config.color}>{toast.message}</Text>
    </Box>
  );
}

// Standalone message components
export function SuccessMessage({ children }: { children: React.ReactNode }) {
  return (
    <Box marginBottom={1}>
      <Text color="green">{icons.success} </Text>
      <Text color="green">{children}</Text>
    </Box>
  );
}

export function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <Box marginBottom={1}>
      <Text color="red">{icons.error} </Text>
      <Text color="red">{children}</Text>
    </Box>
  );
}

export function WarningMessage({ children }: { children: React.ReactNode }) {
  return (
    <Box marginBottom={1}>
      <Text color="yellow">{icons.warning} </Text>
      <Text color="yellow">{children}</Text>
    </Box>
  );
}

export function InfoMessage({ children }: { children: React.ReactNode }) {
  return (
    <Box marginBottom={1}>
      <Text color="cyan">{icons.info} </Text>
      <Text color="cyan">{children}</Text>
    </Box>
  );
}
