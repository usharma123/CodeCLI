/* @jsxImportSource @opentui/solid */
/**
 * Exit Context Provider
 *
 * Manages application exit state and cleanup.
 * Based on OpenCode's implementation using renderer.destroy().
 */

import { createContext, useContext, createSignal, type JSXElement } from "solid-js";
import { useRenderer } from "@opentui/solid";

interface ExitContextValue {
  exit: (code?: number) => void;
  isExiting: () => boolean;
}

const ExitContext = createContext<ExitContextValue>();

export function ExitProvider(props: { onExit?: () => void; children: JSXElement }) {
  const [isExiting, setIsExiting] = createSignal(false);
  const renderer = useRenderer();

  const exit = (code: number = 0) => {
    if (isExiting()) return;
    setIsExiting(true);

    // Destroy the renderer first (cleans up terminal state)
    renderer.destroy();

    // Call the onExit callback
    props.onExit?.();

    // Exit the process
    process.exit(code);
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
