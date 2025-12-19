import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Text } from "ink";
import { TextInput } from "@inkjs/ui";
import { SlashCommandHelp } from "./SlashCommandHelp.js";
import { getSlashCommandRegistry } from "../../core/slash-commands.js";
import { icons } from "../theme.js";
export function InputBox({ onSubmit, isDisabled = false, sessionNum, resetToken = 0, }) {
    const [inputKey, setInputKey] = useState(0);
    const [currentInput, setCurrentInput] = useState("");
    const handleSubmit = (submittedValue) => {
        onSubmit(submittedValue);
        setInputKey((prev) => prev + 1);
        setCurrentInput("");
    };
    const handleChange = (value) => {
        setCurrentInput(value);
    };
    const showSlashHelp = currentInput.startsWith("/") && currentInput.length >= 1;
    const registry = getSlashCommandRegistry();
    const allCommands = registry.listCommands();
    // Detect input mode
    const inputMode = currentInput.startsWith("/")
        ? "command"
        : currentInput.startsWith("@")
            ? "file"
            : currentInput.startsWith("!")
                ? "shell"
                : null;
    // Mode-based styling (subtle) - only change border color, not prompt
    // This avoids duplication since the input already contains the mode character
    const borderColor = inputMode === "command"
        ? "blue"
        : inputMode === "file"
            ? "green"
            : inputMode === "shell"
                ? "yellow"
                : "gray";
    return (_jsxs(Box, { flexDirection: "column", children: [showSlashHelp && (_jsx(SlashCommandHelp, { commands: allCommands, filter: currentInput.length > 1 ? currentInput : undefined })), _jsxs(Box, { borderStyle: "single", borderColor: borderColor, paddingX: 1, children: [_jsxs(Text, { color: inputMode ? borderColor : "gray", children: [">", " "] }), _jsx(TextInput, { placeholder: "ask anything...", onSubmit: handleSubmit, onChange: handleChange, isDisabled: isDisabled }, `${resetToken}-${inputKey}`)] }), _jsx(Box, { paddingLeft: 1, children: _jsxs(Text, { dimColor: true, children: ["session ", sessionNum, currentInput.length > 80 && ` ${icons.bullet} ${currentInput.length} chars`] }) })] }));
}
export function MinimalInput({ onSubmit, placeholder = "...", isDisabled = false, }) {
    const [inputKey, setInputKey] = useState(0);
    const handleSubmit = (value) => {
        onSubmit(value);
        setInputKey((prev) => prev + 1);
    };
    return (_jsxs(Box, { children: [_jsxs(Text, { dimColor: true, children: [icons.chevron, " "] }), _jsx(TextInput, { placeholder: placeholder, onSubmit: handleSubmit, isDisabled: isDisabled }, inputKey)] }));
}
