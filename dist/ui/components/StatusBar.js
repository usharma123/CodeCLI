import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { useSpinnerFrames, useElapsedTime } from "../hooks/useAnimation.js";
import { icons } from "../theme.js";
export function StatusBar({ message, isProcessing = false, startTime, phase, progress, }) {
    const spinnerFrame = useSpinnerFrames(icons.spinnerDots, 80);
    const elapsed = useElapsedTime(isProcessing ? startTime || null : null);
    if (!isProcessing) {
        return null;
    }
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "gray", paddingX: 1, marginBottom: 1, children: [_jsxs(Box, { children: [_jsxs(Text, { color: "cyan", children: [spinnerFrame, " "] }), _jsx(Text, { children: message }), elapsed && _jsxs(Text, { dimColor: true, children: [" ", elapsed] })] }), phase && (_jsx(Box, { children: _jsxs(Text, { dimColor: true, children: ["  ", icons.arrowRight, " ", phase] }) })), progress && progress.total > 0 && (_jsx(Box, { children: _jsxs(Text, { dimColor: true, children: ["  ", "step ", progress.current, "/", progress.total] }) }))] }));
}
export function InlineStatus({ message, isProcessing = false, }) {
    const spinnerFrame = useSpinnerFrames(icons.spinnerDots, 80);
    if (!isProcessing) {
        return null;
    }
    return (_jsxs(Box, { children: [_jsxs(Text, { color: "cyan", children: [spinnerFrame, " "] }), _jsx(Text, { dimColor: true, children: message })] }));
}
export function CompletableStatus({ status, loadingMessage = "processing...", successMessage = "done", errorMessage = "failed", startTime, }) {
    const spinnerFrame = useSpinnerFrames(icons.spinnerDots, 80);
    const elapsed = useElapsedTime(status === "loading" ? startTime || Date.now() : null);
    if (status === "idle") {
        return null;
    }
    if (status === "success") {
        return (_jsxs(Box, { marginBottom: 1, children: [_jsxs(Text, { color: "green", children: [icons.success, " "] }), _jsx(Text, { color: "green", children: successMessage })] }));
    }
    if (status === "error") {
        return (_jsxs(Box, { marginBottom: 1, children: [_jsxs(Text, { color: "red", children: [icons.error, " "] }), _jsx(Text, { color: "red", children: errorMessage })] }));
    }
    return (_jsxs(Box, { marginBottom: 1, children: [_jsxs(Text, { color: "cyan", children: [spinnerFrame, " "] }), _jsx(Text, { children: loadingMessage }), elapsed && _jsxs(Text, { dimColor: true, children: [" ", elapsed] })] }));
}
export function StepStatus({ steps, currentStepMessage }) {
    const spinnerFrame = useSpinnerFrames(icons.spinnerDots, 80);
    const completedCount = steps.filter((s) => s.status === "completed").length;
    const totalCount = steps.length;
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "gray", paddingX: 1, marginBottom: 1, children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { children: "progress" }), _jsxs(Text, { dimColor: true, children: [" ", completedCount, "/", totalCount] })] }), steps.map((step) => {
                let icon;
                let color;
                switch (step.status) {
                    case "completed":
                        icon = icons.success;
                        color = "green";
                        break;
                    case "current":
                        icon = spinnerFrame;
                        color = "cyan";
                        break;
                    case "error":
                        icon = icons.error;
                        color = "red";
                        break;
                    default:
                        icon = icons.pending;
                        color = "gray";
                }
                return (_jsxs(Box, { children: [_jsxs(Text, { color: color, children: [icon, " "] }), _jsx(Text, { color: color, dimColor: step.status === "pending", children: step.label })] }, step.id));
            }), currentStepMessage && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, children: [icons.arrowRight, " ", currentStepMessage] }) }))] }));
}
