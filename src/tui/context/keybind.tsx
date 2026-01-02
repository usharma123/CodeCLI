/* @jsxImportSource @opentui/solid */
/**
 * Keybind Context Provider
 *
 * Manages keyboard shortcuts with configurable bindings.
 * Based on OpenCode's implementation - does NOT globally intercept keys.
 * Individual components use match() in their onKeyDown handlers.
 */

import { createContext, useContext, createSignal, type JSXElement } from "solid-js";

export interface Keybind {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: string;
}

interface KeybindContextValue {
  bindings: () => Keybind[];
  register: (keybind: Keybind) => void;
  unregister: (action: string) => void;
  match: (action: string, event: any) => boolean;
  getBindingForAction: (action: string) => Keybind | undefined;
  formatKeybind: (keybind: Keybind) => string;
}

const KeybindContext = createContext<KeybindContextValue>();

const defaultBindings: Keybind[] = [
  { key: "c", ctrl: true, action: "exit" },
  { key: "p", ctrl: true, action: "command.open" },
  { key: "m", ctrl: true, action: "model.switch" },
  { key: "t", ctrl: true, action: "theme.toggle" },
  { key: "l", ctrl: true, action: "prompt.clear" },
  { key: "s", ctrl: true, action: "session.list" },
  { key: "o", ctrl: true, action: "output.expand" },
  { key: "n", ctrl: true, action: "session.new" },
];

export function KeybindProvider(props: { children: JSXElement }) {
  const [bindings, setBindings] = createSignal<Keybind[]>(defaultBindings);

  const register = (keybind: Keybind) => {
    setBindings((prev) => {
      const exists = prev.findIndex((b) => b.action === keybind.action);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = keybind;
        return updated;
      }
      return [...prev, keybind];
    });
  };

  const unregister = (action: string) => {
    setBindings((prev) => prev.filter((b) => b.action !== action));
  };

  const matchEvent = (binding: Keybind, event: any): boolean => {
    const eventName = (event.name || "").toLowerCase();
    const bindingKey = binding.key.toLowerCase();
    
    if (bindingKey !== eventName) return false;
    if (!!binding.ctrl !== !!event.ctrl) return false;
    if (!!binding.alt !== !!(event.alt || event.option)) return false;
    if (!!binding.shift !== !!event.shift) return false;
    if (!!binding.meta !== !!event.meta) return false;
    return true;
  };

  const match = (action: string, event: any): boolean => {
    const binding = bindings().find((b) => b.action === action);
    if (!binding) return false;
    return matchEvent(binding, event);
  };

  const getBindingForAction = (action: string) => {
    return bindings().find((b) => b.action === action);
  };

  const formatKeybind = (keybind: Keybind): string => {
    const parts: string[] = [];
    if (keybind.ctrl) parts.push("^");
    if (keybind.alt) parts.push("Alt+");
    if (keybind.shift) parts.push("Shift+");
    if (keybind.meta) parts.push("Cmd+");
    parts.push(keybind.key.toUpperCase());
    return parts.join("");
  };

  // NOTE: We do NOT use useKeyboard here globally.
  // Individual components handle their own keybinds via onKeyDown + match()

  return (
    <KeybindContext.Provider
      value={{
        bindings,
        register,
        unregister,
        match,
        getBindingForAction,
        formatKeybind,
      }}
    >
      {props.children}
    </KeybindContext.Provider>
  );
}

export function useKeybind() {
  const context = useContext(KeybindContext);
  if (!context) {
    throw new Error("useKeybind must be used within KeybindProvider");
  }
  return context;
}
