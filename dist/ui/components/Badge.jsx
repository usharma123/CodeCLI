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
    return (<Text color={color} dimColor={pulse && !visible}>
      [{children}]
    </Text>);
}
// Preset badges
export function SafeBadge() {
    return <Badge variant="success">safe</Badge>;
}
export function DryRunBadge() {
    return <Badge variant="warning" pulse>dry-run</Badge>;
}
export function ErrorBadge({ message }) {
    return <Badge variant="error">{message || "error"}</Badge>;
}
export function ModelBadge({ model }) {
    return <Badge variant="info">{model}</Badge>;
}
export function ModeBadge({ mode }) {
    const configs = {
        command: { variant: "primary", text: "/" },
        file: { variant: "success", text: "@" },
        shell: { variant: "warning", text: "!" },
    };
    const config = configs[mode];
    return <Badge variant={config.variant}>{config.text}</Badge>;
}
