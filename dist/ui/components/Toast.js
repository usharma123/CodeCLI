import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs(ToastContext.Provider, { value: { toasts, addToast, removeToast }, children: [children, _jsx(ToastContainer, { toasts: toasts, onDismiss: removeToast })] }));
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
    return (_jsx(Box, { flexDirection: "column", marginTop: 1, children: toasts.map((toast) => (_jsx(ToastItem, { toast: toast, onDismiss: onDismiss }, toast.id))) }));
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
    return (_jsxs(Box, { marginBottom: 1, children: [_jsxs(Text, { color: config.color, children: [config.icon, " "] }), _jsx(Text, { color: config.color, children: toast.message })] }));
}
// Standalone message components
export function SuccessMessage({ children }) {
    return (_jsxs(Box, { marginBottom: 1, children: [_jsxs(Text, { color: "green", children: [icons.success, " "] }), _jsx(Text, { color: "green", children: children })] }));
}
export function ErrorMessage({ children }) {
    return (_jsxs(Box, { marginBottom: 1, children: [_jsxs(Text, { color: "red", children: [icons.error, " "] }), _jsx(Text, { color: "red", children: children })] }));
}
export function WarningMessage({ children }) {
    return (_jsxs(Box, { marginBottom: 1, children: [_jsxs(Text, { color: "yellow", children: [icons.warning, " "] }), _jsx(Text, { color: "yellow", children: children })] }));
}
export function InfoMessage({ children }) {
    return (_jsxs(Box, { marginBottom: 1, children: [_jsxs(Text, { color: "cyan", children: [icons.info, " "] }), _jsx(Text, { color: "cyan", children: children })] }));
}
