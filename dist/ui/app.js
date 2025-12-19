import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from "react";
import { Box, Text, Static, useApp, useInput } from "ink";
import { InputBox } from "./components/InputBox.js";
import { Confirm } from "./components/Confirm.js";
import { TodoList } from "./components/TodoList.js";
import { ToolOutputDisplay } from "./components/ToolOutputDisplay.js";
import { StatusBar } from "./components/StatusBar.js";
import { onStatus, getStatus } from "../core/status.js";
import { getLastTruncatedOutput } from "../core/output.js";
import { getSlashCommandRegistry } from "../core/slash-commands.js";
import { getSessionManager } from "../core/session-manager.js";
import { getTokenTracker } from "../core/token-tracker.js";
import { getDryRunManager } from "../core/dry-run.js";
import { brand, icons, createSeparator } from "./theme.js";
export function App({ onSubmit, onConfirmRequest, agentRef }) {
    const { exit } = useApp();
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStartTime, setProcessingStartTime] = useState(null);
    const [sessionNum] = useState(1);
    const [statusMessage, setStatusMessage] = useState(getStatus().message || "thinking...");
    const [confirmState, setConfirmState] = useState(null);
    const [todos, setTodos] = useState([]);
    const [expandedOutputId, setExpandedOutputId] = useState(null);
    const [inputResetToken, setInputResetToken] = useState(0);
    // Feature state
    const [sessionId, setSessionId] = useState("");
    const [tokenStats, setTokenStats] = useState({ total: 0, cost: 0 });
    const [isDryRun, setIsDryRun] = useState(false);
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
    // Poll for feature updates
    React.useEffect(() => {
        const interval = setInterval(() => {
            try {
                const sessionMgr = getSessionManager();
                const session = sessionMgr.getCurrentSession();
                if (session) {
                    setSessionId(session.metadata.id);
                }
                const tracker = getTokenTracker();
                setTokenStats({
                    total: tracker.getTotalTokens(),
                    cost: tracker.getTotalCost()
                });
                const dryRun = getDryRunManager();
                setIsDryRun(dryRun.isEnabled());
            }
            catch (err) {
                // Silently ignore polling errors
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);
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
            console.log("\n");
            exit();
        }
        const isCtrlO = (key.ctrl && input === "o") || input === "\u000f";
        if (expandedOutputId) {
            if (isCtrlO || key.escape || input === "q" || input === "Q") {
                setExpandedOutputId(null);
                setInputResetToken((prev) => prev + 1);
            }
            return;
        }
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
        const cmdRegistry = getSlashCommandRegistry();
        let finalInput = value;
        if (cmdRegistry.isSlashCommand(value)) {
            try {
                const parsed = cmdRegistry.parseCommand(value);
                if (parsed) {
                    finalInput = cmdRegistry.expandCommand(parsed.command, parsed.args);
                    console.log(`\n${icons.arrow} /${parsed.command.name}\n`);
                }
            }
            catch (error) {
                console.log(`\n${icons.error} ${error.message}\n`);
                return;
            }
        }
        setIsProcessing(true);
        setProcessingStartTime(Date.now());
        try {
            await onSubmit(finalInput);
        }
        finally {
            setIsProcessing(false);
            setProcessingStartTime(null);
        }
    };
    // Get working directory (last 2 segments)
    const cwd = process.cwd().split('/').slice(-2).join('/');
    return (_jsx(Box, { flexDirection: "row", children: _jsxs(Box, { flexDirection: "column", flexGrow: 1, children: [_jsx(Static, { items: ["header"], children: () => (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: "cyan", bold: true, children: brand.logo }), _jsx(Box, { marginBottom: 1, children: _jsx(Text, { dimColor: true, children: brand.tagline }) }), _jsxs(Box, { marginBottom: 1, children: [isDryRun && (_jsxs(_Fragment, { children: [_jsx(Text, { color: "yellow", children: "[dry-run]" }), _jsxs(Text, { dimColor: true, children: [" ", icons.pipe, " "] })] })), _jsx(Text, { dimColor: true, children: "model:" }), _jsx(Text, { color: "cyan", children: " sonnet-4.5" }), _jsxs(Text, { dimColor: true, children: [" ", icons.pipe, " "] }), _jsx(Text, { dimColor: true, children: "cwd:" }), _jsxs(Text, { children: [" ", cwd] }), sessionId && (_jsxs(_Fragment, { children: [_jsxs(Text, { dimColor: true, children: [" ", icons.pipe, " "] }), _jsx(Text, { dimColor: true, children: "session:" }), _jsxs(Text, { color: "blue", children: [" ", sessionId.substring(0, 8)] })] })), tokenStats.total > 0 && (_jsxs(_Fragment, { children: [_jsxs(Text, { dimColor: true, children: [" ", icons.pipe, " "] }), _jsx(Text, { dimColor: true, children: "tokens:" }), _jsxs(Text, { children: [" ", tokenStats.total.toLocaleString()] })] })), tokenStats.cost > 0 && (_jsxs(_Fragment, { children: [_jsxs(Text, { dimColor: true, children: [" ", icons.pipe, " "] }), _jsxs(Text, { color: "green", children: ["$", tokenStats.cost.toFixed(4)] })] }))] }), _jsx(Box, { marginBottom: 1, children: _jsxs(Text, { dimColor: true, children: ["^c quit ", icons.bullet, " ^o output ", icons.bullet, " / commands ", icons.bullet, " @ files ", icons.bullet, " ! shell"] }) }), _jsx(Text, { dimColor: true, children: createSeparator(70) }), _jsx(Text, { children: " " })] }, "header")) }), isProcessing && (_jsx(StatusBar, { message: statusMessage || "thinking...", isProcessing: isProcessing, startTime: processingStartTime || undefined })), todos.length > 0 && _jsx(TodoList, { todos: todos }), _jsx(ToolOutputDisplay, { expandedOutputId: expandedOutputId }), confirmState && (_jsx(Box, { marginBottom: 1, children: _jsx(Confirm, { message: confirmState.message, onConfirm: handleConfirm, onCancel: handleCancel }) })), _jsx(InputBox, { onSubmit: handleSubmit, isDisabled: isProcessing || !!confirmState || !!expandedOutputId, sessionNum: sessionNum, resetToken: inputResetToken })] }) }));
}
