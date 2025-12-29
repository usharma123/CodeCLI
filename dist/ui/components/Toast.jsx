import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { Box, Text } from "ink";
import { icons } from "../theme.js";
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const addToast = useCallback((toast) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setToasts((prev) => [...prev, { ...toast, id }]);
    }, []);
    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);
    return (<ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast}/>
    </ToastContext.Provider>);
}
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        return {
            success: (message) => { },
            error: (message) => { },
            warning: (message) => { },
            info: (message) => { },
            toast: (toast) => { },
        };
    }
    return {
        success: (message, duration) => context.addToast({ message, variant: "success", duration }),
        error: (message, duration) => context.addToast({ message, variant: "error", duration: duration || 5000 }),
        warning: (message, duration) => context.addToast({ message, variant: "warning", duration }),
        info: (message, duration) => context.addToast({ message, variant: "info", duration }),
        toast: (toast) => context.addToast(toast),
    };
}
function ToastContainer({ toasts, onDismiss }) {
    if (toasts.length === 0)
        return null;
    return (<Box flexDirection="column" marginTop={1}>
      {toasts.map((toast) => (<ToastItem key={toast.id} toast={toast} onDismiss={onDismiss}/>))}
    </Box>);
}
function ToastItem({ toast, onDismiss }) {
    useEffect(() => {
        const duration = toast.duration ?? 3000;
        const timeout = setTimeout(() => {
            onDismiss(toast.id);
        }, duration);
        return () => clearTimeout(timeout);
    }, [toast.id, toast.duration, onDismiss]);
    const variantConfig = {
        success: { icon: icons.success, color: "green" },
        error: { icon: icons.error, color: "red" },
        warning: { icon: icons.warning, color: "yellow" },
        info: { icon: icons.info, color: "cyan" },
    };
    const config = variantConfig[toast.variant];
    return (<Box marginBottom={1}>
      <Text color={config.color}>{config.icon} </Text>
      <Text color={config.color}>{toast.message}</Text>
    </Box>);
}
// Standalone message components
export function SuccessMessage({ children }) {
    return (<Box marginBottom={1}>
      <Text color="green">{icons.success} </Text>
      <Text color="green">{children}</Text>
    </Box>);
}
export function ErrorMessage({ children }) {
    return (<Box marginBottom={1}>
      <Text color="red">{icons.error} </Text>
      <Text color="red">{children}</Text>
    </Box>);
}
export function WarningMessage({ children }) {
    return (<Box marginBottom={1}>
      <Text color="yellow">{icons.warning} </Text>
      <Text color="yellow">{children}</Text>
    </Box>);
}
export function InfoMessage({ children }) {
    return (<Box marginBottom={1}>
      <Text color="cyan">{icons.info} </Text>
      <Text color="cyan">{children}</Text>
    </Box>);
}
