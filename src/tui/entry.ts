/**
 * OpenTUI Entry Point
 *
 * Initializes and renders the SolidJS-based TUI using OpenTUI.
 * Based on OpenCode's implementation.
 */

import { render } from "@opentui/solid";
import { App } from "./app.js";
import type { AIAgent } from "../core/agent.js";

export interface TUIOptions {
  agent: AIAgent;
  onExit?: () => void;
}

/**
 * Initialize and render the OpenTUI-based terminal interface.
 * Returns a promise that resolves when the TUI exits.
 */
export async function startTUI(options: TUIOptions): Promise<void> {
  const { agent, onExit } = options;

  // Detect terminal background color
  const isDarkMode = await detectTerminalBackground();

  // Return promise that resolves on exit
  return new Promise<void>((resolve) => {
    const handleExit = async () => {
      onExit?.();
      resolve();
    };

    render(
      () => App({ agent, isDarkMode, onExit: handleExit }),
      {
        targetFps: 60,
        gatherStats: false,
        exitOnCtrlC: false, // We handle Ctrl+C ourselves
        useKittyKeyboard: {}, // Enable kitty keyboard protocol for better key handling
        onDestroy: () => {
          handleExit();
        },
      }
    );
  });
}

/**
 * Detect terminal background color.
 * Uses OSC 11 query before OpenTUI takes over stdin.
 */
async function detectTerminalBackground(): Promise<boolean> {
  // Can't set raw mode if not a TTY
  if (!process.stdin.isTTY) return true;

  return new Promise((resolve) => {
    let timeout: NodeJS.Timeout;

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.removeListener("data", handler);
      clearTimeout(timeout);
    };

    const handler = (data: Buffer) => {
      const str = data.toString();
      const match = str.match(/\x1b]11;([^\x07\x1b]+)/);
      if (match) {
        cleanup();
        const color = match[1];
        // Parse RGB values from color string
        let r = 0, g = 0, b = 0;

        if (color.startsWith("rgb:")) {
          const parts = color.substring(4).split("/");
          r = parseInt(parts[0], 16) >> 8;
          g = parseInt(parts[1], 16) >> 8;
          b = parseInt(parts[2], 16) >> 8;
        } else if (color.startsWith("#")) {
          r = parseInt(color.substring(1, 3), 16);
          g = parseInt(color.substring(3, 5), 16);
          b = parseInt(color.substring(5, 7), 16);
        }

        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        resolve(luminance <= 0.5); // true = dark mode
      }
    };

    process.stdin.setRawMode(true);
    process.stdin.on("data", handler);
    process.stdout.write("\x1b]11;?\x07");

    // Timeout - default to dark mode
    timeout = setTimeout(() => {
      cleanup();
      resolve(true);
    }, 500);
  });
}
