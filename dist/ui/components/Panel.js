import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Text, useInput } from "ink";
import { icons } from "../theme.js";
const variantBorders = {
    default: "round",
    accent: "double",
    subtle: "single",
    glow: "round",
    none: undefined,
};
export function Panel({ children, title, titleIcon, variant = "default", color = "cyan", footer, collapsible = false, defaultCollapsed = false, paddingX = 1, paddingY = 0, marginBottom = 1, width, }) {
    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    useInput((input, key) => {
        if (collapsible && (key.return || input === " ")) {
            setCollapsed((c) => !c);
        }
    }, { isActive: collapsible });
    const borderStyle = variantBorders[variant];
    const showBorder = variant !== "none";
    // Glow effect uses brighter color
    const borderColor = variant === "glow" ? color : color;
    return (_jsxs(Box, { flexDirection: "column", borderStyle: showBorder ? borderStyle : undefined, borderColor: showBorder ? borderColor : undefined, paddingX: paddingX, paddingY: paddingY, marginBottom: marginBottom, width: width, children: [title && (_jsxs(Box, { marginBottom: collapsed ? 0 : 1, children: [_jsxs(Text, { color: color, bold: true, children: [titleIcon && `${titleIcon} `, title] }), collapsible && (_jsxs(Text, { color: "gray", children: [" ", collapsed ? icons.arrowRight : icons.arrowDown] }))] })), !collapsed && (_jsx(Box, { flexDirection: "column", children: children })), !collapsed && footer && (_jsx(Box, { marginTop: 1, borderStyle: "single", borderColor: "gray", borderTop: true, borderBottom: false, borderLeft: false, borderRight: false, children: footer }))] }));
}
// Preset panel styles
export function InfoPanel({ children, title }) {
    return (_jsx(Panel, { title: title, titleIcon: icons.info, color: "cyan", variant: "subtle", children: children }));
}
export function SuccessPanel({ children, title }) {
    return (_jsx(Panel, { title: title, titleIcon: icons.success, color: "green", variant: "default", children: children }));
}
export function WarningPanel({ children, title }) {
    return (_jsx(Panel, { title: title, titleIcon: icons.warning, color: "yellow", variant: "default", children: children }));
}
export function ErrorPanel({ children, title }) {
    return (_jsx(Panel, { title: title, titleIcon: icons.error, color: "red", variant: "accent", children: children }));
}
// Floating panel with shadow effect (simulated)
export function FloatingPanel({ children, title, titleIcon, color = "cyan", }) {
    return (_jsx(Box, { flexDirection: "column", marginBottom: 1, children: _jsx(Box, { position: "relative", children: _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: color, paddingX: 1, children: [title && (_jsx(Box, { marginBottom: 1, children: _jsxs(Text, { color: color, bold: true, children: [titleIcon && `${titleIcon} `, title] }) })), _jsx(Box, { flexDirection: "column", children: children })] }) }) }));
}
