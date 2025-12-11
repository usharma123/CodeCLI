import React from "react";
import { render } from "ink";
import { Confirm } from "../ui/components/Confirm.js";

let useInkConfirmations = false;
let autoApprove = false;

export const enableInkConfirmations = () => {
  useInkConfirmations = true;
};

export const enableAutoApprove = () => {
  autoApprove = true;
};

// Ink-based confirmation
const confirmWithInk = (message: string): Promise<boolean> =>
  new Promise((resolve) => {
    const { unmount } = render(
      React.createElement(Confirm, {
        message,
        onConfirm: () => {
          unmount();
          resolve(true);
        },
        onCancel: () => {
          unmount();
          resolve(false);
        },
      })
    );
  });

// Fallback resolver injected from index to avoid circular import
let readlineConfirm: ((message: string) => Promise<boolean>) | null = null;
export const setReadlineConfirm = (fn: (message: string) => Promise<boolean>) => {
  readlineConfirm = fn;
};

export const confirmAction = async (message: string): Promise<boolean> => {
  // Auto-approve mode is for testing or non-interactive use
  if (autoApprove) {
    return true;
  }
  // Use Ink confirmations if enabled (creates separate render - causes conflicts)
  if (useInkConfirmations) {
    return confirmWithInk(message);
  }
  // Use the readline confirm handler (which will use Ink handler in TTY mode)
  if (!readlineConfirm) {
    throw new Error("Readline confirm not initialized");
  }
  return readlineConfirm(message);
};
