import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Text } from "ink";
import { TextInput } from "@inkjs/ui";
export function InputBox({ onSubmit, isDisabled = false, sessionNum, resetToken = 0, }) {
    const [inputKey, setInputKey] = useState(0);
    const handleSubmit = (submittedValue) => {
        onSubmit(submittedValue);
        setInputKey((prev) => prev + 1); // Force remount to clear input
    };
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { borderStyle: "round", borderColor: "cyan", paddingX: 1, children: [_jsx(Text, { color: "gray", children: "\u2192 " }), _jsx(TextInput, { placeholder: "Plan, search, build anything", onSubmit: handleSubmit, isDisabled: isDisabled }, `${resetToken}-${inputKey}`)] }), _jsxs(Box, { paddingLeft: 1, gap: 1, children: [_jsxs(Text, { dimColor: true, children: ["Session ", sessionNum] }), _jsx(Text, { dimColor: true, children: "/ commands \u00B7 @ files \u00B7 ! shell" })] })] }));
}
