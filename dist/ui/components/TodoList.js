import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { icons } from "../theme.js";
import { useSpinnerFrames } from "../hooks/useAnimation.js";
import { ProgressBar } from "./ProgressBar.js";
export function TodoList({ todos, showProgress = true, compact = false }) {
    if (todos.length === 0)
        return null;
    const completedCount = todos.filter((t) => t.status === "completed").length;
    const totalCount = todos.length;
    const progress = (completedCount / totalCount) * 100;
    const allCompleted = completedCount === totalCount;
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: allCompleted ? "green" : "gray", paddingX: 1, marginBottom: 1, children: [_jsxs(Box, { marginBottom: compact ? 0 : 1, children: [_jsx(Text, { color: allCompleted ? "green" : "white", children: "tasks" }), _jsxs(Text, { dimColor: true, children: [" ", completedCount, "/", totalCount] }), allCompleted && (_jsxs(Text, { color: "green", children: [" ", icons.success] }))] }), showProgress && !compact && (_jsx(Box, { marginBottom: 1, children: _jsx(ProgressBar, { progress: progress, color: allCompleted ? "green" : "cyan", size: "compact", showPercentage: false }) })), todos.map((todo, i) => (_jsx(TodoItemRow, { todo: todo }, i)))] }));
}
function TodoItemRow({ todo }) {
    const spinnerFrame = useSpinnerFrames(icons.spinnerDots, 80);
    let icon;
    let color;
    switch (todo.status) {
        case "completed":
            icon = icons.success;
            color = "green";
            break;
        case "in_progress":
            icon = spinnerFrame;
            color = "yellow";
            break;
        default:
            icon = icons.pending;
            color = "gray";
    }
    const displayText = todo.status === "in_progress" && todo.activeForm
        ? todo.activeForm
        : todo.content;
    return (_jsxs(Box, { flexDirection: "row", children: [_jsxs(Text, { color: color, children: [icon, " "] }), _jsx(Box, { flexGrow: 1, flexShrink: 1, children: _jsx(Text, { color: color, dimColor: todo.status === "pending", strikethrough: todo.status === "completed", wrap: "wrap", children: displayText }) })] }));
}
// Compact count display
export function TodoCount({ todos }) {
    if (todos.length === 0)
        return null;
    const completedCount = todos.filter((t) => t.status === "completed").length;
    const inProgressCount = todos.filter((t) => t.status === "in_progress").length;
    const totalCount = todos.length;
    return (_jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "tasks: " }), inProgressCount > 0 && (_jsxs(Text, { color: "yellow", children: [inProgressCount, " active"] })), inProgressCount > 0 && completedCount > 0 && _jsxs(Text, { dimColor: true, children: [" ", icons.pipe, " "] }), completedCount > 0 && (_jsxs(Text, { color: "green", children: [completedCount, "/", totalCount] }))] }));
}
