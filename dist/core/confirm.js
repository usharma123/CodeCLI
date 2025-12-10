import React from "react";
import { render } from "ink";
import { Confirm } from "../ui/components/Confirm.js";
let useInkConfirmations = false;
export const enableInkConfirmations = () => {
    useInkConfirmations = true;
};
// Ink-based confirmation
const confirmWithInk = (message) => new Promise((resolve) => {
    const { unmount } = render(React.createElement(Confirm, {
        message,
        onConfirm: () => {
            unmount();
            resolve(true);
        },
        onCancel: () => {
            unmount();
            resolve(false);
        },
    }));
});
// Fallback resolver injected from index to avoid circular import
let readlineConfirm = null;
export const setReadlineConfirm = (fn) => {
    readlineConfirm = fn;
};
export const confirmAction = async (message) => {
    if (useInkConfirmations) {
        return confirmWithInk(message);
    }
    if (!readlineConfirm) {
        throw new Error("Readline confirm not initialized");
    }
    return readlineConfirm(message);
};
