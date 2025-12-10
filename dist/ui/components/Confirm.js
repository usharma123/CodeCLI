import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Text, useInput } from "ink";
export function Confirm({ message, onConfirm, onCancel }) {
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
    });
    return (_jsxs(Box, { children: [_jsxs(Text, { color: "yellow", children: [message, " "] }), _jsxs(Text, { color: selected === "yes" ? "green" : "gray", children: [selected === "yes" ? "▸ " : "  ", _jsxs(Text, { bold: selected === "yes", inverse: selected === "yes", children: [" ", "Yes", " "] })] }), _jsx(Text, { children: " " }), _jsxs(Text, { color: selected === "no" ? "red" : "gray", children: [selected === "no" ? "▸ " : "  ", _jsxs(Text, { bold: selected === "no", inverse: selected === "no", children: [" ", "No", " "] })] }), _jsx(Text, { dimColor: true, children: "  \u2190/\u2192 to select, Enter to confirm" })] }));
}
