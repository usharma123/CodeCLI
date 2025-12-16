import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { onToolOutput, getOutputById } from "../../core/output.js";
export function ToolOutputDisplay({ expandedOutputId }) {
    const [outputs, setOutputs] = useState([]);
    // Subscribe to tool output events
    useEffect(() => {
        const unsubscribe = onToolOutput((output) => {
            setOutputs((prev) => {
                const newOutputs = [...prev, output];
                // Keep only last 10 outputs
                if (newOutputs.length > 10) {
                    return newOutputs.slice(-10);
                }
                return newOutputs;
            });
        });
        return unsubscribe;
    }, []);
    // If no output is expanded, don't render anything
    if (!expandedOutputId) {
        return null;
    }
    // Find the output to display
    const output = getOutputById(expandedOutputId);
    if (!output) {
        return null;
    }
    // Format timestamp
    const date = new Date(output.timestamp);
    const timeStr = date.toLocaleTimeString();
    // Format args for display
    const argsStr = JSON.stringify(output.args, null, 2);
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "yellow", paddingX: 1, marginBottom: 1, children: [_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, color: "yellow", children: "Expanded Output" }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Tool: " }), _jsx(Text, { color: "cyan", children: output.toolName }), _jsxs(Text, { dimColor: true, children: [" \u2502 Time: ", timeStr] })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "Arguments:" }) }), _jsx(Text, { dimColor: true, children: argsStr })] }), _jsx(Box, { flexDirection: "column", borderStyle: "single", borderColor: "gray", paddingX: 1, children: _jsx(Text, { wrap: "wrap", children: output.result }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, italic: true, children: "Press Ctrl+O to collapse" }) })] }));
}
