import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { onToolOutput, getOutputById, } from "../../core/output.js";
import { icons, formatRelativeTime } from "../theme.js";
export function ToolOutputDisplay({ expandedOutputId }) {
    const [outputs, setOutputs] = useState([]);
    useEffect(() => {
        const unsubscribe = onToolOutput((output) => {
            setOutputs((prev) => {
                const newOutputs = [...prev, output];
                if (newOutputs.length > 10) {
                    return newOutputs.slice(-10);
                }
                return newOutputs;
            });
        });
        return unsubscribe;
    }, []);
    if (!expandedOutputId) {
        return null;
    }
    const output = getOutputById(expandedOutputId);
    if (!output) {
        return null;
    }
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "blue", paddingX: 1, marginBottom: 1, children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { color: "blue", children: "output" }), _jsx(Box, { flexGrow: 1 }), _jsx(Text, { dimColor: true, children: "^o close" })] }), _jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "tool: " }), _jsx(Text, { color: "cyan", children: output.toolName })] }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "time: " }), _jsx(Text, { children: formatRelativeTime(output.timestamp) })] })] }), _jsx(Box, { flexDirection: "column", marginBottom: 1, children: _jsxs(Text, { dimColor: true, children: ["args: ", JSON.stringify(output.args).substring(0, 60), "..."] }) }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { dimColor: true, children: "result:" }) }), _jsx(OutputContent, { content: output.result })] })] }));
}
function OutputContent({ content }) {
    // Detect content type
    const looksLikeJson = (content.trim().startsWith("{") && content.trim().endsWith("}")) ||
        (content.trim().startsWith("[") && content.trim().endsWith("]"));
    const looksLikeFilePaths = content.includes("/") &&
        content.split("\n").filter(l => l.trim()).every((line) => line.trim().startsWith("/") || line.trim() === "");
    if (looksLikeJson) {
        try {
            const formatted = JSON.stringify(JSON.parse(content), null, 2);
            return (_jsx(Box, { borderStyle: "single", borderColor: "gray", paddingX: 1, children: _jsxs(Text, { color: "yellow", wrap: "wrap", children: [formatted.substring(0, 2000), formatted.length > 2000 && "..."] }) }));
        }
        catch {
            // Not valid JSON
        }
    }
    if (looksLikeFilePaths) {
        const lines = content.split("\n").filter((l) => l.trim());
        return (_jsxs(Box, { flexDirection: "column", paddingX: 1, children: [lines.slice(0, 20).map((line, i) => (_jsxs(Box, { children: [_jsxs(Text, { dimColor: true, children: [icons.bullet, " "] }), _jsx(Text, { children: line.trim() })] }, i))), lines.length > 20 && (_jsxs(Text, { dimColor: true, children: ["+", lines.length - 20, " more"] }))] }));
    }
    // Default: plain text with line numbers
    const lines = content.split("\n");
    const showLineNumbers = lines.length > 5;
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "gray", paddingX: 1, children: [lines.slice(0, 50).map((line, i) => (_jsxs(Box, { children: [showLineNumbers && (_jsx(Box, { minWidth: 4, children: _jsx(Text, { dimColor: true, children: i + 1 }) })), _jsx(Text, { wrap: "wrap", children: line })] }, i))), lines.length > 50 && (_jsxs(Text, { dimColor: true, children: ["+", lines.length - 50, " lines"] }))] }));
}
// Compact preview
export function OutputPreview({ output, maxLength = 80, }) {
    const preview = output.result.length > maxLength
        ? output.result.substring(0, maxLength) + "..."
        : output.result;
    return (_jsxs(Box, { children: [_jsxs(Text, { dimColor: true, children: [output.toolName, ": "] }), _jsx(Text, { dimColor: true, wrap: "truncate", children: preview.replace(/\n/g, " ") })] }));
}
