import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from "react";
import { Box, Text, Static, useApp, useInput } from "ink";
import { Spinner } from "@inkjs/ui";
import { InputBox } from "./components/InputBox.js";
import { Confirm } from "./components/Confirm.js";
import { TodoList } from "./components/TodoList.js";
import { ToolOutputDisplay } from "./components/ToolOutputDisplay.js";
import { AgentActivityPanel } from "./components/AgentActivityPanel.js";
import { AgentMetricsPanel } from "./components/AgentMetricsPanel.js";
import { AgentCommunicationLog } from "./components/AgentCommunicationLog.js";
import { onStatus, getStatus } from "../core/status.js";
import { getLastTruncatedOutput } from "../core/output.js";
import { onAgentTask } from "../core/agent-events.js";
import { isSubAgentsEnabled } from "../core/feature-flags.js";
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
    const [showAgentPanel, setShowAgentPanel] = useState(isSubAgentsEnabled());
    const [showMetrics, setShowMetrics] = useState(false);
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
    // Event-driven todo updates (replaces polling)
    React.useEffect(() => {
        // Subscribe to agent task events for todo updates
        const unsubscribe = onAgentTask((event) => {
            if (event.type === "completed" && event.result?.data?.todos) {
                setTodos(event.result.data.todos);
            }
        });
        // Fallback: Poll if agentRef is available (for backward compatibility)
        let interval = null;
        if (agentRef?.current && !isSubAgentsEnabled()) {
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
            unsubscribe();
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
        const isCtrlA = (key.ctrl && input === "a") || input === "\u0001";
        const isCtrlM = (key.ctrl && input === "m") || input === "\r";
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
        // Ctrl+A: Toggle agent activity panel
        if (isCtrlA && isSubAgentsEnabled()) {
            setShowAgentPanel((prev) => !prev);
        }
        // Ctrl+M: Toggle metrics (future feature)
        if (isCtrlM && isSubAgentsEnabled()) {
            setShowMetrics((prev) => !prev);
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
    return (_jsxs(Box, { flexDirection: "row", children: [_jsxs(Box, { flexDirection: "column", flexGrow: 1, children: [_jsx(Static, { items: ["header"], children: () => (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: "cyan", children: HEADER }), _jsx(Text, { dimColor: true, children: "Safe mode enabled (ctrl+c to quit)" }), _jsx(Text, { dimColor: true, children: "File changes require your approval before being applied" }), _jsx(Text, { dimColor: true, children: "Using Claude Sonnet 4.5 via OpenRouter" }), isSubAgentsEnabled() && (_jsx(Text, { dimColor: true, children: "Multi-agent mode: Ctrl+A (activity), Ctrl+M (metrics)" })), _jsx(Text, { children: " " })] }, "header")) }), isProcessing && (_jsx(Box, { marginBottom: 1, children: _jsx(Spinner, { label: statusMessage || "Thinking..." }) })), todos.length > 0 && _jsx(TodoList, { todos: todos }), _jsx(ToolOutputDisplay, { expandedOutputId: expandedOutputId }), confirmState && (_jsx(Box, { marginBottom: 1, children: _jsx(Confirm, { message: confirmState.message, onConfirm: handleConfirm, onCancel: handleCancel }) })), _jsx(InputBox, { onSubmit: handleSubmit, isDisabled: isProcessing || !!confirmState || !!expandedOutputId, sessionNum: sessionNum, resetToken: inputResetToken })] }), isSubAgentsEnabled() && (showAgentPanel || showMetrics) && (_jsxs(Box, { marginLeft: 1, flexDirection: "column", gap: 1, children: [showAgentPanel && _jsx(AgentActivityPanel, {}), showMetrics && (_jsxs(_Fragment, { children: [_jsx(AgentMetricsPanel, {}), _jsx(AgentCommunicationLog, {})] }))] }))] }));
}
