import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from "react";
import { Box, Text, Static, useApp, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { InputBox } from "./components/InputBox.js";
import { Confirm } from "./components/Confirm.js";
import { TodoList } from "./components/TodoList.js";
import { ToolOutputDisplay } from "./components/ToolOutputDisplay.js";
import { onStatus, getStatus } from "../core/status.js";
import { getLastTruncatedOutput } from "../core/output.js";
const HEADER = `
   █████╗ ██╗     █████╗  ██████╗ ███████╗███╗   ██╗████████╗
  ██╔══██╗██║    ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
  ███████║██║    ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║
  ██╔══██║██║    ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║
  ██║  ██║██║    ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║
  ╚═╝  ╚═╝╚═╝    ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝
`;
export function App({ onSubmit, onConfirmRequest, agentRef }) {
    const { exit } = useApp();
    const [isProcessing, setIsProcessing] = useState(false);
    const [sessionNum] = useState(1);
    const [statusMessage, setStatusMessage] = useState(getStatus().message || "Thinking...");
    const [confirmState, setConfirmState] = useState(null);
    const [todos, setTodos] = useState([]);
    const [expandedOutputId, setExpandedOutputId] = useState(null);
    const [inputResetToken, setInputResetToken] = useState(0);
    // Register confirmation handler
    React.useEffect(() => {
        if (onConfirmRequest) {
            onConfirmRequest(async (message) => {
                return new Promise((resolve) => {
                    setConfirmState({ message, resolver: resolve });
                });
            });
        }
    }, [onConfirmRequest]);
    React.useEffect(() => {
        const unsubscribe = onStatus((s) => {
            setStatusMessage(s.message);
        });
        return unsubscribe;
    }, []);
    // Poll for todo updates
    React.useEffect(() => {
        let interval = null;
        if (agentRef?.current) {
            interval = setInterval(() => {
                try {
                    const todoState = agentRef.current.getTodos();
                    setTodos(todoState.todos);
                }
                catch (err) {
                    // Silently ignore polling errors
                }
            }, 500);
        }
        return () => {
            if (interval)
                clearInterval(interval);
        };
    }, [agentRef]);
    const handleConfirm = () => {
        if (confirmState) {
            confirmState.resolver(true);
            setConfirmState(null);
        }
    };
    const handleCancel = () => {
        if (confirmState) {
            confirmState.resolver(false);
            setConfirmState(null);
        }
    };
    useInput((input, key) => {
        const isCtrlC = (key.ctrl && input === "c") || input === "\u0003";
        if (isCtrlC) {
            console.log("\n\nGoodbye!");
            exit();
        }
        const isCtrlO = (key.ctrl && input === "o") || input === "\u000f";
        // Handle expanded output view
        if (expandedOutputId) {
            if (isCtrlO || key.escape || input === "q" || input === "Q") {
                setExpandedOutputId(null);
                setInputResetToken((prev) => prev + 1);
            }
            return;
        }
        // Ctrl+O: Expand truncated output
        if (isCtrlO) {
            setExpandedOutputId((current) => {
                const lastTruncated = getLastTruncatedOutput();
                return lastTruncated ? lastTruncated.id : null;
            });
            setInputResetToken((prev) => prev + 1);
        }
    }, { isActive: process.stdin.isTTY ?? false });
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
    return (_jsx(Box, { flexDirection: "row", children: _jsxs(Box, { flexDirection: "column", flexGrow: 1, children: [_jsx(Static, { items: ["header"], children: () => (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: "cyan", children: HEADER }), _jsx(Text, { dimColor: true, children: "Safe mode enabled (ctrl+c to quit)" }), _jsx(Text, { dimColor: true, children: "File changes require your approval before being applied" }), _jsx(Text, { dimColor: true, children: "Using Claude Sonnet 4.5 via OpenRouter" }), _jsx(Text, { children: " " })] }, "header")) }), isProcessing && (_jsx(Box, { marginBottom: 1, children: _jsx(Spinner, { label: statusMessage || "Thinking..." }) })), todos.length > 0 && _jsx(TodoList, { todos: todos }), _jsx(ToolOutputDisplay, { expandedOutputId: expandedOutputId }), confirmState && (_jsx(Box, { marginBottom: 1, children: _jsx(Confirm, { message: confirmState.message, onConfirm: handleConfirm, onCancel: handleCancel }) })), _jsx(InputBox, { onSubmit: handleSubmit, isDisabled: isProcessing || !!confirmState || !!expandedOutputId, sessionNum: sessionNum, resetToken: inputResetToken })] }) }));
}
