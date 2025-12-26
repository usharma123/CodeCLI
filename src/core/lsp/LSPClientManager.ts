/**
 * LSPClientManager - Singleton manager for all LSP clients
 *
 * Manages lifecycle of language server clients, handles file change notifications,
 * and coordinates with the diagnostics state manager.
 */

import { EventEmitter } from "events";
import { isLSPAutoInstallEnabled } from "../feature-flags.js";
import { LSPDiagnosticsStateManager } from "./LSPDiagnosticsStateManager.js";
import { TypeScriptClient } from "./clients/TypeScriptClient.js";
import { PyrightClient } from "./clients/PyrightClient.js";
import { JDTLSClient } from "./clients/JDTLSClient.js";
import { TypeScriptInstaller } from "./installers/TypeScriptInstaller.js";
import { PyrightInstaller } from "./installers/PyrightInstaller.js";
import { JDTLSInstaller } from "./installers/JDTLSInstaller.js";
import { detectLanguage } from "./utils/language-detector.js";
import type {
  ILSPClient,
  ILSPInstaller,
  LSPLanguage,
  LSPConfig,
  ServerStatus,
} from "./types.js";
import { getDefaultLSPConfig } from "./types.js";

export interface LSPError {
  type: "notification" | "client" | "startup";
  filePath?: string;
  language?: LSPLanguage;
  error: Error;
  timestamp: number;
}

export type LSPErrorCallback = (error: LSPError) => void;

export class LSPClientManager {
  private static instance: LSPClientManager | null = null;

  private clients: Map<LSPLanguage, ILSPClient> = new Map();
  private installers: Map<LSPLanguage, ILSPInstaller> = new Map();
  private workspaceRoot: string;
  private config: LSPConfig;
  private diagnosticsManager: LSPDiagnosticsStateManager;
  private starting: Map<LSPLanguage, Promise<ILSPClient>> = new Map();

  // Instance-level debounce timers (fixes Bug #7 - module-level Map issue)
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  // Event emitter for error events (fixes Bug #23)
  private eventEmitter: EventEmitter = new EventEmitter();

  // Error callback for custom error handling
  private errorCallback?: LSPErrorCallback;

  private constructor(workspaceRoot: string, config: LSPConfig) {
    this.workspaceRoot = workspaceRoot;
    this.config = config;
    this.diagnosticsManager = new LSPDiagnosticsStateManager();
    this.registerInstallers();
  }

  /**
   * Get or create the singleton instance
   */
  static getInstance(workspaceRoot?: string): LSPClientManager | null {
    if (!LSPClientManager.instance) {
      if (!workspaceRoot) {
        return null;
      }
      LSPClientManager.instance = new LSPClientManager(
        workspaceRoot,
        getDefaultLSPConfig()
      );
    }
    return LSPClientManager.instance;
  }

  /**
   * Reset the singleton (for testing)
   */
  static reset(): void {
    if (LSPClientManager.instance) {
      LSPClientManager.instance.shutdown().catch(() => {});
      LSPClientManager.instance = null;
    }
  }

  /**
   * Set error callback for custom error handling
   */
  setErrorCallback(callback: LSPErrorCallback): void {
    this.errorCallback = callback;
  }

  /**
   * Register for error events
   */
  onError(callback: (error: LSPError) => void): () => void {
    this.eventEmitter.on("error", callback);
    return () => {
      this.eventEmitter.off("error", callback);
    };
  }

  /**
   * Emit an error event
   */
  private emitError(error: LSPError): void {
    this.eventEmitter.emit("error", error);
    if (this.errorCallback) {
      this.errorCallback(error);
    }
    // Also log to console for visibility
    console.warn(
      `LSP ${error.type} error${error.filePath ? ` for ${error.filePath}` : ""}:`,
      error.error.message
    );
  }

  /**
   * Register language server installers
   */
  private registerInstallers(): void {
    // TypeScript/JavaScript
    this.installers.set("typescript", new TypeScriptInstaller());
    this.installers.set("javascript", new TypeScriptInstaller());

    // Python
    this.installers.set("python", new PyrightInstaller());

    // Java/Kotlin
    const jdtInstaller = new JDTLSInstaller();
    this.installers.set("java", jdtInstaller);
    this.installers.set("kotlin", jdtInstaller);
  }

  /**
   * Create a client for a language
   */
  private createClient(language: LSPLanguage): ILSPClient {
    switch (language) {
      case "typescript":
      case "javascript":
        return new TypeScriptClient(this.workspaceRoot);
      case "python":
        return new PyrightClient(this.workspaceRoot);
      case "java":
      case "kotlin":
        return new JDTLSClient(this.workspaceRoot);
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  /**
   * Ensure a client is running for a language (lazy initialization)
   */
  async ensureClientRunning(language: LSPLanguage): Promise<ILSPClient> {
    // Return existing running client
    const existingClient = this.clients.get(language);
    if (existingClient && existingClient.isRunning()) {
      return existingClient;
    }

    // Check if already starting
    const startingPromise = this.starting.get(language);
    if (startingPromise) {
      return startingPromise;
    }

    // Start new client
    const startPromise = this.startClient(language);
    this.starting.set(language, startPromise);

    try {
      const client = await startPromise;
      this.starting.delete(language);
      return client;
    } catch (error) {
      this.starting.delete(language);
      throw error;
    }
  }

  /**
   * Start a client for a language
   */
  private async startClient(language: LSPLanguage): Promise<ILSPClient> {
    const installer = this.installers.get(language);

    if (!installer) {
      throw new Error(`No installer for language: ${language}`);
    }

    // Auto-install if needed
    const isInstalled = await installer.isInstalled();
    if (!isInstalled) {
      if (isLSPAutoInstallEnabled()) {
        await installer.install();
      } else {
        throw new Error(
          `Language server for ${language} is not installed. ` +
            `Set LSP_AUTO_INSTALL=true to auto-install.`
        );
      }
    }

    // Create and start client
    const client = this.createClient(language);

    // Subscribe to diagnostics
    client.onDiagnostics((file, diagnostics) => {
      this.diagnosticsManager.updateDiagnostics(file, diagnostics);
      this.diagnosticsManager.updateServerStatus(language, client.getStatus());
    });

    await client.start();

    this.clients.set(language, client);
    this.diagnosticsManager.updateServerStatus(language, client.getStatus());

    return client;
  }

  /**
   * Get the debounce delay in ms (standardized across operations - Bug #22)
   */
  private getDebounceMs(): number {
    return this.config.diagnosticsDebounceMs;
  }

  /**
   * Notify that a file has changed (called after edit_file/write_file)
   * Returns a Promise that resolves when the notification is processed
   */
  async notifyFileChanged(filePath: string, content: string): Promise<void> {
    const language = detectLanguage(filePath);
    if (!language) {
      return;
    }

    return new Promise((resolve) => {
      // Debounce rapid changes using instance-level timers
      const existingTimer = this.debounceTimers.get(filePath);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      this.debounceTimers.set(
        filePath,
        setTimeout(async () => {
          this.debounceTimers.delete(filePath);
          try {
            const client = await this.ensureClientRunning(language);
            await client.notifyFileChanged(filePath, content);
          } catch (error) {
            // Emit error event instead of just logging
            this.emitError({
              type: "notification",
              filePath,
              language,
              error: error instanceof Error ? error : new Error(String(error)),
              timestamp: Date.now(),
            });
          }
          resolve();
        }, this.getDebounceMs())
      );
    });
  }

  /**
   * Notify that a file was opened
   */
  async notifyFileOpened(filePath: string, content: string): Promise<void> {
    const language = detectLanguage(filePath);
    if (!language) {
      return;
    }

    try {
      const client = await this.ensureClientRunning(language);
      await client.notifyFileOpened(filePath, content);
    } catch (error) {
      // Emit error event instead of just logging
      this.emitError({
        type: "notification",
        filePath,
        language,
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Notify that a file was closed
   */
  async notifyFileClosed(filePath: string): Promise<void> {
    const language = detectLanguage(filePath);
    if (!language) {
      return;
    }

    const client = this.clients.get(language);
    if (client && client.isRunning()) {
      try {
        await client.notifyFileClosed(filePath);
      } catch (error) {
        this.emitError({
          type: "notification",
          filePath,
          language,
          error: error instanceof Error ? error : new Error(String(error)),
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Get the diagnostics manager
   */
  getDiagnosticsManager(): LSPDiagnosticsStateManager {
    return this.diagnosticsManager;
  }

  /**
   * Get all server statuses
   */
  getAllServerStatuses(): ServerStatus[] {
    return this.diagnosticsManager.getAllServerStatuses();
  }

  /**
   * Check if any client is running
   */
  hasRunningClients(): boolean {
    for (const client of this.clients.values()) {
      if (client.isRunning()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Shutdown all clients
   */
  async shutdown(): Promise<void> {
    // Clear debounce timers (instance-level)
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Stop all clients
    const stopPromises: Promise<void>[] = [];
    for (const client of this.clients.values()) {
      stopPromises.push(client.stop());
    }

    await Promise.allSettled(stopPromises);
    this.clients.clear();
    this.diagnosticsManager.clearAll();

    // Clean up event listeners
    this.eventEmitter.removeAllListeners();
  }
}

/**
 * Get the LSP client manager instance
 * Returns null if LSP is not initialized
 */
export function getLSPClientManager(): LSPClientManager | null {
  return LSPClientManager.getInstance();
}

/**
 * Initialize the LSP client manager with a workspace root
 */
export function initializeLSP(workspaceRoot: string): LSPClientManager {
  return LSPClientManager.getInstance(workspaceRoot)!;
}

/**
 * Shutdown LSP and clear the singleton
 */
export async function shutdownLSP(): Promise<void> {
  LSPClientManager.reset();
}
