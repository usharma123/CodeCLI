/* @jsxImportSource @opentui/solid */
/// <reference path="./types.d.ts" />
/**
 * Main App Component
 *
 * Sets up the provider hierarchy and main application structure.
 * Based on OpenCode's implementation.
 */

import { Show, type JSXElement } from "solid-js";
import { useTerminalDimensions, useRenderer } from "@opentui/solid";
import type { AIAgent } from "../core/agent.js";
import { ExitProvider } from "./context/exit.js";
import { ThemeProvider, useTheme } from "./context/theme.js";
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
  onExit?: () => void;
}

/**
 * Provider wrapper that nests all context providers.
 */
function Providers(props: { agent: AIAgent; isDarkMode: boolean; onExit?: () => void; children: JSXElement }) {
  return (
    <ExitProvider onExit={props.onExit}>
      <ThemeProvider isDarkMode={props.isDarkMode}>
        <KeybindProvider>
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
        </KeybindProvider>
      </ThemeProvider>
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
 * Main App component with full-screen box matching OpenCode's structure.
 */
function AppContent() {
  const dimensions = useTerminalDimensions();
  const renderer = useRenderer();
  const { theme } = useTheme();

  // Disable stdout interception like OpenCode does
  renderer.disableStdoutInterception();

  return (
    <box
      width={dimensions().width}
      height={dimensions().height}
      backgroundColor={theme().colors.background}
      flexDirection="column"
    >
      <Router />
    </box>
  );
}

/**
 * Main App component.
 */
export function App(props: AppProps) {
  return (
    <Providers agent={props.agent} isDarkMode={props.isDarkMode} onExit={props.onExit}>
      <AppContent />
    </Providers>
  );
}
