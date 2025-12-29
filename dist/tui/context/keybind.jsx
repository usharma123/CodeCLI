/* @jsxImportSource solid-js */
/**
 * Keybind Context Provider
 *
 * Manages keyboard shortcuts with configurable bindings.
 */
import { createContext, useContext, createSignal } from "solid-js";
const KeybindContext = createContext();
// Default keybindings
const defaultBindings = [
    { key: "c", ctrl: true, action: "exit" },
    { key: "p", ctrl: true, action: "command.open" },
    { key: "m", ctrl: true, action: "model.switch" },
    { key: "t", ctrl: true, action: "theme.toggle" },
    { key: "l", ctrl: true, action: "prompt.clear" },
    { key: "s", ctrl: true, action: "session.list" },
    { key: "o", ctrl: true, action: "output.expand" },
    { key: "n", ctrl: true, action: "session.new" },
];
export function KeybindProvider(props) {
    const [bindings, setBindings] = createSignal(defaultBindings);
    const register = (keybind) => {
        setBindings((prev) => {
            // Replace if action exists, otherwise add
            const exists = prev.findIndex((b) => b.action === keybind.action);
            if (exists >= 0) {
                const updated = [...prev];
                updated[exists] = keybind;
                return updated;
            }
            return [...prev, keybind];
        });
    };
    const unregister = (action) => {
        setBindings((prev) => prev.filter((b) => b.action !== action));
    };
    const match = (event) => {
        const binding = bindings().find((b) => {
            if (b.key.toLowerCase() !== event.key.toLowerCase())
                return false;
            if (!!b.ctrl !== !!event.ctrl)
                return false;
            if (!!b.alt !== !!event.alt)
                return false;
            if (!!b.shift !== !!event.shift)
                return false;
            if (!!b.meta !== !!event.meta)
                return false;
            return true;
        });
        return binding?.action || null;
    };
    const getBindingForAction = (action) => {
        return bindings().find((b) => b.action === action);
    };
    const formatKeybind = (keybind) => {
        const parts = [];
        if (keybind.ctrl)
            parts.push("^");
        if (keybind.alt)
            parts.push("Alt+");
        if (keybind.shift)
            parts.push("Shift+");
        if (keybind.meta)
            parts.push("Cmd+");
        parts.push(keybind.key.toUpperCase());
        return parts.join("");
    };
    return (<KeybindContext.Provider value={{
            bindings,
            register,
            unregister,
            match,
            getBindingForAction,
            formatKeybind,
        }}>
      {props.children}
    </KeybindContext.Provider>);
}
export function useKeybind() {
    const context = useContext(KeybindContext);
    if (!context) {
        throw new Error("useKeybind must be used within KeybindProvider");
    }
    return context;
}
