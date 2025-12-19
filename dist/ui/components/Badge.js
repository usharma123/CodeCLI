import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Text } from "ink";
import { inkColors } from "../theme.js";
const variantColors = {
    success: "success",
    warning: "warning",
    error: "error",
    info: "info",
    primary: "primary",
    muted: "muted",
};
export function Badge({ children, variant = "primary", pulse = false, }) {
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        if (!pulse)
            return;
        const interval = setInterval(() => {
            setVisible((v) => !v);
        }, 500);
        return () => clearInterval(interval);
    }, [pulse]);
    const color = inkColors[variantColors[variant]];
    return (_jsxs(Text, { color: color, dimColor: pulse && !visible, children: ["[", children, "]"] }));
}
// Preset badges
export function SafeBadge() {
    return _jsx(Badge, { variant: "success", children: "safe" });
}
export function DryRunBadge() {
    return _jsx(Badge, { variant: "warning", pulse: true, children: "dry-run" });
}
export function ErrorBadge({ message }) {
    return _jsx(Badge, { variant: "error", children: message || "error" });
}
export function ModelBadge({ model }) {
    return _jsx(Badge, { variant: "info", children: model });
}
export function ModeBadge({ mode }) {
    const configs = {
        command: { variant: "primary", text: "/" },
        file: { variant: "success", text: "@" },
        shell: { variant: "warning", text: "!" },
    };
    const config = configs[mode];
    return _jsx(Badge, { variant: config.variant, children: config.text });
}
