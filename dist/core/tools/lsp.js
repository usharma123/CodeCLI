/**
 * LSP Tools - Tools for interacting with language servers
 *
 * Provides get_diagnostics and lsp_status tools for the AI agent
 */
import { getLSPClientManager } from "../lsp/LSPClientManager.js";
const getDiagnosticsDefinition = {
    name: "get_diagnostics",
    description: "Get code diagnostics (errors, warnings) from language servers. " +
        "Use this after editing files to check for syntax errors, type errors, and other issues. " +
        "Returns formatted list of problems found in the code.",
    parameters: {
        type: "object",
        properties: {
            file: {
                type: "string",
                description: "Specific file path to get diagnostics for. " +
                    "If omitted, returns diagnostics for all files.",
            },
            severity_filter: {
                type: "array",
                items: {
                    type: "string",
                    enum: ["error", "warning", "information", "hint"],
                },
                description: "Filter diagnostics by severity. " +
                    "Default: all severities. Example: ['error', 'warning']",
            },
            limit: {
                type: "number",
                description: "Maximum number of diagnostics to return. Default: 50.",
            },
        },
        additionalProperties: false,
    },
    function: async (input) => {
        const lspManager = getLSPClientManager();
        if (!lspManager) {
            return "LSP not initialized. Language server support is disabled or not started yet.";
        }
        const diagnosticsManager = lspManager.getDiagnosticsManager();
        return diagnosticsManager.formatForAgent({
            fileFilter: input.file,
            severityFilter: input.severity_filter,
            limit: input.limit || 50,
        });
    },
};
const lspStatusDefinition = {
    name: "lsp_status",
    description: "Check the status of language server processes. " +
        "Shows which language servers are running, stopped, or errored.",
    parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
    },
    function: async (_input) => {
        const lspManager = getLSPClientManager();
        if (!lspManager) {
            return "LSP not initialized. Set ENABLE_LSP=true to enable language server support.";
        }
        const diagnosticsManager = lspManager.getDiagnosticsManager();
        return diagnosticsManager.formatServerStatuses();
    },
};
export const lspTools = [
    getDiagnosticsDefinition,
    lspStatusDefinition,
];
