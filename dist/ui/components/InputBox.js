import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { TextInput } from "@inkjs/ui";
export function InputBox({ onSubmit, isDisabled = false, sessionNum, }) {
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { borderStyle: "round", borderColor: "cyan", paddingX: 1, children: [_jsx(Text, { color: "gray", children: "\u2192 " }), _jsx(TextInput, { placeholder: "Plan, search, build anything", onSubmit: onSubmit, isDisabled: isDisabled })] }), _jsxs(Box, { paddingLeft: 1, gap: 1, children: [_jsxs(Text, { dimColor: true, children: ["Session ", sessionNum] }), _jsx(Text, { dimColor: true, children: "/ commands \u00B7 @ files \u00B7 ! shell" })] })] }));
}
