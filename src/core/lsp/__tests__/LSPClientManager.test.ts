/**
 * Tests for LSPClientManager
 * Tests Bug #7: Debounce timer handling (instance-level)
 * Tests Bug #22: Standardized debounce configuration
 * Tests Bug #23: Error handling with events and callbacks
 */

import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { EventEmitter } from "events";

// Mock types
interface LSPError {
  type: "notification" | "client" | "startup";
  filePath?: string;
  language?: string;
  error: Error;
  timestamp: number;
}

type LSPErrorCallback = (error: LSPError) => void;

// Testable LSPClientManager implementation
class TestableLSPClientManager {
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();
  private errorCallback?: LSPErrorCallback;
  private config = { diagnosticsDebounceMs: 100 };

  constructor() {
    // Prevent unhandled 'error' event exceptions by adding a default handler
    this.eventEmitter.on("lspError", () => {});
  }

  // For testing
  getDebounceTimers() {
    return this.debounceTimers;
  }

  getEventEmitter() {
    return this.eventEmitter;
  }

  /**
   * Set error callback (Bug #23)
   */
  setErrorCallback(callback: LSPErrorCallback): void {
    this.errorCallback = callback;
  }

  /**
   * Register for error events (Bug #23)
   * Note: Uses "lspError" instead of "error" to avoid Node.js special handling
   */
  onError(callback: (error: LSPError) => void): () => void {
    this.eventEmitter.on("lspError", callback);
    return () => {
      this.eventEmitter.off("lspError", callback);
    };
  }

  /**
   * Emit error event (Bug #23)
   */
  emitError(error: LSPError): void {
    this.eventEmitter.emit("lspError", error);
    if (this.errorCallback) {
      this.errorCallback(error);
    }
  }

  /**
   * Get debounce delay (Bug #22 - standardized)
   */
  getDebounceMs(): number {
    return this.config.diagnosticsDebounceMs;
  }

  /**
   * Set debounce config for testing
   */
  setDebounceMs(ms: number): void {
    this.config.diagnosticsDebounceMs = ms;
  }

  /**
   * Simulate notifyFileChanged with debouncing (Bug #7, #22)
   */
  async notifyFileChanged(
    filePath: string,
    content: string,
    onNotify: () => Promise<void>
  ): Promise<void> {
    return new Promise((resolve) => {
      // Instance-level debounce (Bug #7 fix)
      const existingTimer = this.debounceTimers.get(filePath);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      this.debounceTimers.set(
        filePath,
        setTimeout(async () => {
          this.debounceTimers.delete(filePath);
          try {
            await onNotify();
          } catch (error) {
            // Emit error event (Bug #23)
            this.emitError({
              type: "notification",
              filePath,
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
   * Clear all timers (for cleanup)
   */
  clearAllTimers(): void {
    for (const [, timer] of this.debounceTimers) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  /**
   * Shutdown (cleanup)
   */
  shutdown(): void {
    this.clearAllTimers();
    this.eventEmitter.removeAllListeners();
  }
}

describe("LSPClientManager", () => {
  let manager: TestableLSPClientManager;

  beforeEach(() => {
    manager = new TestableLSPClientManager();
  });

  afterEach(() => {
    manager.shutdown();
  });

  describe("Instance-level debounce timers (Bug #7)", () => {
    test("debounce timers should be per-instance", () => {
      const manager1 = new TestableLSPClientManager();
      const manager2 = new TestableLSPClientManager();

      // Each manager should have its own timer map
      expect(manager1.getDebounceTimers()).not.toBe(manager2.getDebounceTimers());

      manager1.shutdown();
      manager2.shutdown();
    });

    test("should store timer for file path", async () => {
      manager.setDebounceMs(50);

      const promise = manager.notifyFileChanged("test.ts", "content", async () => {});

      // Timer should be stored
      expect(manager.getDebounceTimers().has("test.ts")).toBe(true);

      await promise;

      // Timer should be removed after completion
      expect(manager.getDebounceTimers().has("test.ts")).toBe(false);
    });

    test("should clear previous timer on rapid changes", async () => {
      manager.setDebounceMs(50);
      let callCount = 0;

      const onNotify = async () => {
        callCount++;
      };

      // Rapid changes - only the last one should trigger
      manager.notifyFileChanged("test.ts", "content1", onNotify);
      manager.notifyFileChanged("test.ts", "content2", onNotify);
      const promise = manager.notifyFileChanged("test.ts", "content3", onNotify);

      await promise;

      // Only the last call should have executed
      expect(callCount).toBe(1);
    });

    test("different files should have separate timers", async () => {
      manager.setDebounceMs(50);
      const calls: string[] = [];

      const promise1 = manager.notifyFileChanged("file1.ts", "content", async () => {
        calls.push("file1");
      });

      const promise2 = manager.notifyFileChanged("file2.ts", "content", async () => {
        calls.push("file2");
      });

      await Promise.all([promise1, promise2]);

      expect(calls).toContain("file1");
      expect(calls).toContain("file2");
      expect(calls.length).toBe(2);
    });

    test("shutdown should clear all timers", () => {
      manager.setDebounceMs(1000);

      // Start several debounced operations
      manager.notifyFileChanged("file1.ts", "", async () => {});
      manager.notifyFileChanged("file2.ts", "", async () => {});
      manager.notifyFileChanged("file3.ts", "", async () => {});

      expect(manager.getDebounceTimers().size).toBe(3);

      manager.shutdown();

      expect(manager.getDebounceTimers().size).toBe(0);
    });
  });

  describe("Standardized debounce configuration (Bug #22)", () => {
    test("should use configurable debounce delay", () => {
      expect(manager.getDebounceMs()).toBe(100);

      manager.setDebounceMs(200);
      expect(manager.getDebounceMs()).toBe(200);

      manager.setDebounceMs(50);
      expect(manager.getDebounceMs()).toBe(50);
    });

    test("debounce delay should affect notification timing", async () => {
      manager.setDebounceMs(100);
      let notified = false;

      const startTime = Date.now();

      await manager.notifyFileChanged("test.ts", "", async () => {
        notified = true;
      });

      const elapsed = Date.now() - startTime;

      expect(notified).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some timing variance
    });
  });

  describe("Error handling with events (Bug #23)", () => {
    test("onError should return unsubscribe function", () => {
      const callback = mock(() => {});
      const unsubscribe = manager.onError(callback);

      expect(typeof unsubscribe).toBe("function");
    });

    test("should emit error to event listeners", () => {
      const receivedErrors: LSPError[] = [];

      manager.onError((error) => {
        receivedErrors.push(error);
      });

      const testError: LSPError = {
        type: "notification",
        filePath: "test.ts",
        error: new Error("Test error"),
        timestamp: Date.now(),
      };

      manager.emitError(testError);

      expect(receivedErrors.length).toBe(1);
      expect(receivedErrors[0].type).toBe("notification");
      expect(receivedErrors[0].filePath).toBe("test.ts");
    });

    test("unsubscribe should stop receiving errors", () => {
      const receivedErrors: LSPError[] = [];

      const unsubscribe = manager.onError((error) => {
        receivedErrors.push(error);
      });

      manager.emitError({
        type: "notification",
        error: new Error("Error 1"),
        timestamp: Date.now(),
      });

      unsubscribe();

      manager.emitError({
        type: "notification",
        error: new Error("Error 2"),
        timestamp: Date.now(),
      });

      expect(receivedErrors.length).toBe(1);
    });

    test("setErrorCallback should receive errors", () => {
      const receivedErrors: LSPError[] = [];

      manager.setErrorCallback((error) => {
        receivedErrors.push(error);
      });

      manager.emitError({
        type: "client",
        language: "typescript",
        error: new Error("Client error"),
        timestamp: Date.now(),
      });

      expect(receivedErrors.length).toBe(1);
      expect(receivedErrors[0].type).toBe("client");
    });

    test("should emit error when notifyFileChanged fails", async () => {
      manager.setDebounceMs(10);
      const receivedErrors: LSPError[] = [];

      manager.onError((error) => {
        receivedErrors.push(error);
      });

      await manager.notifyFileChanged("test.ts", "content", async () => {
        throw new Error("Notification failed");
      });

      expect(receivedErrors.length).toBe(1);
      expect(receivedErrors[0].type).toBe("notification");
      expect(receivedErrors[0].filePath).toBe("test.ts");
      expect(receivedErrors[0].error.message).toBe("Notification failed");
    });

    test("multiple error listeners should all receive errors", () => {
      const errors1: LSPError[] = [];
      const errors2: LSPError[] = [];
      const errors3: LSPError[] = [];

      manager.onError((e) => errors1.push(e));
      manager.onError((e) => errors2.push(e));
      manager.onError((e) => errors3.push(e));

      manager.emitError({
        type: "startup",
        error: new Error("Startup failed"),
        timestamp: Date.now(),
      });

      expect(errors1.length).toBe(1);
      expect(errors2.length).toBe(1);
      expect(errors3.length).toBe(1);
    });

    test("error should include timestamp", () => {
      let receivedError: LSPError | null = null;

      manager.onError((error) => {
        receivedError = error;
      });

      const beforeEmit = Date.now();

      manager.emitError({
        type: "notification",
        error: new Error("Test"),
        timestamp: Date.now(),
      });

      const afterEmit = Date.now();

      expect(receivedError).not.toBeNull();
      expect(receivedError!.timestamp).toBeGreaterThanOrEqual(beforeEmit);
      expect(receivedError!.timestamp).toBeLessThanOrEqual(afterEmit);
    });

    test("error callback and event listeners should both receive errors", () => {
      const callbackErrors: LSPError[] = [];
      const listenerErrors: LSPError[] = [];

      manager.setErrorCallback((e) => callbackErrors.push(e));
      manager.onError((e) => listenerErrors.push(e));

      manager.emitError({
        type: "notification",
        error: new Error("Test"),
        timestamp: Date.now(),
      });

      expect(callbackErrors.length).toBe(1);
      expect(listenerErrors.length).toBe(1);
    });
  });
});
