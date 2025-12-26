/**
 * PyrightClient - LSP client for Python using Pyright
 *
 * Pyright is a fast, feature-complete Python type checker and language server.
 * It uses standard LSP protocol.
 */

import { BaseLSPClient } from "../BaseLSPClient.js";
import type { LSPLanguage } from "../types.js";

export class PyrightClient extends BaseLSPClient {
  language: LSPLanguage = "python";

  constructor(workspaceRoot: string) {
    super(workspaceRoot, "python");
  }

  /**
   * Get the command to start pyright-langserver
   */
  protected getStartCommand(): string[] {
    return ["npx", "pyright-langserver", "--stdio"];
  }

  /**
   * Get initialization options for Pyright
   */
  protected getInitializationOptions(): unknown {
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
  protected getLanguageId(filePath: string): string {
    return "python";
  }
}
