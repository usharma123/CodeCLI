import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Box, Text } from "ink";
import { icons } from "../theme.js";
// Category labels (no emojis)
const categoryLabels = {
    testing: "test",
    analysis: "analyze",
    files: "files",
    session: "session",
    custom: "custom",
};
// Category colors (subtle)
const categoryColors = {
    testing: "green",
    analysis: "cyan",
    files: "yellow",
    session: "blue",
    custom: "gray",
};
export function SlashCommandHelp({ commands, filter }) {
    const filteredCommands = filter
        ? commands.filter((cmd) => {
            const searchTerm = filter.toLowerCase().replace("/", "");
            return (cmd.name.toLowerCase().includes(searchTerm) ||
                cmd.aliases.some((alias) => alias.toLowerCase().includes(searchTerm)) ||
                cmd.description.toLowerCase().includes(searchTerm));
        })
        : commands;
    const categories = {
        testing: [],
        analysis: [],
        files: [],
        session: [],
        custom: [],
    };
    const seen = new Set();
    for (const cmd of filteredCommands) {
        if (!seen.has(cmd.name)) {
            seen.add(cmd.name);
            categories[cmd.category].push(cmd);
        }
    }
    const hasCommands = filteredCommands.length > 0;
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "gray", paddingX: 1, marginBottom: 1, children: [_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { bold: true, color: "white", children: "commands" }), filter && (_jsxs(Text, { dimColor: true, children: [" ", icons.arrow, " ", filter] })), _jsx(Box, { flexGrow: 1 }), _jsxs(Text, { dimColor: true, children: ["tab complete ", icons.bullet, " enter run"] })] }), !hasCommands && (_jsx(Text, { dimColor: true, children: "no matches" })), Object.entries(categories).map(([category, cmds]) => {
                if (cmds.length === 0)
                    return null;
                const catLabel = categoryLabels[category] || category;
                const catColor = categoryColors[category] || "gray";
                return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Box, { children: _jsxs(Text, { color: catColor, dimColor: true, children: ["[", catLabel, "]"] }) }), cmds.map((cmd) => (_jsx(CommandItem, { command: cmd, filter: filter, categoryColor: catColor }, cmd.name)))] }, category));
            }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "esc cancel" }) })] }));
}
function CommandItem({ command, filter, categoryColor }) {
    const aliases = command.aliases.length > 0
        ? ` (${command.aliases.map((a) => "/" + a).join(", ")})`
        : "";
    const params = command.parameterized ? " <arg>" : "";
    const searchTerm = filter?.toLowerCase().replace("/", "") || "";
    const nameMatches = searchTerm.length > 0 && command.name.toLowerCase().includes(searchTerm);
    return (_jsxs(Box, { marginLeft: 2, children: [_jsxs(Box, { minWidth: 18, children: [_jsxs(Text, { color: nameMatches ? "white" : categoryColor, children: ["/", command.name] }), _jsx(Text, { dimColor: true, children: params }), _jsx(Text, { dimColor: true, children: aliases })] }), _jsxs(Text, { dimColor: true, children: [" ", icons.dash, " "] }), _jsx(Text, { dimColor: true, wrap: "truncate", children: command.description })] }));
}
export function CompactCommandList({ commands, maxShow = 5 }) {
    const displayCommands = commands.slice(0, maxShow);
    const remaining = commands.length - maxShow;
    return (_jsxs(Box, { children: [displayCommands.map((cmd, i) => (_jsxs(React.Fragment, { children: [_jsxs(Text, { dimColor: true, children: ["/", cmd.name] }), i < displayCommands.length - 1 && _jsxs(Text, { dimColor: true, children: [" ", icons.bullet, " "] })] }, cmd.name))), remaining > 0 && (_jsxs(Text, { dimColor: true, children: [" +", remaining] }))] }));
}
