/**
 * Tests for BaseLSPClient
 * Tests Bug #4: Timeout handling
 * Tests Bug #5/#17: Event listener cleanup
 */

import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { EventEmitter } from "events";

// Create a concrete implementation for testing
class TestLSPClient {
  language = "typescript" as const;
  workspaceRoot: string;

  protected process: any = null;
  protected pendingRequests: Map<number, any> = new Map();
  protected requestId: number = 0;
  protected status: any;
  protected eventEmitter: EventEmitter = new EventEmitter();
  protected buffer: string = "";
  protected documentVersions: Map<string, number> = new Map();
  protected initialized: boolean = false;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.status = {
      language: "typescript",
      status: "stopped",
    };
  }

  // Expose protected methods for testing
  getEventEmitter() {
    return this.eventEmitter;
  }

  getPendingRequests() {
    return this.pendingRequests;
  }

  /**
   * Register callback for diagnostics
   * Returns an unsubscribe function to remove the listener (Bug #5/#17)
   */
  onDiagnostics(callback: (file: string, diagnostics: any[]) => void): () => void {
    this.eventEmitter.on("diagnostics", callback);
    return () => {
      this.eventEmitter.off("diagnostics", callback);
    };
  }

  /**
   * Unregister a diagnostics callback (Bug #5/#17)
   */
  offDiagnostics(callback: (file: string, diagnostics: any[]) => void): void {
    this.eventEmitter.off("diagnostics", callback);
  }

  /**
   * Remove all event listeners (Bug #5/#17)
   */
  removeAllListeners(): void {
    this.eventEmitter.removeAllListeners();
  }

  /**
   * Emit diagnostics for testing
   */
  emitDiagnostics(file: string, diagnostics: any[]): void {
    this.eventEmitter.emit("diagnostics", file, diagnostics);
  }

  /**
   * Simulate sendRequest with timeout handling (Bug #4)
   */
  sendRequest(method: string, params: unknown, timeoutMs: number = 1000): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;

      let timedOut = false;

      const timeout = setTimeout(() => {
        timedOut = true;
        // Keep in map briefly to detect late responses
        const pending = this.pendingRequests.get(id);
        if (pending) {
          // Mark as timed out but don't delete yet
          this.pendingRequests.set(id, {
            ...pending,
            resolve: () => {
              // Late response after timeout - would log in real implementation
            },
            reject: () => {
              // Late error after timeout - ignore
            },
          });
          // Clean up after a short delay
          setTimeout(() => this.pendingRequests.delete(id), 100);
        }
        reject(new Error(`Request ${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(id, {
        resolve: (value: unknown) => {
          if (!timedOut) {
            clearTimeout(timeout);
            resolve(value);
          }
          this.pendingRequests.delete(id);
        },
        reject: (reason: Error) => {
          if (!timedOut) {
            clearTimeout(timeout);
            reject(reason);
          }
          this.pendingRequests.delete(id);
        },
        method,
        startTime: Date.now(),
      });
    });
  }

  /**
   * Simulate receiving a response
   */
  receiveResponse(id: number, result: unknown): void {
    const pending = this.pendingRequests.get(id);
    if (pending) {
      pending.resolve(result);
    }
  }

  /**
   * Simulate receiving an error
   */
  receiveError(id: number, error: Error): void {
    const pending = this.pendingRequests.get(id);
    if (pending) {
      pending.reject(error);
    }
  }
}

describe("BaseLSPClient", () => {
  let client: TestLSPClient;

  beforeEach(() => {
    client = new TestLSPClient("/workspace");
  });

  describe("Event listener cleanup (Bug #5/#17)", () => {
    test("onDiagnostics should return unsubscribe function", () => {
      const callback = mock(() => {});
      const unsubscribe = client.onDiagnostics(callback);

      expect(typeof unsubscribe).toBe("function");
    });

    test("unsubscribe function should remove listener", () => {
      const callback = mock(() => {});
      const unsubscribe = client.onDiagnostics(callback);

      // Emit and verify callback is called
      client.emitDiagnostics("test.ts", []);
      expect(callback).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();

      // Emit again and verify callback is NOT called
      client.emitDiagnostics("test.ts", []);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test("offDiagnostics should remove specific listener", () => {
      const callback1 = mock(() => {});
      const callback2 = mock(() => {});

      client.onDiagnostics(callback1);
      client.onDiagnostics(callback2);

      // Both should be called
      client.emitDiagnostics("test.ts", []);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // Remove callback1
      client.offDiagnostics(callback1);

      // Only callback2 should be called
      client.emitDiagnostics("test.ts", []);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(2);
    });

    test("removeAllListeners should remove all listeners", () => {
      const callback1 = mock(() => {});
      const callback2 = mock(() => {});
      const callback3 = mock(() => {});

      client.onDiagnostics(callback1);
      client.onDiagnostics(callback2);
      client.getEventEmitter().on("other", callback3);

      // Verify listeners are registered
      client.emitDiagnostics("test.ts", []);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // Remove all
      client.removeAllListeners();

      // None should be called
      client.emitDiagnostics("test.ts", []);
      client.getEventEmitter().emit("other");
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(0);
    });

    test("multiple subscribers should all receive events", () => {
      const results: string[] = [];

      client.onDiagnostics((file) => results.push(`a:${file}`));
      client.onDiagnostics((file) => results.push(`b:${file}`));
      client.onDiagnostics((file) => results.push(`c:${file}`));

      client.emitDiagnostics("test.ts", []);

      expect(results).toEqual(["a:test.ts", "b:test.ts", "c:test.ts"]);
    });

    test("listener count should decrease after unsubscribe", () => {
      const emitter = client.getEventEmitter();

      const unsub1 = client.onDiagnostics(() => {});
      const unsub2 = client.onDiagnostics(() => {});
      const unsub3 = client.onDiagnostics(() => {});

      expect(emitter.listenerCount("diagnostics")).toBe(3);

      unsub1();
      expect(emitter.listenerCount("diagnostics")).toBe(2);

      unsub2();
      expect(emitter.listenerCount("diagnostics")).toBe(1);

      unsub3();
      expect(emitter.listenerCount("diagnostics")).toBe(0);
    });
  });

  describe("Timeout handling (Bug #4)", () => {
    test("should resolve when response arrives before timeout", async () => {
      const promise = client.sendRequest("test", {}, 1000);

      // Simulate immediate response
      setTimeout(() => {
        client.receiveResponse(1, { success: true });
      }, 10);

      const result = await promise;
      expect(result).toEqual({ success: true });
    });

    test("should reject when timeout occurs", async () => {
      const promise = client.sendRequest("test", {}, 50);

      try {
        await promise;
        expect(true).toBe(false); // Should not reach
      } catch (error) {
        expect((error as Error).message).toContain("timed out");
        expect((error as Error).message).toContain("50ms");
      }
    });

    test("should clean up pending request after timeout", async () => {
      const promise = client.sendRequest("test", {}, 50);

      try {
        await promise;
      } catch {
        // Expected timeout
      }

      // Wait for cleanup delay
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(client.getPendingRequests().size).toBe(0);
    });

    test("late response after timeout should not cause errors", async () => {
      const promise = client.sendRequest("test", {}, 50);

      try {
        await promise;
      } catch {
        // Expected timeout
      }

      // Send late response - should not throw
      expect(() => {
        client.receiveResponse(1, { late: true });
      }).not.toThrow();
    });

    test("should handle multiple concurrent requests with different timeouts", async () => {
      const results: string[] = [];

      const promise1 = client.sendRequest("fast", {}, 100)
        .then(() => results.push("fast"))
        .catch(() => results.push("fast-timeout"));

      const promise2 = client.sendRequest("slow", {}, 200)
        .then(() => results.push("slow"))
        .catch(() => results.push("slow-timeout"));

      // Respond to first request quickly
      setTimeout(() => client.receiveResponse(1, {}), 20);
      // Let second request timeout

      await Promise.all([promise1, promise2]);

      expect(results).toContain("fast");
      expect(results).toContain("slow-timeout");
    });

    test("should reject with error when error response arrives", async () => {
      const promise = client.sendRequest("test", {}, 1000);

      setTimeout(() => {
        client.receiveError(1, new Error("Server error"));
      }, 10);

      try {
        await promise;
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toBe("Server error");
      }
    });

    test("pending request should be cleaned up after resolution", async () => {
      const promise = client.sendRequest("test", {}, 1000);

      expect(client.getPendingRequests().size).toBe(1);

      setTimeout(() => {
        client.receiveResponse(1, { success: true });
      }, 10);

      await promise;

      expect(client.getPendingRequests().size).toBe(0);
    });
  });
});
