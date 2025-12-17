import { spawn } from "child_process";
import { confirmAction } from "../confirm.js";
import { colors } from "../../utils/colors.js";
import { runShellCommand } from "../util-run.js";
import { getAgentInstance } from "./shared.js";
let sessionJavaHome = undefined;
const installJavaWithHomebrew = async () => {
    console.log(`\n${colors.cyan}Installing Java via Homebrew... This may take a minute.${colors.reset}`);
    return new Promise((resolve, reject) => {
        const proc = spawn("bash", ["-c", "brew install openjdk"], {
            stdio: "inherit",
        });
        proc.on("error", (error) => {
            console.log(`${colors.red}Failed to spawn brew process: ${error.message}${colors.reset}`);
            resolve({ success: false });
        });
        proc.on("close", (exitCode) => {
            if (exitCode === 0) {
                // Find the newly installed Java home
                const javaHome = "/opt/homebrew/opt/openjdk";
                console.log(`${colors.green}Java installed at ${javaHome}${colors.reset}`);
                resolve({ success: true, javaHome });
            }
            else {
                console.log(`${colors.red}Java installation failed${colors.reset}`);
                resolve({ success: false });
            }
        });
    });
};
const runCommandDefinition = {
    name: "run_command",
    description: "Execute a shell command with optional working directory and timeout. Provides stdout/stderr and handles timeouts.",
    parameters: {
        type: "object",
        properties: {
            command: {
                type: "string",
                description: "The shell command to run",
            },
            working_dir: {
                type: "string",
                description: "Optional working directory for the command",
            },
            timeout_seconds: {
                type: "number",
                description: "Timeout in seconds (default 60s, max 300s)",
            },
        },
        required: ["command"],
    },
    function: async (input) => {
        if (!input.command) {
            throw new Error("Missing command");
        }
        const agent = getAgentInstance();
        // Validate and set timeout (default 60s, max 300s)
        const timeoutSeconds = Math.min(Math.max(input.timeout_seconds || 60, 1), 300);
        const timeoutMs = timeoutSeconds * 1000;
        const workingDir = input.working_dir || process.cwd();
        console.log(`  ${colors.gray}└ Command: ${colors.white}${input.command}${colors.reset}`);
        if (input.working_dir) {
            console.log(`    ${colors.gray}cwd: ${workingDir}${colors.reset}`);
        }
        const confirmed = await confirmAction("Run command?");
        if (!confirmed) {
            return "Command cancelled by user";
        }
        console.log();
        const commandEnv = { ...process.env };
        if (sessionJavaHome) {
            commandEnv.JAVA_HOME = sessionJavaHome;
            commandEnv.PATH = `${sessionJavaHome}/bin:${process.env.PATH}`;
        }
        const { stdout, stderr, exitCode, timedOut } = await runShellCommand(input.command, workingDir, timeoutMs, commandEnv, agent.streamCommandOutput);
        const combinedOutput = stdout + stderr;
        const javaNotInstalled = combinedOutput.includes("Unable to locate a Java Runtime") ||
            combinedOutput.includes("No Java runtime present");
        if (javaNotInstalled && !sessionJavaHome) {
            const installResult = await installJavaWithHomebrew();
            if (installResult.success && installResult.javaHome) {
                sessionJavaHome = installResult.javaHome;
                const retryConfirmed = await confirmAction("Retry the original command with Java?");
                if (retryConfirmed) {
                    console.log(`\n${colors.cyan}Retrying command with Java...${colors.reset}\n`);
                    const javaEnv = { ...process.env };
                    javaEnv.JAVA_HOME = sessionJavaHome;
                    javaEnv.PATH = `${sessionJavaHome}/bin:${process.env.PATH}`;
                    const retryResult = await runShellCommand(input.command, workingDir, timeoutMs, javaEnv, agent.streamCommandOutput);
                    console.log("\n");
                    if (retryResult.timedOut) {
                        console.log(`  ${colors.gray}└ ${colors.yellow}Timed out after ${timeoutSeconds}s${colors.reset}\n`);
                    }
                    else if (retryResult.exitCode === 0) {
                        console.log(`  ${colors.gray}└ ${colors.green}Exit code ${retryResult.exitCode}${colors.reset}\n`);
                    }
                    else {
                        console.log(`  ${colors.gray}└ ${colors.red}Failed with exit code ${retryResult.exitCode}${colors.reset}\n`);
                    }
                    let result = `Command: ${input.command}\n`;
                    result += `Exit code: ${retryResult.exitCode}\n`;
                    result += `Status: ${retryResult.timedOut ? "TIMEOUT" : retryResult.exitCode === 0 ? "SUCCESS" : "FAILED"}\n`;
                    result += `Note: Java was installed via Homebrew (JAVA_HOME=${sessionJavaHome})\n`;
                    if (retryResult.stdout.trim()) {
                        const maxLength = 8000;
                        const truncatedStdout = retryResult.stdout.length > maxLength
                            ? retryResult.stdout.substring(0, maxLength) + "\n... (output truncated)"
                            : retryResult.stdout;
                        result += `\n--- STDOUT ---\n${truncatedStdout}`;
                    }
                    if (retryResult.stderr.trim()) {
                        const maxLength = 4000;
                        const truncatedStderr = retryResult.stderr.length > maxLength
                            ? retryResult.stderr.substring(0, maxLength) + "\n... (stderr truncated)"
                            : retryResult.stderr;
                        result += `\n--- STDERR ---\n${truncatedStderr}`;
                    }
                    return result;
                }
            }
        }
        const success = exitCode === 0;
        console.log("\n");
        if (timedOut) {
            console.log(`  ${colors.gray}└ ${colors.yellow}Timed out after ${timeoutSeconds}s${colors.reset}\n`);
        }
        else if (success) {
            console.log(`  ${colors.gray}└ ${colors.green}Exit code ${exitCode}${colors.reset}\n`);
        }
        else {
            console.log(`  ${colors.gray}└ ${colors.red}Failed with exit code ${exitCode}${colors.reset}\n`);
        }
        let result = `Command: ${input.command}\n`;
        result += `Exit code: ${exitCode}\n`;
        result += `Status: ${timedOut ? "TIMEOUT" : success ? "SUCCESS" : "FAILED"}\n`;
        if (stdout.trim()) {
            const maxLength = 8000;
            const truncatedStdout = stdout.length > maxLength
                ? stdout.substring(0, maxLength) + "\n... (output truncated)"
                : stdout;
            result += `\n--- STDOUT ---\n${truncatedStdout}`;
        }
        if (stderr.trim()) {
            const maxLength = 4000;
            const truncatedStderr = stderr.length > maxLength
                ? stderr.substring(0, maxLength) + "\n... (stderr truncated)"
                : stderr;
            result += `\n--- STDERR ---\n${truncatedStderr}`;
        }
        if (!stdout.trim() && !stderr.trim()) {
            result += "\n(No output)";
        }
        return result;
    },
};
export const commandTools = [runCommandDefinition];
