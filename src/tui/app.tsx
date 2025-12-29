/* @jsxImportSource solid-js */
/// <reference path="./types.d.ts" />
/**
 * Main App Component
 *
 * Sets up the provider hierarchy and main application structure.
 */

import { createSignal, createEffect, onCleanup, Show, type JSXElement } from "solid-js";
import type { AIAgent } from "../core/agent.js";
import { ExitProvider } from "./context/exit.js";
import { ThemeProvider } from "./context/theme.js";
import { AgentProvider } from "./context/agent.js";
import { SyncProvider } from "./context/sync.js";
import { RouteProvider, useRoute } from "./context/route.js";
import { DialogProvider } from "./context/dialog.js";
import { CommandProvider } from "./context/command.js";
import { ToastProvider } from "./context/toast.js";
import { PromptProvider } from "./context/prompt.js";
import { KeybindProvider } from "./context/keybind.js";
import { Home } from "./routes/home.js";
import { Session } from "./routes/session/index.js";

export interface AppProps {
  agent: AIAgent;
  isDarkMode: boolean;
}

/**
 * Provider wrapper that nests all context providers.
 */
function Providers(props: { agent: AIAgent; isDarkMode: boolean; children: JSXElement }) {
  return (
    <ExitProvider>
      <KeybindProvider>
        <ThemeProvider isDarkMode={props.isDarkMode}>
          <AgentProvider agent={props.agent}>
            <SyncProvider>
              <RouteProvider>
                <DialogProvider>
                  <CommandProvider>
                    <PromptProvider>
                      <ToastProvider>
                        {props.children}
                      </ToastProvider>
                    </PromptProvider>
                  </CommandProvider>
                </DialogProvider>
              </RouteProvider>
            </SyncProvider>
          </AgentProvider>
        </ThemeProvider>
      </KeybindProvider>
    </ExitProvider>
  );
}

/**
 * Main router component that renders the appropriate route.
 */
function Router() {
  const route = useRoute();

  return (
    <Show when={route.current() === "session"} fallback={<Home />}>
      <Session />
    </Show>
  );
}

/**
 * Main App component.
 */
export function App(props: AppProps) {
  return (
    <Providers agent={props.agent} isDarkMode={props.isDarkMode}>
      <Router />
    </Providers>
  );
}
