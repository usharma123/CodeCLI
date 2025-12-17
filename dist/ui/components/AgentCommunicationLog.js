import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { onAgentCommunication, getAgentEvents, } from "../../core/agent-events.js";
/**
 * AgentCommunicationLog - Shows inter-agent communication
 * Displays delegation requests and results between agents
 * Useful for debugging and understanding agent workflows
 */
export function AgentCommunicationLog() {
    const [communications, setCommunications] = useState([]);
    const [maxEntries] = useState(10); // Show last 10 communications
    useEffect(() => {
        // Load initial history
        const agentEvents = getAgentEvents();
        const history = agentEvents.getCommunicationHistory(maxEntries);
        setCommunications(history);
        // Subscribe to new communications
        const unsubscribe = onAgentCommunication((event) => {
            setCommunications((prev) => {
                const next = [...prev, event];
                if (next.length > maxEntries) {
                    return next.slice(-maxEntries); // Keep last N
                }
                return next;
            });
        });
        return unsubscribe;
    }, [maxEntries]);
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "blue", paddingX: 1, width: 50, children: [_jsx(Text, { bold: true, color: "blue", children: "Agent Communication Log" }), communications.length === 0 ? (_jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "No inter-agent communications yet" }) })) : (_jsx(Box, { flexDirection: "column", marginTop: 1, children: communications.map((comm, idx) => (_jsx(CommunicationItem, { communication: comm }, idx))) })), _jsx(Box, { marginTop: 1, borderTop: true, borderColor: "gray", children: _jsxs(Text, { dimColor: true, children: ["Showing last ", Math.min(communications.length, maxEntries), " messages"] }) })] }));
}
function CommunicationItem({ communication }) {
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
    const getTypeColor = (type) => {
        switch (type) {
            case "delegation":
                return "cyan";
            case "result":
                return "green";
            case "coordination":
                return "yellow";
            default:
                return "cyan";
        }
    };
    const getTypeSymbol = (type) => {
        switch (type) {
            case "delegation":
                return "→";
            case "result":
                return "←";
            case "coordination":
                return "↔";
            default:
                return "•";
        }
    };
    const time = new Date(communication.timestamp).toLocaleTimeString();
    const typeColor = getTypeColor(communication.type);
    const typeSymbol = getTypeSymbol(communication.type);
    return (_jsxs(Box, { flexDirection: "column", marginY: 0, children: [_jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: time }), _jsx(Text, { children: " " }), _jsxs(Text, { children: [getAgentIcon(communication.fromAgentType), " ", communication.fromAgentType] }), _jsx(Text, { children: " " }), _jsx(Text, { color: typeColor, children: typeSymbol }), _jsx(Text, { children: " " }), _jsxs(Text, { children: [getAgentIcon(communication.toAgentType), " ", communication.toAgentType] })] }), _jsx(Box, { marginLeft: 2, children: _jsxs(Text, { dimColor: true, children: [communication.message.substring(0, 40), "..."] }) })] }));
}
