import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { onAgentStatus, onAgentTask } from "../../core/agent-events.js";
/**
 * AgentActivityPanel - Shows real-time multi-agent activity
 * Displays in right sidebar (40 columns), toggle with Ctrl+A
 */
export function AgentActivityPanel() {
    const [activities, setActivities] = useState(new Map());
    const pendingUpdates = React.useRef(new Map());
    const updateTimerRef = React.useRef(null);
    useEffect(() => {
        // Batch updates to prevent render thrashing
        const flushUpdates = () => {
            if (pendingUpdates.current.size > 0) {
                setActivities(new Map(pendingUpdates.current));
            }
            updateTimerRef.current = null;
        };
        const scheduleUpdate = () => {
            if (!updateTimerRef.current) {
                updateTimerRef.current = setTimeout(flushUpdates, 100); // Batch updates every 100ms
            }
        };
        // Subscribe to status updates
        const unsubscribeStatus = onAgentStatus((event) => {
            const activity = pendingUpdates.current.get(event.agentId) || {
                agentId: event.agentId,
                agentType: event.agentType,
                status: event,
                taskCount: 0,
            };
            activity.status = event;
            pendingUpdates.current.set(event.agentId, activity);
            scheduleUpdate();
        });
        // Subscribe to task updates
        const unsubscribeTask = onAgentTask((event) => {
            const activity = pendingUpdates.current.get(event.agentId);
            if (activity) {
                activity.lastTask = event;
                if (event.type === "completed" || event.type === "failed") {
                    activity.taskCount++;
                }
                pendingUpdates.current.set(event.agentId, activity);
                scheduleUpdate();
            }
        });
        return () => {
            unsubscribeStatus();
            unsubscribeTask();
            if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current);
            }
        };
    }, []);
    const activeAgents = Array.from(activities.values()).filter((a) => a.status.phase !== "idle");
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "cyan", paddingX: 1, width: 40, children: [_jsx(Text, { bold: true, color: "cyan", children: "Agent Activity" }), activeAgents.length === 0 ? (_jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "No active agents" }) })) : (_jsx(Box, { flexDirection: "column", marginTop: 1, children: activeAgents.map((activity) => (_jsx(AgentActivityItem, { activity: activity }, activity.agentId))) })), activities.size > 0 && (_jsx(Box, { marginTop: 1, borderTop: true, borderColor: "gray", children: _jsxs(Text, { dimColor: true, children: [activities.size, " agent", activities.size !== 1 ? "s" : "", " registered"] }) }))] }));
}
function AgentActivityItem({ activity }) {
    const getStatusColor = (phase) => {
        switch (phase) {
            case "thinking":
                return "yellow";
            case "running_tools":
                return "cyan";
            case "completed":
                return "green";
            case "error":
                return "red";
            default:
                return "gray";
        }
    };
    const getAgentIcon = (type) => {
        switch (type) {
            case "filesystem":
                return "📁";
            case "testing":
                return "🧪";
            case "build":
                return "⚙️";
            case "analysis":
                return "🔍";
            case "orchestrator":
                return "🎯";
            default:
                return "🤖";
        }
    };
    const getPhaseSymbol = (phase) => {
        switch (phase) {
            case "thinking":
                return "💭";
            case "running_tools":
                return "⚡";
            case "completed":
                return "✅";
            case "error":
                return "❌";
            case "waiting_approval":
                return "⏸️";
            default:
                return "•";
        }
    };
    const statusColor = getStatusColor(activity.status.phase);
    const agentIcon = getAgentIcon(activity.agentType);
    const phaseSymbol = getPhaseSymbol(activity.status.phase);
    return (_jsxs(Box, { flexDirection: "column", marginY: 0, children: [_jsx(Box, { children: _jsxs(Text, { children: [agentIcon, " ", _jsx(Text, { bold: true, children: activity.agentType })] }) }), _jsx(Box, { marginLeft: 2, children: _jsxs(Text, { color: statusColor, children: [phaseSymbol, " ", activity.status.message] }) }), activity.taskCount > 0 && (_jsx(Box, { marginLeft: 2, children: _jsxs(Text, { dimColor: true, children: [activity.taskCount, " task", activity.taskCount !== 1 ? "s" : "", " completed"] }) }))] }));
}
