/**
 * OpenTUI Entry Point
 *
 * Initializes and renders the SolidJS-based TUI using OpenTUI.
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
 */
export async function startTUI(options: TUIOptions): Promise<void> {
  const { agent, onExit } = options;

  // Detect terminal background for theme auto-detection
  const isDarkMode = await detectTerminalBackground();

  const instance = render(() => App({ agent, isDarkMode }), {
    fps: 60,
    // Enable Kitty keyboard protocol for better key handling
    kittyKeyboard: true,
    // Use Ctrl+Y for clipboard operations
    clipboard: { key: "ctrl+y" },
  }) as any;

  // Handle cleanup on exit
  if (onExit && instance.unmount) {
    const originalUnmount = instance.unmount;
    instance.unmount = () => {
      originalUnmount();
      onExit();
    };
  }

  // Wait for the app to be closed
  if (instance.waitUntilExit) {
    await instance.waitUntilExit();
  }
}

/**
 * Detect terminal background color using OSC 11.
 * Returns true if dark mode, false if light mode.
 */
async function detectTerminalBackground(): Promise<boolean> {
  return new Promise((resolve) => {
    // Default to dark mode if detection fails
    const timeout = setTimeout(() => resolve(true), 100);

    const originalRawMode = process.stdin.isRaw;

    try {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
        process.stdin.resume();

        const handler = (data: Buffer) => {
          clearTimeout(timeout);
          process.stdin.removeListener("data", handler);

          if (originalRawMode !== undefined) {
            process.stdin.setRawMode(originalRawMode);
          }

          const response = data.toString();
          // Parse OSC 11 response: ESC ] 11 ; rgb:RRRR/GGGG/BBBB ESC \
          const match = response.match(/rgb:([0-9a-f]+)\/([0-9a-f]+)\/([0-9a-f]+)/i);

          if (match) {
            const r = parseInt(match[1].slice(0, 2), 16);
            const g = parseInt(match[2].slice(0, 2), 16);
            const b = parseInt(match[3].slice(0, 2), 16);
            // Calculate relative luminance
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            resolve(luminance < 0.5); // Dark if luminance is low
          } else {
            resolve(true); // Default to dark mode
          }
        };

        process.stdin.on("data", handler);
        // Send OSC 11 query
        process.stdout.write("\x1b]11;?\x1b\\");
      } else {
        resolve(true); // Default to dark mode
      }
    } catch {
      resolve(true); // Default to dark mode on error
    }
  });
}
