/**
 * PyrightClient - LSP client for Python using Pyright
 *
 * Pyright is a fast, feature-complete Python type checker and language server.
 * It uses standard LSP protocol.
 */
import { BaseLSPClient } from "../BaseLSPClient.js";
export class PyrightClient extends BaseLSPClient {
    language = "python";
    constructor(workspaceRoot) {
        super(workspaceRoot, "python");
    }
    /**
     * Get the command to start pyright-langserver
     */
    getStartCommand() {
        return ["npx", "pyright-langserver", "--stdio"];
    }
    /**
     * Get initialization options for Pyright
     */
    getInitializationOptions() {
        return {
            // Pyright-specific settings
            python: {
                analysis: {
                    autoSearchPaths: true,
                    useLibraryCodeForTypes: true,
                    diagnosticMode: "openFilesOnly",
                    typeCheckingMode: "basic",
                },
            },
        };
    }
    /**
     * Override to get language ID for Python files
     */
    getLanguageId(filePath) {
        return "python";
    }
}
