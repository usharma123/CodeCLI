/* @jsxImportSource @opentui/solid */
/**
 * Prompt Context Provider
 *
 * Manages prompt state, history, and stash.
 */

import { createContext, useContext, createSignal, type JSXElement } from "solid-js";

interface PromptContextValue {
  // Current input
  value: () => string;
  setValue: (value: string) => void;
  clear: () => void;

  // Mode detection
  mode: () => "default" | "command" | "file" | "shell";

  // History
  history: () => string[];
  historyIndex: () => number;
  addToHistory: (value: string) => void;
  navigateHistory: (direction: "up" | "down") => void;

  // Stash
  stash: () => string | null;
  saveToStash: () => void;
  restoreFromStash: () => void;

  // Focus
  isFocused: () => boolean;
  focus: () => void;
  blur: () => void;
}

const PromptContext = createContext<PromptContextValue>();

const MAX_HISTORY = 100;

export function PromptProvider(props: { children: JSXElement }) {
  const [value, setValue] = createSignal("");
  const [history, setHistory] = createSignal<string[]>([]);
  const [historyIndex, setHistoryIndex] = createSignal(-1);
  const [stash, setStash] = createSignal<string | null>(null);
  const [isFocused, setIsFocused] = createSignal(true);
  const [tempValue, setTempValue] = createSignal("");

  // Detect input mode based on first character
  const mode = () => {
    const v = value();
    if (v.startsWith("/")) return "command";
    if (v.startsWith("@")) return "file";
    if (v.startsWith("!")) return "shell";
    return "default";
  };

  const clear = () => {
    setValue("");
    setHistoryIndex(-1);
  };

  const addToHistory = (input: string) => {
    if (!input.trim()) return;

    setHistory((prev) => {
      // Don't add duplicates of the last entry
      if (prev[0] === input) return prev;
      const updated = [input, ...prev];
      return updated.slice(0, MAX_HISTORY);
    });
    setHistoryIndex(-1);
  };

  const navigateHistory = (direction: "up" | "down") => {
    const hist = history();
    if (hist.length === 0) return;

    const currentIndex = historyIndex();

    if (direction === "up") {
      if (currentIndex === -1) {
        // Save current value before navigating
        setTempValue(value());
        setHistoryIndex(0);
        setValue(hist[0]);
      } else if (currentIndex < hist.length - 1) {
        const newIndex = currentIndex + 1;
        setHistoryIndex(newIndex);
        setValue(hist[newIndex]);
      }
    } else {
      if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        setHistoryIndex(newIndex);
        setValue(hist[newIndex]);
      } else if (currentIndex === 0) {
        setHistoryIndex(-1);
        setValue(tempValue());
      }
    }
  };

  const saveToStash = () => {
    const v = value();
    if (v.trim()) {
      setStash(v);
      clear();
    }
  };

  const restoreFromStash = () => {
    const s = stash();
    if (s) {
      setValue(s);
      setStash(null);
    }
  };

  const focus = () => setIsFocused(true);
  const blur = () => setIsFocused(false);

  return (
    <PromptContext.Provider
      value={{
        value,
        setValue,
        clear,
        mode,
        history,
        historyIndex,
        addToHistory,
        navigateHistory,
        stash,
        saveToStash,
        restoreFromStash,
        isFocused,
        focus,
        blur,
      }}
    >
      {props.children}
    </PromptContext.Provider>
  );
}

export function usePrompt() {
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error("usePrompt must be used within PromptProvider");
  }
  return context;
}
