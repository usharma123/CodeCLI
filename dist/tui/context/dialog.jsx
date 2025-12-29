/* @jsxImportSource solid-js */
/**
 * Dialog Context Provider
 *
 * Manages modal dialogs with a stack-based approach.
 */
import { createContext, useContext, createSignal } from "solid-js";
const DialogContext = createContext();
export function DialogProvider(props) {
    const [dialogStack, setDialogStack] = createSignal([]);
    const current = () => {
        const stack = dialogStack();
        return stack.length > 0 ? stack[stack.length - 1] : null;
    };
    const isOpen = () => dialogStack().length > 0;
    const open = (config) => {
        setDialogStack((stack) => [...stack, config]);
    };
    const close = () => {
        setDialogStack((stack) => stack.slice(0, -1));
    };
    const confirm = (message) => {
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
    const alert = (message) => {
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
    const prompt = (message, defaultValue) => {
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
    const select = (message, options) => {
        return new Promise((resolve) => {
            open({
                type: "select",
                message,
                options,
                onConfirm: (value) => {
                    close();
                    resolve(value);
                },
                onCancel: () => {
                    close();
                    resolve(null);
                },
            });
        });
    };
    return (<DialogContext.Provider value={{
            current,
            isOpen,
            open,
            close,
            confirm,
            alert,
            prompt,
            select,
        }}>
      {props.children}
    </DialogContext.Provider>);
}
export function useDialog() {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error("useDialog must be used within DialogProvider");
    }
    return context;
}
