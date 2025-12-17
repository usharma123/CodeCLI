import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { onAgentMetrics, onAgentTask, } from "../../core/agent-events.js";
import { getAgentManager } from "../../core/agent-manager.js";
/**
 * AgentMetricsPanel - Performance metrics dashboard
 * Shows real-time statistics for each agent
 * Toggle with Ctrl+M
 */
export function AgentMetricsPanel() {
    const [metrics, setMetrics] = useState(new Map());
    const [managerStats, setManagerStats] = useState({
        registeredAgents: 0,
        activeDelegations: 0,
    });
    useEffect(() => {
        // Subscribe to metrics updates
        const unsubscribeMetrics = onAgentMetrics((event) => {
            setMetrics((prev) => {
                const next = new Map(prev);
                const metric = {
                    agentId: event.agentId,
                    agentType: event.agentType,
                    ...event.metrics,
                    lastUpdated: event.timestamp,
                };
                next.set(event.agentId, metric);
                return next;
            });
        });
        // Subscribe to task events to update metrics in real-time
        const unsubscribeTask = onAgentTask((event) => {
            setMetrics((prev) => {
                const next = new Map(prev);
                const existing = next.get(event.agentId);
                const metric = existing || {
                    agentId: event.agentId,
                    agentType: event.agentType,
                    totalTasks: 0,
                    successfulTasks: 0,
                    failedTasks: 0,
                    averageDuration: 0,
                    totalDuration: 0,
                    totalToolCalls: 0,
                    totalTokensUsed: 0,
                    lastUpdated: Date.now(),
                };
                if (event.type === "completed") {
                    metric.totalTasks++;
                    if (event.result?.status === "success") {
                        metric.successfulTasks++;
                    }
                    else if (event.result?.status === "error") {
                        metric.failedTasks++;
                    }
                    if (event.metrics?.duration) {
                        metric.totalDuration += event.metrics.duration;
                        metric.averageDuration = metric.totalDuration / metric.totalTasks;
                    }
                    if (event.metrics?.toolCallCount) {
                        metric.totalToolCalls += event.metrics.toolCallCount;
                    }
                    if (event.metrics?.tokensUsed) {
                        metric.totalTokensUsed += event.metrics.tokensUsed;
                    }
                    metric.lastUpdated = Date.now();
                }
                next.set(event.agentId, metric);
                return next;
            });
        });
        // Update manager stats periodically
        const interval = setInterval(() => {
            try {
                const agentManager = getAgentManager();
                const stats = agentManager.getStats();
                setManagerStats(stats);
            }
            catch (err) {
                // Ignore errors
            }
        }, 1000);
        return () => {
            unsubscribeMetrics();
            unsubscribeTask();
            clearInterval(interval);
        };
    }, []);
    const agentMetrics = Array.from(metrics.values());
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "magenta", paddingX: 1, width: 40, children: [_jsx(Text, { bold: true, color: "magenta", children: "Agent Metrics" }), _jsx(Box, { marginTop: 1, borderBottom: true, borderColor: "gray", children: _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { dimColor: true, children: "System Status:" }), _jsxs(Text, { children: ["Agents: ", _jsx(Text, { color: "cyan", children: managerStats.registeredAgents })] }), _jsxs(Text, { children: ["Active: ", _jsx(Text, { color: "yellow", children: managerStats.activeDelegations })] })] }) }), agentMetrics.length === 0 ? (_jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "No agent metrics yet" }) })) : (_jsx(Box, { flexDirection: "column", marginTop: 1, children: agentMetrics.map((metric) => (_jsx(AgentMetricItem, { metric: metric }, metric.agentId))) })), agentMetrics.length > 0 && (_jsx(Box, { marginTop: 1, borderTop: true, borderColor: "gray", children: _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { dimColor: true, children: "Total:" }), _jsxs(Text, { children: ["Tasks:", " ", _jsx(Text, { color: "green", children: agentMetrics.reduce((sum, m) => sum + m.totalTasks, 0) })] }), _jsxs(Text, { children: ["Success:", " ", _jsx(Text, { color: "green", children: agentMetrics.reduce((sum, m) => sum + m.successfulTasks, 0) })] }), _jsxs(Text, { children: ["Failed:", " ", _jsx(Text, { color: "red", children: agentMetrics.reduce((sum, m) => sum + m.failedTasks, 0) })] })] }) }))] }));
}
function AgentMetricItem({ metric }) {
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
            default:
                return "🤖";
        }
    };
    const successRate = metric.totalTasks > 0
        ? ((metric.successfulTasks / metric.totalTasks) * 100).toFixed(0)
        : "0";
    const avgDurationMs = metric.averageDuration.toFixed(0);
    return (_jsxs(Box, { flexDirection: "column", marginY: 0, children: [_jsx(Box, { children: _jsxs(Text, { children: [getAgentIcon(metric.agentType), " ", _jsx(Text, { bold: true, children: metric.agentType })] }) }), _jsxs(Box, { marginLeft: 2, flexDirection: "column", children: [_jsxs(Text, { dimColor: true, children: ["Tasks: ", metric.totalTasks, " (", successRate, "% success)"] }), _jsxs(Text, { dimColor: true, children: ["Avg time: ", avgDurationMs, "ms"] }), metric.totalToolCalls > 0 && (_jsxs(Text, { dimColor: true, children: ["Tool calls: ", metric.totalToolCalls] }))] })] }));
}
