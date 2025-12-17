import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from "ink";
/**
 * DiagramDisplay - Ink component for displaying ASCII diagrams
 *
 * Renders ASCII art diagrams with optional title and border styling.
 * Handles both successful renders and fallback error states.
 */
export const DiagramDisplay = ({ ascii, title, bordered = true, borderColor = "cyan", success = true, error, }) => {
    // If there's an error, show warning styling
    if (error || !success) {
        return (_jsxs(Box, { flexDirection: "column", marginY: 1, children: [error && (_jsx(Box, { marginBottom: 1, children: _jsxs(Text, { color: "yellow", children: ["\u26A0\uFE0F  ", error] }) })), ascii && (_jsxs(Box, { flexDirection: "column", borderStyle: bordered ? "single" : undefined, borderColor: "gray", paddingX: 1, children: [title && (_jsx(Text, { bold: true, color: "gray", children: title })), _jsx(Text, { color: "gray", children: ascii })] }))] }));
    }
    // Success state - show diagram with nice styling
    if (bordered) {
        return (_jsx(Box, { flexDirection: "column", marginY: 1, children: _jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: borderColor, paddingX: 1, paddingY: 0, children: [title && (_jsx(Box, { marginBottom: 1, children: _jsxs(Text, { bold: true, color: borderColor, children: ["\uD83D\uDCCA ", title] }) })), _jsx(Text, { children: ascii })] }) }));
    }
    // No border - simple display
    return (_jsxs(Box, { flexDirection: "column", marginY: 1, children: [title && (_jsx(Box, { marginBottom: 1, children: _jsxs(Text, { bold: true, color: borderColor, children: ["\uD83D\uDCCA ", title] }) })), _jsx(Text, { children: ascii })] }));
};
/**
 * MermaidCodeBlock - Display raw Mermaid code as a code block
 *
 * Used as a fallback when ASCII rendering is not available
 */
export const MermaidCodeBlock = ({ code, title, }) => {
    return (_jsxs(Box, { flexDirection: "column", marginY: 1, children: [title && (_jsx(Box, { marginBottom: 1, children: _jsx(Text, { bold: true, color: "gray", children: title }) })), _jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "gray", paddingX: 1, children: [_jsx(Text, { color: "gray", dimColor: true, children: "```mermaid" }), _jsx(Text, { children: code }), _jsx(Text, { color: "gray", dimColor: true, children: "```" })] })] }));
};
export default DiagramDisplay;
