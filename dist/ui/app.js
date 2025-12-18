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
import { getSlashCommandRegistry } from "../core/slash-commands.js";
import { getSessionManager } from "../core/session-manager.js";
import { getTokenTracker } from "../core/token-tracker.js";
import { getDryRunManager } from "../core/dry-run.js";
const HEADER = `
  ██████╗  ██████╗  ██████╗ ████████╗███████╗████████╗██████╗  █████╗ ██████╗
  ██╔══██╗██╔═══██╗██╔═══██╗╚══██╔══╝██╔════╝╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗
  ██████╔╝██║   ██║██║   ██║   ██║   ███████╗   ██║   ██████╔╝███████║██████╔╝
  ██╔══██╗██║   ██║██║   ██║   ██║   ╚════██║   ██║   ██╔══██╗██╔══██║██╔═══╝
  ██████╔╝╚██████╔╝╚██████╔╝   ██║   ███████║   ██║   ██║  ██║██║  ██║██║
  ╚═════╝  ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝
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
                // Update session ID
                const sessionMgr = getSessionManager();
                const session = sessionMgr.getCurrentSession();
                if (session) {
                    setSessionId(session.metadata.id);
                }
                // Update token stats
                const tracker = getTokenTracker();
                setTokenStats({
                    total: tracker.getTotalTokens(),
                    cost: tracker.getTotalCost()
                });
                // Update dry-run status
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
        // Check for slash commands
        const cmdRegistry = getSlashCommandRegistry();
        let finalInput = value;
        if (cmdRegistry.isSlashCommand(value)) {
            try {
                const parsed = cmdRegistry.parseCommand(value);
                if (parsed) {
                    finalInput = cmdRegistry.expandCommand(parsed.command, parsed.args);
                    console.log(`\n💡 Expanded /${parsed.command.name} → "${finalInput.substring(0, 60)}..."\n`);
                }
            }
            catch (error) {
                console.log(`\n❌ ${error.message}\n`);
                return;
            }
        }
        setIsProcessing(true);
        try {
            await onSubmit(finalInput);
        }
        finally {
            setIsProcessing(false);
        }
    };
    return (_jsx(Box, { flexDirection: "row", children: _jsxs(Box, { flexDirection: "column", flexGrow: 1, children: [_jsx(Static, { items: ["header"], children: () => (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: "cyan", bold: true, children: HEADER }), isDryRun && (_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { backgroundColor: "yellow", color: "black", bold: true, children: " [DRY RUN MODE] " }), _jsx(Text, { color: "yellow", children: " No changes will be applied" })] })), _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsxs(Box, { children: [_jsx(Text, { color: "green", children: "\u2713" }), _jsx(Text, { children: " Safe mode enabled " }), _jsx(Text, { dimColor: true, children: "(Ctrl+C to quit)" })] }), _jsxs(Box, { children: [_jsx(Text, { color: "cyan", children: "\u25CF" }), _jsx(Text, { children: " Claude Sonnet 4.5 via OpenRouter" })] }), _jsxs(Box, { children: [_jsx(Text, { color: "magenta", children: "\uD83D\uDCC1" }), _jsxs(Text, { children: [" ", process.cwd()] })] })] }), (sessionId || tokenStats.total > 0) && (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "gray", paddingX: 1, marginBottom: 1, children: [sessionId && (_jsxs(Box, { children: [_jsx(Text, { color: "yellow", children: "Session:" }), _jsxs(Text, { children: [" ", sessionId] })] })), tokenStats.total > 0 && (_jsxs(Box, { children: [_jsx(Text, { color: "blue", children: "Usage:" }), _jsxs(Text, { children: [" ", tokenStats.total.toLocaleString(), " tokens"] }), _jsx(Text, { dimColor: true, children: " | " }), _jsxs(Text, { color: "green", children: ["$", tokenStats.cost.toFixed(4)] })] }))] })), _jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "cyan", paddingX: 1, marginBottom: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "Quick Reference" }), _jsxs(Box, { children: [_jsx(Text, { color: "yellow", children: "/" }), _jsx(Text, { children: " Slash commands - Type / to see all commands" })] }), _jsxs(Box, { children: [_jsx(Text, { color: "yellow", children: "Ctrl+C" }), _jsx(Text, { children: " Exit the application" })] }), _jsxs(Box, { children: [_jsx(Text, { color: "yellow", children: "Ctrl+O" }), _jsx(Text, { children: " Expand truncated output" })] })] }), _jsx(Text, { color: "gray", children: '─'.repeat(80) }), _jsx(Text, { children: " " })] }, "header")) }), isProcessing && (_jsx(Box, { marginBottom: 1, children: _jsx(Spinner, { label: statusMessage || "Thinking..." }) })), todos.length > 0 && _jsx(TodoList, { todos: todos }), _jsx(ToolOutputDisplay, { expandedOutputId: expandedOutputId }), confirmState && (_jsx(Box, { marginBottom: 1, children: _jsx(Confirm, { message: confirmState.message, onConfirm: handleConfirm, onCancel: handleCancel }) })), _jsx(InputBox, { onSubmit: handleSubmit, isDisabled: isProcessing || !!confirmState || !!expandedOutputId, sessionNum: sessionNum, resetToken: inputResetToken })] }) }));
}
