import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from "ink";
export function SlashCommandHelp({ commands, filter }) {
    // Filter commands based on input
    const filteredCommands = filter
        ? commands.filter((cmd) => {
            const searchTerm = filter.toLowerCase().replace("/", "");
            return (cmd.name.toLowerCase().includes(searchTerm) ||
                cmd.aliases.some((alias) => alias.toLowerCase().includes(searchTerm)) ||
                cmd.description.toLowerCase().includes(searchTerm));
        })
        : commands;
    // Group by category
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
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "cyan", paddingX: 1, paddingY: 0, marginBottom: 1, children: [_jsxs(Text, { bold: true, color: "cyan", children: ["Available Commands ", filter && `(filtered: "${filter}")`] }), !hasCommands && (_jsx(Text, { color: "yellow", children: "No commands match your search" })), Object.entries(categories).map(([category, cmds]) => {
                if (cmds.length === 0)
                    return null;
                return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsxs(Text, { bold: true, color: "magenta", children: [category.toUpperCase(), ":"] }), cmds.map((cmd) => {
                            const aliases = cmd.aliases.length > 0
                                ? ` (${cmd.aliases.map((a) => "/" + a).join(", ")})`
                                : "";
                            const params = cmd.parameterized ? " <arg>" : "";
                            return (_jsxs(Box, { marginLeft: 2, children: [_jsxs(Text, { color: "green", children: ["/", cmd.name, params] }), _jsx(Text, { color: "gray", children: aliases }), _jsx(Text, { children: " - " }), _jsx(Text, { children: cmd.description })] }, cmd.name));
                        })] }, category));
            }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "Type a command name or press Ctrl+C to cancel" }) })] }));
}
