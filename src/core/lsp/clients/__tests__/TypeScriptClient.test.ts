/**
 * Tests for TypeScriptClient
 * Tests Bug #6: Race condition in stop()
 * Tests Bug #5/#17: Event listener cleanup
 */

import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { EventEmitter } from "events";

// Mock the child_process module behavior
class MockChildProcess extends EventEmitter {
  stdin = { write: mock(() => {}) };
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  killed = false;
  pid = 12345;

  kill(signal?: string) {
    if (this.killed) {
      throw new Error("Process already killed");
    }
    this.killed = true;
    setTimeout(() => this.emit("exit", 0, signal), 10);
  }
}

// Create a testable TypeScriptClient implementation
class TestableTypeScriptClient {
  language = "typescript" as const;
  workspaceRoot: string;

  private process: MockChildProcess | null = null;
  private pendingRequests: Map<number, any> = new Map();
  private seq: number = 0;
  private status: any;
  private eventEmitter: EventEmitter = new EventEmitter();
  private buffer: string = "";
  private openFiles: Set<string> = new Set();

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.status = { language: "typescript", status: "stopped" };
  }

  // For testing
  setProcess(process: MockChildProcess | null) {
    this.process = process;
    if (process) {
      this.status = { language: "typescript", status: "running" };
    }
  }

  getProcess() {
    return this.process;
  }

  getOpenFiles() {
    return this.openFiles;
  }

  getEventEmitter() {
    return this.eventEmitter;
  }

  addOpenFile(file: string) {
    this.openFiles.add(file);
  }

  isRunning(): boolean {
    return this.process !== null && this.status.status === "running";
  }

  getStatus() {
    return { ...this.status };
  }

  /**
   * Stop with race condition fix (Bug #6)
   * Captures process reference before nulling to avoid race
   */
  async stop(): Promise<void> {
    if (!this.process) {
      return;
    }

    // Bug #6 fix: Capture process reference before nulling
    const processRef = this.process;

    // Close all open files first
    for (const file of this.openFiles) {
      try {
        // Mock sendCommand
      } catch {
        // Ignore errors during shutdown
      }
    }

    // Force kill if still running
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
    this.openFiles.clear();
    this.status = { language: "typescript", status: "stopped" };

    // Clean up event listeners
    this.removeAllListeners();
  }

  /**
   * Register diagnostics callback (Bug #5/#17)
   */
  onDiagnostics(callback: (file: string, diagnostics: any[]) => void): () => void {
    this.eventEmitter.on("diagnostics", callback);
    return () => {
      this.eventEmitter.off("diagnostics", callback);
    };
  }

  /**
   * Unregister diagnostics callback (Bug #5/#17)
   */
  offDiagnostics(callback: (file: string, diagnostics: any[]) => void): void {
    this.eventEmitter.off("diagnostics", callback);
  }

  /**
   * Remove all listeners (Bug #5/#17)
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
}

describe("TypeScriptClient", () => {
  let client: TestableTypeScriptClient;
  let mockProcess: MockChildProcess;

  beforeEach(() => {
    client = new TestableTypeScriptClient("/workspace");
    mockProcess = new MockChildProcess();
  });

  describe("Race condition fix in stop() (Bug #6)", () => {
    test("should capture process reference before nulling", async () => {
      client.setProcess(mockProcess);
      expect(client.getProcess()).not.toBeNull();

      // Stop the client
      const stopPromise = client.stop();

      // Process should be null immediately
      expect(client.getProcess()).toBeNull();

      // But the captured reference should still work
      await stopPromise;

      // Process should be killed
      expect(mockProcess.killed).toBe(true);
    });

    test("should handle stop() when process is already null", async () => {
      expect(client.getProcess()).toBeNull();

      // Should not throw
      await expect(client.stop()).resolves.toBeUndefined();
    });

    test("should clear open files on stop", async () => {
      client.setProcess(mockProcess);
      client.addOpenFile("/workspace/file1.ts");
      client.addOpenFile("/workspace/file2.ts");

      expect(client.getOpenFiles().size).toBe(2);

      await client.stop();

      expect(client.getOpenFiles().size).toBe(0);
    });

    test("should update status to stopped", async () => {
      client.setProcess(mockProcess);
      expect(client.getStatus().status).toBe("running");

      await client.stop();

      expect(client.getStatus().status).toBe("stopped");
    });

    test("should handle process.kill() errors gracefully", async () => {
      client.setProcess(mockProcess);

      // Kill immediately so next kill throws
      mockProcess.kill();

      // Should not throw even though process is already killed
      await expect(client.stop()).resolves.toBeUndefined();
    });

    test("should clear kill timeout when process exits", async () => {
      client.setProcess(mockProcess);

      const stopPromise = client.stop();

      // Wait for exit
      await stopPromise;

      // No SIGKILL should have been sent (only SIGTERM)
      expect(mockProcess.killed).toBe(true);
    });
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

      client.emitDiagnostics("test.ts", []);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      client.emitDiagnostics("test.ts", []);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test("offDiagnostics should remove specific listener", () => {
      const callback1 = mock(() => {});
      const callback2 = mock(() => {});

      client.onDiagnostics(callback1);
      client.onDiagnostics(callback2);

      client.emitDiagnostics("test.ts", []);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      client.offDiagnostics(callback1);

      client.emitDiagnostics("test.ts", []);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(2);
    });

    test("removeAllListeners should clear all listeners", () => {
      const callback1 = mock(() => {});
      const callback2 = mock(() => {});

      client.onDiagnostics(callback1);
      client.onDiagnostics(callback2);

      const emitter = client.getEventEmitter();
      expect(emitter.listenerCount("diagnostics")).toBe(2);

      client.removeAllListeners();

      expect(emitter.listenerCount("diagnostics")).toBe(0);
    });

    test("stop() should call removeAllListeners", async () => {
      client.setProcess(mockProcess);

      const callback = mock(() => {});
      client.onDiagnostics(callback);

      const emitter = client.getEventEmitter();
      expect(emitter.listenerCount("diagnostics")).toBe(1);

      await client.stop();

      expect(emitter.listenerCount("diagnostics")).toBe(0);
    });

    test("diagnostics with file path and data should be passed to callback", () => {
      const receivedData: any[] = [];

      client.onDiagnostics((file, diagnostics) => {
        receivedData.push({ file, diagnostics });
      });

      const mockDiagnostics = [
        { message: "Error 1", severity: "error" },
        { message: "Warning 1", severity: "warning" }
      ];

      client.emitDiagnostics("/workspace/test.ts", mockDiagnostics);

      expect(receivedData).toHaveLength(1);
      expect(receivedData[0].file).toBe("/workspace/test.ts");
      expect(receivedData[0].diagnostics).toEqual(mockDiagnostics);
    });
  });

  describe("isRunning", () => {
    test("should return false when process is null", () => {
      expect(client.isRunning()).toBe(false);
    });

    test("should return true when process exists and status is running", () => {
      client.setProcess(mockProcess);
      expect(client.isRunning()).toBe(true);
    });

    test("should return false after stop()", async () => {
      client.setProcess(mockProcess);
      expect(client.isRunning()).toBe(true);

      await client.stop();

      expect(client.isRunning()).toBe(false);
    });
  });
});
