/**
 * PyrightInstaller - Auto-install Pyright language server for Python
 *
 * Uses npm to install Pyright globally if not present
 */
import { execSync } from "child_process";
import { withRetry, RetryConfigs, isTransientError } from "../utils/retry.js";
export class PyrightInstaller {
    language = "python";
    /**
     * Check if Pyright is installed
     */
    async isInstalled() {
        try {
            // Try to find pyright-langserver via npx
            execSync("npx --no-install pyright-langserver --version", {
                stdio: "pipe",
                timeout: 10000,
            });
            return true;
        }
        catch {
            // Try to find pyright directly
            try {
                execSync("which pyright-langserver || npx -y pyright --version", {
                    stdio: "pipe",
                    timeout: 10000,
                });
                return true;
            }
            catch {
                return false;
            }
        }
    }
    /**
     * Install Pyright globally with retry support
     */
    async install() {
        console.log("Installing Pyright language server...");
        await withRetry(async () => {
            try {
                execSync("npm install -g pyright", {
                    stdio: "inherit",
                    timeout: 120000,
                });
            }
            catch (error) {
                throw new Error(`Failed to install Pyright: ${error instanceof Error ? error.message : String(error)}`);
            }
        }, {
            ...RetryConfigs.installation,
            isRetryable: isTransientError,
        });
        console.log("Pyright language server installed successfully.");
    }
    /**
     * Get the command to start pyright-langserver
     */
    async getServerCommand() {
        // Use npx to run pyright-langserver in LSP mode
        return ["npx", "pyright-langserver", "--stdio"];
    }
}
