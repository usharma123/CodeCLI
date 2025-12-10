import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Text, Static, useApp, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { InputBox } from "./components/InputBox.js";
const HEADER = `
   █████╗ ██╗     █████╗  ██████╗ ███████╗███╗   ██╗████████╗
  ██╔══██╗██║    ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
  ███████║██║    ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║
  ██╔══██║██║    ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║
  ██║  ██║██║    ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║
  ╚═╝  ╚═╝╚═╝    ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝
`;
export function App({ onSubmit }) {
    const { exit } = useApp();
    const [isProcessing, setIsProcessing] = useState(false);
    const [sessionNum] = useState(1);
    useInput((input, key) => {
        if (key.ctrl && input === "c") {
            console.log("\n\nGoodbye!");
            exit();
        }
    }, { isActive: !isProcessing && (process.stdin.isTTY ?? false) });
    const handleSubmit = async (value) => {
        if (!value.trim() || isProcessing)
            return;
        setIsProcessing(true);
        try {
            await onSubmit(value);
        }
        finally {
            setIsProcessing(false);
        }
    };
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Static, { items: ["header"], children: () => (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: "cyan", children: HEADER }), _jsx(Text, { dimColor: true, children: "Safe mode enabled (ctrl+c to quit)" }), _jsx(Text, { dimColor: true, children: "File changes require your approval before being applied" }), _jsx(Text, { dimColor: true, children: "Using Claude Sonnet 4.5 via OpenRouter" }), _jsx(Text, { children: " " })] }, "header")) }), isProcessing && (_jsx(Box, { marginBottom: 1, children: _jsx(Spinner, { label: "Thinking..." }) })), _jsx(InputBox, { onSubmit: handleSubmit, isDisabled: isProcessing, sessionNum: sessionNum })] }));
}
