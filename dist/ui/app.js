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
        if (!agentRef?.current)
            return;
        const interval = setInterval(() => {
            try {
                const todoState = agentRef.current.getTodos();
                setTodos(todoState.todos);
            }
            catch (err) {
                // Silently ignore polling errors
            }
        }, 500); // Poll every 500ms
        return () => clearInterval(interval);
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
        if (key.ctrl && input === "c") {
            console.log("\n\nGoodbye!");
            exit();
        }
        if (key.ctrl && input === "o") {
            // Toggle expansion of most recent truncated output
            const lastTruncated = getLastTruncatedOutput();
            if (lastTruncated) {
                setExpandedOutputId((current) => current === lastTruncated.id ? null : lastTruncated.id);
            }
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
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Static, { items: ["header"], children: () => (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: "cyan", children: HEADER }), _jsx(Text, { dimColor: true, children: "Safe mode enabled (ctrl+c to quit)" }), _jsx(Text, { dimColor: true, children: "File changes require your approval before being applied" }), _jsx(Text, { dimColor: true, children: "Using Claude Sonnet 4.5 via OpenRouter" }), _jsx(Text, { children: " " })] }, "header")) }), isProcessing && (_jsx(Box, { marginBottom: 1, children: _jsx(Spinner, { label: statusMessage || "Thinking..." }) })), todos.length > 0 && _jsx(TodoList, { todos: todos }), _jsx(ToolOutputDisplay, { expandedOutputId: expandedOutputId }), confirmState && (_jsx(Box, { marginBottom: 1, children: _jsx(Confirm, { message: confirmState.message, onConfirm: handleConfirm, onCancel: handleCancel }) })), _jsx(InputBox, { onSubmit: handleSubmit, isDisabled: isProcessing || !!confirmState, sessionNum: sessionNum })] }));
}
