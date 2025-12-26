/**
 * BaseLSPClient - Abstract base class for LSP clients
 *
 * Implements JSON-RPC 2.0 protocol over stdio for communicating with language servers.
 * Subclasses implement language-specific initialization and commands.
 */

import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";
import type {
  ILSPClient,
  LSPLanguage,
  ServerStatus,
  Diagnostic,
  PendingRequest,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
  ClientCapabilities,
  PublishDiagnosticsParams,
  LSPDiagnostic,
} from "./types.js";
import { severityFromNumber } from "./types.js";

export abstract class BaseLSPClient implements ILSPClient {
  abstract language: LSPLanguage;
  workspaceRoot: string;

  protected process: ChildProcess | null = null;
  protected pendingRequests: Map<number, PendingRequest> = new Map();
  protected requestId: number = 0;
  protected status: ServerStatus;
  protected eventEmitter: EventEmitter = new EventEmitter();
  protected buffer: string = "";
  protected documentVersions: Map<string, number> = new Map();
  protected initialized: boolean = false;

  constructor(workspaceRoot: string, language: LSPLanguage) {
    this.workspaceRoot = workspaceRoot;
    this.status = {
      language,
      status: "stopped",
    };
  }

  /**
   * Get the command to start the language server
   * Override in subclasses
   */
  protected abstract getStartCommand(): string[];

  /**
   * Get initialization options for the language server
   * Override in subclasses
   */
  protected abstract getInitializationOptions(): unknown;

  /**
   * Start the language server process
   */
  async start(): Promise<void> {
    if (this.process && this.isRunning()) {
      return;
    }

    this.status = { language: this.language, status: "starting" };

    const [command, ...args] = this.getStartCommand();

    try {
      this.process = spawn(command, args, {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: this.workspaceRoot,
        env: { ...process.env },
      });

      this.process.stdout?.on("data", (data: Buffer) => {
        this.handleServerOutput(data);
      });

      this.process.stderr?.on("data", (data: Buffer) => {
        this.handleServerError(data);
      });

      this.process.on("exit", (code, signal) => {
        this.handleServerExit(code, signal);
      });

      this.process.on("error", (error) => {
        this.status = {
          language: this.language,
          status: "error",
          error: error.message,
        };
        this.eventEmitter.emit("error", error);
      });

      // Send initialize request
      const initResult = await this.sendRequest("initialize", {
        processId: process.pid,
        rootUri: `file://${this.workspaceRoot}`,
        capabilities: this.getClientCapabilities(),
        initializationOptions: this.getInitializationOptions(),
        workspaceFolders: [
          {
            uri: `file://${this.workspaceRoot}`,
            name: this.workspaceRoot.split("/").pop() || "workspace",
          },
        ],
      });

      // Send initialized notification
      this.sendNotification("initialized", {});

      this.initialized = true;
      this.status = {
        language: this.language,
        status: "running",
        pid: this.process.pid,
        lastActivity: Date.now(),
      };

      this.eventEmitter.emit("started", initResult);
    } catch (error) {
      this.status = {
        language: this.language,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
      throw error;
    }
  }

  /**
   * Stop the language server process
   */
  async stop(): Promise<void> {
    if (!this.process) {
      return;
    }

    // Capture process reference before nulling to avoid race condition
    const processRef = this.process;

    // Reject all pending requests immediately
    for (const [, pending] of this.pendingRequests) {
      pending.reject(new Error("Client shutting down"));
    }
    this.pendingRequests.clear();

    try {
      // Send shutdown request
      await this.sendRequest("shutdown", null);

      // Send exit notification
      this.sendNotification("exit", null);
    } catch {
      // Ignore errors during shutdown
    }

    // Force kill if still running after 2 seconds
    const killTimeout = setTimeout(() => {
      try {
        processRef.kill("SIGKILL");
      } catch {
        // Process may have already exited
      }
    }, 2000);

    processRef.on("exit", () => {
      clearTimeout(killTimeout);
    });

    try {
      processRef.kill("SIGTERM");
    } catch {
      // Process may have already exited
    }

    this.process = null;
    this.initialized = false;
    this.status = { language: this.language, status: "stopped" };

    // Clean up event listeners to prevent memory leaks
    this.removeAllListeners();
  }

  /**
   * Check if the server is running
   */
  isRunning(): boolean {
    return this.process !== null && this.status.status === "running";
  }

  /**
   * Get current server status
   */
  getStatus(): ServerStatus {
    return { ...this.status };
  }

  /**
   * Notify server that a file was opened
   */
  async notifyFileOpened(filePath: string, content: string): Promise<void> {
    if (!this.isRunning()) {
      await this.start();
    }

    const version = 1;
    this.documentVersions.set(filePath, version);

    this.sendNotification("textDocument/didOpen", {
      textDocument: {
        uri: `file://${filePath}`,
        languageId: this.getLanguageId(filePath),
        version,
        text: content,
      },
    });

    this.status.lastActivity = Date.now();
  }

  /**
   * Notify server that a file was changed
   */
  async notifyFileChanged(filePath: string, content: string): Promise<void> {
    if (!this.isRunning()) {
      await this.start();
    }

    // If document wasn't opened, open it first
    if (!this.documentVersions.has(filePath)) {
      await this.notifyFileOpened(filePath, content);
      return;
    }

    const version = (this.documentVersions.get(filePath) || 0) + 1;
    this.documentVersions.set(filePath, version);

    this.sendNotification("textDocument/didChange", {
      textDocument: {
        uri: `file://${filePath}`,
        version,
      },
      contentChanges: [{ text: content }],
    });

    this.status.lastActivity = Date.now();
  }

  /**
   * Notify server that a file was closed
   */
  async notifyFileClosed(filePath: string): Promise<void> {
    if (!this.isRunning()) {
      return;
    }

    this.documentVersions.delete(filePath);

    this.sendNotification("textDocument/didClose", {
      textDocument: {
        uri: `file://${filePath}`,
      },
    });
  }

  /**
   * Register callback for diagnostics
   * Returns an unsubscribe function to remove the listener
   */
  onDiagnostics(callback: (file: string, diagnostics: Diagnostic[]) => void): () => void {
    this.eventEmitter.on("diagnostics", callback);
    return () => {
      this.eventEmitter.off("diagnostics", callback);
    };
  }

  /**
   * Unregister a diagnostics callback
   */
  offDiagnostics(callback: (file: string, diagnostics: Diagnostic[]) => void): void {
    this.eventEmitter.off("diagnostics", callback);
  }

  /**
   * Remove all event listeners (called during cleanup)
   */
  removeAllListeners(): void {
    this.eventEmitter.removeAllListeners();
  }

  /**
   * Get client capabilities
   */
  protected getClientCapabilities(): ClientCapabilities {
    return {
      textDocument: {
        publishDiagnostics: {
          relatedInformation: true,
        },
        synchronization: {
          didSave: true,
          willSave: false,
        },
      },
    };
  }

  /**
   * Get language ID for a file (for textDocument/didOpen)
   */
  protected getLanguageId(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const mapping: Record<string, string> = {
      ts: "typescript",
      tsx: "typescriptreact",
      js: "javascript",
      jsx: "javascriptreact",
      py: "python",
      java: "java",
      kt: "kotlin",
      kts: "kotlin",
    };
    return mapping[ext] || ext;
  }

  /**
   * Send a JSON-RPC request and wait for response
   * Improved timeout handling (Bug #4)
   */
  protected sendRequest(method: string, params: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;

      const message: JsonRpcRequest = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      };

      let timedOut = false;

      const timeout = setTimeout(() => {
        timedOut = true;
        // Keep in map briefly to detect late responses
        const pending = this.pendingRequests.get(id);
        if (pending) {
          // Mark as timed out but don't delete yet
          this.pendingRequests.set(id, {
            ...pending,
            resolve: (value) => {
              // Late response after timeout - log it
              console.debug(`Late response received for timed out request ${method} (id: ${id})`);
            },
            reject: () => {
              // Late error after timeout - ignore
            },
          });
          // Clean up after a short delay
          setTimeout(() => this.pendingRequests.delete(id), 5000);
        }
        reject(new Error(`Request ${method} timed out after 30s`));
      }, 30000);

      this.pendingRequests.set(id, {
        resolve: (value) => {
          if (!timedOut) {
            clearTimeout(timeout);
            resolve(value);
          }
          this.pendingRequests.delete(id);
        },
        reject: (reason) => {
          if (!timedOut) {
            clearTimeout(timeout);
            reject(reason);
          }
          this.pendingRequests.delete(id);
        },
        method,
        startTime: Date.now(),
      });

      this.writeMessage(JSON.stringify(message));
    });
  }

  /**
   * Send a JSON-RPC notification (no response expected)
   */
  protected sendNotification(method: string, params: unknown): void {
    const message: JsonRpcNotification = {
      jsonrpc: "2.0",
      method,
      params,
    };

    this.writeMessage(JSON.stringify(message));
  }

  /**
   * Write a message with Content-Length header
   */
  private writeMessage(content: string): void {
    if (!this.process?.stdin?.writable) {
      return;
    }

    const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`;
    this.process.stdin.write(header + content);
  }

  /**
   * Handle server stdout data
   */
  private handleServerOutput(data: Buffer): void {
    this.buffer += data.toString();

    // Parse messages from buffer
    while (true) {
      const headerEnd = this.buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) break;

      const header = this.buffer.slice(0, headerEnd);
      const contentLengthMatch = header.match(/Content-Length:\s*(\d+)/i);

      if (!contentLengthMatch) {
        // Skip malformed header
        this.buffer = this.buffer.slice(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(contentLengthMatch[1], 10);
      const messageStart = headerEnd + 4;
      const messageEnd = messageStart + contentLength;

      if (this.buffer.length < messageEnd) {
        // Not enough data yet
        break;
      }

      const messageContent = this.buffer.slice(messageStart, messageEnd);
      this.buffer = this.buffer.slice(messageEnd);

      try {
        const message = JSON.parse(messageContent);
        this.handleMessage(message);
      } catch {
        // Skip malformed JSON
      }
    }
  }

  /**
   * Handle a parsed JSON-RPC message
   */
  private handleMessage(message: JsonRpcResponse | JsonRpcNotification): void {
    // Response to a request
    if ("id" in message && message.id !== undefined) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        this.pendingRequests.delete(message.id);
        if ("error" in message && message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.result);
        }
      }
      return;
    }

    // Notification from server
    if ("method" in message) {
      this.handleNotification(message as JsonRpcNotification);
    }
  }

  /**
   * Handle server notifications
   */
  private handleNotification(notification: JsonRpcNotification): void {
    if (notification.method === "textDocument/publishDiagnostics") {
      this.handlePublishDiagnostics(notification.params as PublishDiagnosticsParams);
    }
    // Could handle other notifications like window/logMessage, etc.
  }

  /**
   * Handle diagnostics published by server
   */
  private handlePublishDiagnostics(params: PublishDiagnosticsParams): void {
    const filePath = params.uri.replace("file://", "");
    const diagnostics = params.diagnostics.map((d) => this.convertDiagnostic(filePath, d));

    this.eventEmitter.emit("diagnostics", filePath, diagnostics);
  }

  /**
   * Convert LSP diagnostic to our format
   */
  private convertDiagnostic(filePath: string, lspDiag: LSPDiagnostic): Diagnostic {
    return {
      file: filePath,
      range: lspDiag.range,
      message: lspDiag.message,
      severity: severityFromNumber(lspDiag.severity),
      source: lspDiag.source || this.language,
      code: lspDiag.code,
    };
  }

  /**
   * Handle server stderr data
   */
  private handleServerError(data: Buffer): void {
    const message = data.toString().trim();
    if (message) {
      this.eventEmitter.emit("stderr", message);
    }
  }

  /**
   * Handle server process exit
   */
  private handleServerExit(code: number | null, signal: string | null): void {
    this.initialized = false;

    if (code !== 0 && code !== null) {
      this.status = {
        language: this.language,
        status: "error",
        error: `Server exited with code ${code}`,
      };
    } else if (signal) {
      this.status = {
        language: this.language,
        status: "stopped",
        error: `Server killed by signal ${signal}`,
      };
    } else {
      this.status = { language: this.language, status: "stopped" };
    }

    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      pending.reject(new Error("Server exited"));
      this.pendingRequests.delete(id);
    }

    this.eventEmitter.emit("exit", code, signal);
  }
}
