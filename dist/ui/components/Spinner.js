import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { useSpinnerFrames, useElapsedTime } from "../hooks/useAnimation.js";
import { icons } from "../theme.js";
const spinnerFrames = {
    dots: icons.spinnerDots,
    line: icons.spinnerLine,
    pulse: icons.spinnerPulse,
};
const spinnerSpeeds = {
    dots: 80,
    line: 100,
    pulse: 200,
};
export function Spinner({ label = "processing...", style = "dots", color = "cyan", showElapsed = true, startTime, }) {
    const frames = spinnerFrames[style];
    const speed = spinnerSpeeds[style];
    const frame = useSpinnerFrames(frames, speed);
    const elapsed = useElapsedTime(showElapsed ? (startTime || Date.now()) : null);
    return (_jsxs(Box, { children: [_jsxs(Text, { color: color, children: [frame, " "] }), _jsx(Text, { children: label }), showElapsed && elapsed && _jsxs(Text, { dimColor: true, children: [" ", elapsed] })] }));
}
export function StatusSpinner({ label = "processing...", style = "dots", color = "cyan", showElapsed = true, startTime, status = "loading", successMessage = "done", errorMessage = "failed", }) {
    const frames = spinnerFrames[style];
    const speed = spinnerSpeeds[style];
    const frame = useSpinnerFrames(frames, speed);
    const elapsed = useElapsedTime(status === "loading" ? (startTime || Date.now()) : null);
    if (status === "success") {
        return (_jsxs(Box, { children: [_jsxs(Text, { color: "green", children: [icons.success, " "] }), _jsx(Text, { color: "green", children: successMessage })] }));
    }
    if (status === "error") {
        return (_jsxs(Box, { children: [_jsxs(Text, { color: "red", children: [icons.error, " "] }), _jsx(Text, { color: "red", children: errorMessage })] }));
    }
    return (_jsxs(Box, { children: [_jsxs(Text, { color: color, children: [frame, " "] }), _jsx(Text, { children: label }), showElapsed && elapsed && _jsxs(Text, { dimColor: true, children: [" ", elapsed] })] }));
}
// Inline spinner
export function InlineSpinner({ color = "cyan" }) {
    const frame = useSpinnerFrames(icons.spinnerDots, 80);
    return _jsx(Text, { color: color, children: frame });
}
export function MultiStageSpinner({ stages }) {
    const frame = useSpinnerFrames(icons.spinnerDots, 80);
    return (_jsx(Box, { flexDirection: "column", children: stages.map((stage, i) => {
            let icon;
            let color;
            switch (stage.status) {
                case "success":
                    icon = icons.success;
                    color = "green";
                    break;
                case "error":
                    icon = icons.error;
                    color = "red";
                    break;
                case "loading":
                    icon = frame;
                    color = "cyan";
                    break;
                default:
                    icon = icons.pending;
                    color = "gray";
            }
            return (_jsxs(Box, { children: [_jsxs(Text, { color: color, children: [icon, " "] }), _jsx(Text, { color: color, dimColor: stage.status === "pending", children: stage.label })] }, i));
        }) }));
}
