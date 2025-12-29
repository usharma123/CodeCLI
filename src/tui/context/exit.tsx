/* @jsxImportSource solid-js */
/**
 * Exit Context Provider
 *
 * Manages application exit state and cleanup.
 */

import { createContext, useContext, createSignal, type JSXElement } from "solid-js";

interface ExitContextValue {
  exit: (code?: number) => void;
  isExiting: () => boolean;
}

const ExitContext = createContext<ExitContextValue>();

export function ExitProvider(props: { children: JSXElement }) {
  const [isExiting, setIsExiting] = createSignal(false);

  const exit = (code: number = 0) => {
    setIsExiting(true);
    // Give time for cleanup
    setTimeout(() => {
      process.exit(code);
    }, 100);
  };

  return (
    <ExitContext.Provider value={{ exit, isExiting }}>
      {props.children}
    </ExitContext.Provider>
  );
}

export function useExit() {
  const context = useContext(ExitContext);
  if (!context) {
    throw new Error("useExit must be used within ExitProvider");
  }
  return context;
}
