/**
 * TypeScriptInstaller - Auto-install TypeScript language server
 *
 * Uses npm to install TypeScript globally if not present
 */
import { execSync } from "child_process";
import { withRetry, RetryConfigs, isTransientError } from "../utils/retry.js";
export class TypeScriptInstaller {
    language = "typescript";
    /**
     * Check if TypeScript is installed
     */
    async isInstalled() {
        try {
            // Try to find tsserver via npx
            execSync("npx --no-install tsserver --version", {
                stdio: "pipe",
                timeout: 10000,
            });
            return true;
        }
        catch {
            // Try to find typescript directly
            try {
                execSync("which tsserver || npx -y typescript --version", {
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
     * Install TypeScript globally with retry support
     */
    async install() {
        console.log("Installing TypeScript language server...");
        await withRetry(async () => {
            try {
                execSync("npm install -g typescript", {
                    stdio: "inherit",
                    timeout: 120000,
                });
            }
            catch (error) {
                throw new Error(`Failed to install TypeScript: ${error instanceof Error ? error.message : String(error)}`);
            }
        }, {
            ...RetryConfigs.installation,
            isRetryable: isTransientError,
        });
        console.log("TypeScript language server installed successfully.");
    }
    /**
     * Get the command to start tsserver
     */
    async getServerCommand() {
        // Use npx to run tsserver - it will find local or global installation
        return ["npx", "tsserver"];
    }
}
