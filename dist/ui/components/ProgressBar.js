import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Box, Text } from "ink";
import { useAnimatedProgress } from "../hooks/useAnimation.js";
import { icons } from "../theme.js";
const sizeWidths = {
    compact: 20,
    standard: 30,
    large: 50,
};
const fillChars = {
    full: "█",
    empty: "░",
    partial: ["▏", "▎", "▍", "▌", "▋", "▊", "▉"],
};
export function ProgressBar({ progress, width, color = "cyan", size = "standard", showPercentage = true, showLabel = false, label, animated = true, }) {
    const barWidth = width || sizeWidths[size];
    const animatedProgress = animated ? useAnimatedProgress(progress) : progress;
    // Clamp progress
    const clampedProgress = Math.max(0, Math.min(100, animatedProgress));
    // Calculate filled width
    const filledWidth = (clampedProgress / 100) * barWidth;
    const fullBlocks = Math.floor(filledWidth);
    const partialIndex = Math.floor((filledWidth - fullBlocks) * 7);
    // Build the bar
    const filled = fillChars.full.repeat(fullBlocks);
    const partial = partialIndex > 0 ? fillChars.partial[partialIndex - 1] : "";
    const empty = fillChars.empty.repeat(Math.max(0, barWidth - fullBlocks - (partial ? 1 : 0)));
    return (_jsxs(Box, { children: [showLabel && label && (_jsx(Box, { marginRight: 1, children: _jsx(Text, { dimColor: true, children: label }) })), _jsxs(Text, { color: color, children: [filled, partial] }), _jsx(Text, { dimColor: true, children: empty }), showPercentage && (_jsxs(Text, { dimColor: true, children: [" ", Math.round(clampedProgress), "%"] }))] }));
}
export function IndeterminateProgress({ width = 30, color = "cyan", label, }) {
    const [offset, setOffset] = React.useState(0);
    React.useEffect(() => {
        const interval = setInterval(() => {
            setOffset((o) => (o + 1) % width);
        }, 100);
        return () => clearInterval(interval);
    }, [width]);
    // Create a moving highlight pattern
    const pattern = Array(width)
        .fill(null)
        .map((_, i) => {
        const distance = Math.abs(i - offset);
        if (distance < 3) {
            return fillChars.full;
        }
        return fillChars.empty;
    })
        .join("");
    return (_jsxs(Box, { children: [label && (_jsx(Box, { marginRight: 1, children: _jsx(Text, { dimColor: true, children: label }) })), _jsx(Text, { color: color, children: pattern })] }));
}
export function StagedProgress({ stages, color = "cyan" }) {
    const completedCount = stages.filter((s) => s.status === "completed").length;
    const progress = (completedCount / stages.length) * 100;
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(ProgressBar, { progress: progress, color: color, showPercentage: false }), _jsx(Box, { marginTop: 1, children: stages.map((stage, i) => {
                    const icon = stage.status === "completed"
                        ? icons.success
                        : stage.status === "current"
                            ? icons.inProgress
                            : icons.pending;
                    const textColor = stage.status === "completed"
                        ? "green"
                        : stage.status === "current"
                            ? color
                            : "gray";
                    return (_jsxs(Box, { marginRight: 2, children: [_jsxs(Text, { color: textColor, children: [icon, " "] }), _jsx(Text, { color: textColor, dimColor: stage.status === "pending", children: stage.label })] }, i));
                }) })] }));
}
export function CompactProgress({ progress, color = "cyan" }) {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    return (_jsxs(Box, { children: [_jsx(Text, { color: color, children: icons.inProgress }), _jsx(Text, { children: " " }), _jsxs(Text, { color: color, bold: true, children: [Math.round(clampedProgress), "%"] })] }));
}
