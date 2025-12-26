/**
 * TypeScriptClient - LSP client for TypeScript/JavaScript
 *
 * Uses tsserver for TypeScript and JavaScript files.
 * Note: tsserver uses a custom protocol, not standard LSP.
 * We implement a simplified LSP-compatible wrapper.
 */
import { spawn } from "child_process";
import { EventEmitter } from "events";
import * as path from "path";
import { severityFromNumber } from "../types.js";
export class TypeScriptClient {
    language = "typescript";
    workspaceRoot;
    process = null;
    pendingRequests = new Map();
    seq = 0;
    status;
    eventEmitter = new EventEmitter();
    buffer = "";
    openFiles = new Set();
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.status = {
            language: "typescript",
            status: "stopped",
        };
    }
    /**
     * Start tsserver
     */
    async start() {
        if (this.process && this.isRunning()) {
            return;
        }
        this.status = { language: "typescript", status: "starting" };
        try {
            // Use npx to run tsserver
            this.process = spawn("npx", ["tsserver"], {
                stdio: ["pipe", "pipe", "pipe"],
                cwd: this.workspaceRoot,
                env: { ...process.env },
            });
            this.process.stdout?.on("data", (data) => {
                this.handleServerOutput(data);
            });
            this.process.stderr?.on("data", (data) => {
                this.handleServerError(data);
            });
            this.process.on("exit", (code, signal) => {
                this.handleServerExit(code, signal);
            });
            this.process.on("error", (error) => {
                this.status = {
                    language: "typescript",
                    status: "error",
                    error: error.message,
                };
            });
            // Configure tsserver
            await this.sendRequest("configure", {
                hostInfo: "codecli",
                preferences: {
                    providePrefixAndSuffixTextForRename: true,
                },
            });
            // Set compiler options
            await this.sendRequest("compilerOptionsForInferredProjects", {
                options: {
                    module: "commonjs",
                    target: "ES2020",
                    jsx: "react",
                    strict: true,
                    esModuleInterop: true,
                    skipLibCheck: true,
                    forceConsistentCasingInFileNames: true,
                },
            });
            this.status = {
                language: "typescript",
                status: "running",
                pid: this.process.pid,
                lastActivity: Date.now(),
            };
            this.eventEmitter.emit("started");
        }
        catch (error) {
            this.status = {
                language: "typescript",
                status: "error",
                error: error instanceof Error ? error.message : String(error),
            };
            throw error;
        }
    }
    /**
     * Stop tsserver
     */
    async stop() {
        if (!this.process) {
            return;
        }
        // Capture process reference before nulling to avoid race condition
        const processRef = this.process;
        // Close all open files first
        for (const file of this.openFiles) {
            try {
                this.sendCommand("close", { file });
            }
            catch {
                // Ignore errors during shutdown
            }
        }
        // Send exit command
        try {
            this.sendCommand("exit", {});
        }
        catch {
            // Ignore errors
        }
        // Force kill if still running
        const killTimeout = setTimeout(() => {
            try {
                processRef.kill("SIGKILL");
            }
            catch {
                // Process may have already exited
            }
        }, 2000);
        processRef.on("exit", () => {
            clearTimeout(killTimeout);
        });
        try {
            processRef.kill("SIGTERM");
        }
        catch {
            // Process may have already exited
        }
        this.process = null;
        this.openFiles.clear();
        this.status = { language: "typescript", status: "stopped" };
        // Clean up event listeners to prevent memory leaks
        this.removeAllListeners();
    }
    /**
     * Check if server is running
     */
    isRunning() {
        return this.process !== null && this.status.status === "running";
    }
    /**
     * Get current status
     */
    getStatus() {
        return { ...this.status };
    }
    /**
     * Notify file opened
     */
    async notifyFileOpened(filePath, content) {
        if (!this.isRunning()) {
            await this.start();
        }
        const absPath = path.resolve(this.workspaceRoot, filePath);
        this.sendCommand("open", {
            file: absPath,
            fileContent: content,
            scriptKindName: this.getScriptKind(filePath),
        });
        this.openFiles.add(absPath);
        this.status.lastActivity = Date.now();
        // Request diagnostics
        this.requestDiagnostics(absPath);
    }
    /**
     * Notify file changed
     */
    async notifyFileChanged(filePath, content) {
        if (!this.isRunning()) {
            await this.start();
        }
        const absPath = path.resolve(this.workspaceRoot, filePath);
        // If file wasn't opened, open it
        if (!this.openFiles.has(absPath)) {
            await this.notifyFileOpened(filePath, content);
            return;
        }
        // Send change command
        this.sendCommand("change", {
            file: absPath,
            line: 1,
            offset: 1,
            endLine: 999999,
            endOffset: 1,
            insertString: content,
        });
        this.status.lastActivity = Date.now();
        // Request diagnostics after a small delay
        setTimeout(() => {
            this.requestDiagnostics(absPath);
        }, 100);
    }
    /**
     * Notify file closed
     */
    async notifyFileClosed(filePath) {
        if (!this.isRunning()) {
            return;
        }
        const absPath = path.resolve(this.workspaceRoot, filePath);
        if (this.openFiles.has(absPath)) {
            this.sendCommand("close", { file: absPath });
            this.openFiles.delete(absPath);
        }
    }
    /**
     * Register diagnostics callback
     * Returns an unsubscribe function to remove the listener
     */
    onDiagnostics(callback) {
        this.eventEmitter.on("diagnostics", callback);
        return () => {
            this.eventEmitter.off("diagnostics", callback);
        };
    }
    /**
     * Unregister a diagnostics callback
     */
    offDiagnostics(callback) {
        this.eventEmitter.off("diagnostics", callback);
    }
    /**
     * Remove all event listeners (called during cleanup)
     */
    removeAllListeners() {
        this.eventEmitter.removeAllListeners();
    }
    /**
     * Request diagnostics for a file
     */
    requestDiagnostics(filePath) {
        // Request semantic diagnostics
        this.sendCommand("semanticDiagnosticsSync", {
            file: filePath,
            includeLinePosition: true,
        }).then((result) => {
            if (Array.isArray(result)) {
                const diagnostics = result.map((d) => this.convertDiagnostic(filePath, d));
                this.eventEmitter.emit("diagnostics", filePath, diagnostics);
            }
        }).catch(() => {
            // Ignore errors - file might have been closed
        });
        // Also request syntactic diagnostics
        this.sendCommand("syntacticDiagnosticsSync", {
            file: filePath,
            includeLinePosition: true,
        }).then((result) => {
            if (Array.isArray(result) && result.length > 0) {
                const diagnostics = result.map((d) => this.convertDiagnostic(filePath, d));
                // Merge with existing diagnostics
                this.eventEmitter.emit("diagnostics", filePath, diagnostics);
            }
        }).catch(() => {
            // Ignore errors
        });
    }
    /**
     * Convert tsserver diagnostic to our format
     */
    convertDiagnostic(filePath, tsDiag) {
        const severityMap = {
            error: 1,
            warning: 2,
            suggestion: 3,
            message: 4,
        };
        return {
            file: filePath,
            range: {
                start: {
                    line: (tsDiag.start?.line || 1) - 1,
                    character: (tsDiag.start?.offset || 1) - 1,
                },
                end: {
                    line: (tsDiag.end?.line || 1) - 1,
                    character: (tsDiag.end?.offset || 1) - 1,
                },
            },
            message: tsDiag.text,
            severity: severityFromNumber(severityMap[tsDiag.category] || 1),
            source: "typescript",
            code: tsDiag.code,
        };
    }
    /**
     * Get script kind for file
     */
    getScriptKind(filePath) {
        const ext = filePath.split(".").pop()?.toLowerCase() || "";
        const kindMap = {
            ts: "TS",
            tsx: "TSX",
            js: "JS",
            jsx: "JSX",
        };
        return kindMap[ext] || "TS";
    }
    /**
     * Send a command and wait for response
     */
    sendCommand(command, args) {
        return this.sendRequest(command, args);
    }
    /**
     * Send a request to tsserver
     */
    sendRequest(command, args) {
        return new Promise((resolve, reject) => {
            const seq = ++this.seq;
            const request = {
                seq,
                type: "request",
                command,
                arguments: args,
            };
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(seq);
                reject(new Error(`Request ${command} timed out`));
            }, 30000);
            this.pendingRequests.set(seq, {
                resolve: (value) => {
                    clearTimeout(timeout);
                    resolve(value);
                },
                reject: (reason) => {
                    clearTimeout(timeout);
                    reject(reason);
                },
                command,
            });
            this.writeMessage(JSON.stringify(request));
        });
    }
    /**
     * Write message to tsserver
     */
    writeMessage(content) {
        if (!this.process?.stdin?.writable) {
            return;
        }
        this.process.stdin.write(content + "\n");
    }
    /**
     * Handle server output
     */
    handleServerOutput(data) {
        this.buffer += data.toString();
        // Process line by line
        const lines = this.buffer.split("\n");
        this.buffer = lines.pop() || "";
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                const message = JSON.parse(line);
                this.handleMessage(message);
            }
            catch {
                // Skip non-JSON lines
            }
        }
    }
    /**
     * Handle a message from tsserver
     */
    handleMessage(message) {
        if (message.type === "response") {
            const pending = this.pendingRequests.get(message.request_seq);
            if (pending) {
                this.pendingRequests.delete(message.request_seq);
                if (message.success) {
                    pending.resolve(message.body);
                }
                else {
                    pending.reject(new Error(message.message || "Request failed"));
                }
            }
        }
        else if (message.type === "event") {
            this.handleEvent(message);
        }
    }
    /**
     * Handle events from tsserver
     */
    handleEvent(event) {
        if (event.event === "semanticDiag" || event.event === "syntaxDiag") {
            const body = event.body;
            if (body && body.file && Array.isArray(body.diagnostics)) {
                const diagnostics = body.diagnostics.map((d) => this.convertDiagnostic(body.file, d));
                this.eventEmitter.emit("diagnostics", body.file, diagnostics);
            }
        }
    }
    /**
     * Handle server error output
     */
    handleServerError(data) {
        const message = data.toString().trim();
        if (message) {
            this.eventEmitter.emit("stderr", message);
        }
    }
    /**
     * Handle server exit
     */
    handleServerExit(code, signal) {
        if (code !== 0 && code !== null) {
            this.status = {
                language: "typescript",
                status: "error",
                error: `Server exited with code ${code}`,
            };
        }
        else {
            this.status = { language: "typescript", status: "stopped" };
        }
        this.openFiles.clear();
        // Reject pending requests
        for (const [, pending] of this.pendingRequests) {
            pending.reject(new Error("Server exited"));
        }
        this.pendingRequests.clear();
        this.eventEmitter.emit("exit", code, signal);
    }
}
