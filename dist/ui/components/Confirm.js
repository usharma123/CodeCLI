import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Text, useInput } from "ink";
import { icons } from "../theme.js";
export function Confirm({ message, onConfirm, onCancel, variant = "default", }) {
    const [selected, setSelected] = useState("yes");
    useInput((input, key) => {
        if (key.leftArrow || key.rightArrow || input === "h" || input === "l") {
            setSelected((prev) => (prev === "yes" ? "no" : "yes"));
        }
        if (key.return) {
            selected === "yes" ? onConfirm() : onCancel();
        }
        if (input === "y" || input === "Y")
            onConfirm();
        if (input === "n" || input === "N")
            onCancel();
        if (key.escape)
            onCancel();
    });
    const isDanger = variant === "danger";
    const borderColor = isDanger ? "red" : "yellow";
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: borderColor, paddingX: 1, children: [_jsxs(Box, { marginBottom: 1, children: [_jsxs(Text, { color: borderColor, children: [isDanger ? "!" : "?", " "] }), _jsx(Text, { children: message })] }), _jsxs(Box, { gap: 2, children: [_jsxs(Box, { children: [_jsxs(Text, { color: selected === "yes" ? "green" : "gray", children: [selected === "yes" ? ">" : " ", " yes"] }), _jsx(Text, { dimColor: true, children: " (y)" })] }), _jsxs(Box, { children: [_jsxs(Text, { color: selected === "no" ? "red" : "gray", children: [selected === "no" ? ">" : " ", " no"] }), _jsx(Text, { dimColor: true, children: " (n)" })] })] }), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, children: ["arrows select ", icons.bullet, " enter confirm ", icons.bullet, " esc cancel"] }) })] }));
}
export function QuickConfirm({ message, onConfirm, onCancel }) {
    useInput((input, key) => {
        if (input === "y" || input === "Y")
            onConfirm();
        if (input === "n" || input === "N" || key.escape)
            onCancel();
    });
    return (_jsxs(Box, { children: [_jsx(Text, { color: "yellow", children: "? " }), _jsx(Text, { children: message }), _jsx(Text, { dimColor: true, children: " (y/n)" })] }));
}
export function DangerConfirm({ message, action, onConfirm, onCancel, }) {
    const [confirmText, setConfirmText] = useState("");
    const isConfirmed = confirmText.toLowerCase() === action.toLowerCase();
    useInput((input, key) => {
        if (key.escape) {
            onCancel();
            return;
        }
        if (key.return && isConfirmed) {
            onConfirm();
            return;
        }
        if (key.backspace || key.delete) {
            setConfirmText((prev) => prev.slice(0, -1));
            return;
        }
        if (input && input.length === 1 && !key.ctrl && !key.meta) {
            setConfirmText((prev) => prev + input);
        }
    });
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "red", paddingX: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: "red", children: "! danger" }) }), _jsx(Box, { marginBottom: 1, children: _jsx(Text, { children: message }) }), _jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { dimColor: true, children: "type \"" }), _jsx(Text, { color: "red", children: action }), _jsx(Text, { dimColor: true, children: "\" to confirm:" })] }), _jsxs(Box, { children: [_jsxs(Text, { color: isConfirmed ? "green" : "white", children: [icons.chevron, " ", confirmText] }), _jsx(Text, { dimColor: true, children: "_" })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "esc cancel" }) })] }));
}
