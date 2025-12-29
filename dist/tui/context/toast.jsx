/* @jsxImportSource solid-js */
/**
 * Toast Context Provider
 *
 * Manages toast notifications with auto-dismiss.
 */
import { createContext, useContext, createSignal } from "solid-js";
const ToastContext = createContext();
let toastId = 0;
export function ToastProvider(props) {
    const [toasts, setToasts] = createSignal([]);
    const show = (toast) => {
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
    const dismiss = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };
    const dismissAll = () => {
        setToasts([]);
    };
    const info = (message, duration) => show({ type: "info", message, duration });
    const success = (message, duration) => show({ type: "success", message, duration });
    const warning = (message, duration) => show({ type: "warning", message, duration });
    const error = (message, duration) => show({ type: "error", message, duration });
    return (<ToastContext.Provider value={{
            toasts,
            show,
            dismiss,
            dismissAll,
            info,
            success,
            warning,
            error,
        }}>
      {props.children}
    </ToastContext.Provider>);
}
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
}
