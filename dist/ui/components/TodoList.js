import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
export function TodoList({ todos }) {
    if (todos.length === 0)
        return null;
    return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, paddingLeft: 1, children: [_jsx(Text, { bold: true, color: "cyan", children: "Task Progress:" }), todos.map((todo, i) => {
                const icon = todo.status === "completed"
                    ? "✓"
                    : todo.status === "in_progress"
                        ? "→"
                        : "○";
                const color = todo.status === "completed"
                    ? "green"
                    : todo.status === "in_progress"
                        ? "yellow"
                        : "gray";
                return (_jsxs(Box, { children: [_jsxs(Text, { color: color, children: [icon, " "] }), _jsx(Text, { dimColor: todo.status === "completed", children: todo.content })] }, i));
            })] }));
}
