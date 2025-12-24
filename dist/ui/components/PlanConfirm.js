import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Text, useInput } from "ink";
import { icons } from "../theme.js";
import { PlanDisplay } from "./PlanDisplay.js";
export function PlanConfirm({ plan, onApprove, onReject, onModify, }) {
    const [selected, setSelected] = useState("yes");
    const [showModifyInput, setShowModifyInput] = useState(false);
    const [modifyText, setModifyText] = useState("");
    useInput((input, key) => {
        // If in modify input mode, handle text input
        if (showModifyInput) {
            if (key.escape) {
                setShowModifyInput(false);
                setModifyText("");
                return;
            }
            if (key.return && modifyText.trim()) {
                onModify(modifyText.trim());
                return;
            }
            if (key.backspace || key.delete) {
                setModifyText((prev) => prev.slice(0, -1));
                return;
            }
            if (input && input.length === 1 && !key.ctrl && !key.meta) {
                setModifyText((prev) => prev + input);
            }
            return;
        }
        // Navigation between options
        if (key.leftArrow || input === "h") {
            setSelected((prev) => {
                if (prev === "yes")
                    return "modify";
                if (prev === "no")
                    return "yes";
                return "no";
            });
        }
        if (key.rightArrow || input === "l") {
            setSelected((prev) => {
                if (prev === "yes")
                    return "no";
                if (prev === "no")
                    return "modify";
                return "yes";
            });
        }
        // Quick shortcuts
        if (input === "y" || input === "Y") {
            onApprove();
            return;
        }
        if (input === "n" || input === "N") {
            onReject();
            return;
        }
        if (input === "m" || input === "M") {
            setShowModifyInput(true);
            return;
        }
        // Enter to confirm selection
        if (key.return) {
            if (selected === "yes") {
                onApprove();
            }
            else if (selected === "no") {
                onReject();
            }
            else {
                setShowModifyInput(true);
            }
        }
        // Escape to cancel
        if (key.escape) {
            onReject();
        }
    });
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "cyan", paddingX: 1, paddingY: 0, children: [_jsx(Box, { marginBottom: 1, children: _jsxs(Text, { color: "cyan", bold: true, children: [icons.section, " Plan: ", plan.title] }) }), _jsx(PlanDisplay, { plan: plan }), _jsxs(Box, { gap: 2, marginTop: 1, children: [_jsxs(Box, { children: [_jsxs(Text, { color: selected === "yes" ? "green" : "gray", children: [selected === "yes" ? icons.chevron : " ", " Yes, proceed"] }), _jsx(Text, { dimColor: true, children: " (y)" })] }), _jsxs(Box, { children: [_jsxs(Text, { color: selected === "no" ? "red" : "gray", children: [selected === "no" ? icons.chevron : " ", " No, cancel"] }), _jsx(Text, { dimColor: true, children: " (n)" })] }), _jsxs(Box, { children: [_jsxs(Text, { color: selected === "modify" ? "yellow" : "gray", children: [selected === "modify" ? icons.chevron : " ", " Modify..."] }), _jsx(Text, { dimColor: true, children: " (m)" })] })] }), showModifyInput && (_jsxs(Box, { flexDirection: "column", marginTop: 1, borderStyle: "single", borderColor: "yellow", paddingX: 1, children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: "yellow", children: "What would you like to change?" }) }), _jsxs(Box, { children: [_jsxs(Text, { color: "yellow", children: [icons.chevron, " "] }), _jsx(Text, { children: modifyText }), _jsx(Text, { dimColor: true, children: "_" })] }), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, children: ["enter submit ", icons.bullet, " esc cancel"] }) })] })), !showModifyInput && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, children: ["arrows select ", icons.bullet, " enter confirm ", icons.bullet, " esc cancel"] }) }))] }));
}
