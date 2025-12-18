import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Text } from "ink";
import { TextInput } from "@inkjs/ui";
import { SlashCommandHelp } from "./SlashCommandHelp.js";
import { getSlashCommandRegistry } from "../../core/slash-commands.js";
export function InputBox({ onSubmit, isDisabled = false, sessionNum, resetToken = 0, }) {
    const [inputKey, setInputKey] = useState(0);
    const [currentInput, setCurrentInput] = useState("");
    const handleSubmit = (submittedValue) => {
        onSubmit(submittedValue);
        setInputKey((prev) => prev + 1); // Force remount to clear input
        setCurrentInput(""); // Reset input tracking
    };
    const handleChange = (value) => {
        setCurrentInput(value);
    };
    const showSlashHelp = currentInput.startsWith("/") && currentInput.length >= 1;
    const registry = getSlashCommandRegistry();
    const allCommands = registry.listCommands();
    return (_jsxs(Box, { flexDirection: "column", children: [showSlashHelp && (_jsx(SlashCommandHelp, { commands: allCommands, filter: currentInput.length > 1 ? currentInput : undefined })), _jsxs(Box, { borderStyle: "round", borderColor: "cyan", paddingX: 1, children: [_jsx(Text, { color: "gray", children: "\u2192 " }), _jsx(TextInput, { placeholder: "Plan, search, build anything", onSubmit: handleSubmit, onChange: handleChange, isDisabled: isDisabled }, `${resetToken}-${inputKey}`)] }), _jsxs(Box, { paddingLeft: 1, gap: 1, children: [_jsxs(Text, { dimColor: true, children: ["Session ", sessionNum] }), _jsx(Text, { dimColor: true, children: "/ commands \u00B7 @ files \u00B7 ! shell" })] })] }));
}
