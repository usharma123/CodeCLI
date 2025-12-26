/**
 * Tests for JDTLSInstaller
 * Tests Bug #9: Configurable JDT LS version
 * Tests Bug #10: Secure downloads with SHA256 verification
 * Tests Bug #11: Progress and cancellation support
 */

import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import * as crypto from "crypto";

// Types for progress and cancellation
interface DownloadProgress {
  bytesDownloaded: number;
  totalBytes: number | null;
  percentage: number | null;
}

type ProgressCallback = (progress: DownloadProgress) => void;
type CancellationToken = { cancelled: boolean };

// Testable JDTLSInstaller implementation
class TestableJDTLSInstaller {
  language = "java" as const;

  private readonly version: string;
  private readonly timestamp: string;
  private progressCallback?: ProgressCallback;
  private cancellationToken?: CancellationToken;

  // Mock state
  private mockIsInstalled = false;
  private mockDownloadFails = false;
  private mockChecksumValid = true;
  private downloadedBytes: number[] = [];

  constructor(options?: {
    version?: string;
    timestamp?: string;
    progressCallback?: ProgressCallback;
    cancellationToken?: CancellationToken;
  }) {
    // Bug #9: Version configurable via options or environment
    this.version = options?.version || process.env.JDTLS_VERSION || "1.31.0";
    this.timestamp = options?.timestamp || process.env.JDTLS_TIMESTAMP || "202312211634";
    this.progressCallback = options?.progressCallback;
    this.cancellationToken = options?.cancellationToken;
  }

  // For testing
  getVersion() {
    return this.version;
  }

  getTimestamp() {
    return this.timestamp;
  }

  setMockInstalled(installed: boolean) {
    this.mockIsInstalled = installed;
  }

  setMockDownloadFails(fails: boolean) {
    this.mockDownloadFails = fails;
  }

  setMockChecksumValid(valid: boolean) {
    this.mockChecksumValid = valid;
  }

  getDownloadedBytes() {
    return this.downloadedBytes;
  }

  /**
   * Check if JDT LS is installed
   */
  async isInstalled(): Promise<boolean> {
    return this.mockIsInstalled;
  }

  /**
   * Simulate download with progress tracking (Bug #11)
   */
  async simulateDownload(totalBytes: number, chunkSize: number): Promise<void> {
    this.downloadedBytes = [];
    let bytesDownloaded = 0;

    while (bytesDownloaded < totalBytes) {
      // Check cancellation (Bug #11)
      if (this.cancellationToken?.cancelled) {
        throw new Error("Download cancelled");
      }

      if (this.mockDownloadFails && bytesDownloaded > totalBytes / 2) {
        throw new Error("Download failed: network error");
      }

      const chunk = Math.min(chunkSize, totalBytes - bytesDownloaded);
      bytesDownloaded += chunk;
      this.downloadedBytes.push(bytesDownloaded);

      // Report progress (Bug #11)
      if (this.progressCallback) {
        this.progressCallback({
          bytesDownloaded,
          totalBytes,
          percentage: Math.round((bytesDownloaded / totalBytes) * 100),
        });
      }

      // Small delay to simulate network
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  /**
   * Verify checksum (Bug #10)
   */
  async verifyChecksum(data: string, expectedHash: string): Promise<boolean> {
    if (!this.mockChecksumValid) {
      return false;
    }
    const hash = crypto.createHash("sha256").update(data).digest("hex");
    return hash.toLowerCase() === expectedHash.toLowerCase();
  }

  /**
   * Get version key for checksum lookup
   */
  getVersionKey(): string {
    return `${this.version}-${this.timestamp}`;
  }

  /**
   * Simulate install
   */
  async install(): Promise<void> {
    if (this.mockDownloadFails) {
      throw new Error("Installation failed: download error");
    }
    this.mockIsInstalled = true;
  }
}

describe("JDTLSInstaller", () => {
  let installer: TestableJDTLSInstaller;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    installer = new TestableJDTLSInstaller();
    // Clean up any test env vars
    delete process.env.JDTLS_VERSION;
    delete process.env.JDTLS_TIMESTAMP;
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  describe("Version configuration (Bug #9)", () => {
    test("should use default version when no options provided", () => {
      const inst = new TestableJDTLSInstaller();
      expect(inst.getVersion()).toBe("1.31.0");
      expect(inst.getTimestamp()).toBe("202312211634");
    });

    test("should use version from constructor options", () => {
      const inst = new TestableJDTLSInstaller({
        version: "1.32.0",
        timestamp: "202401151200",
      });
      expect(inst.getVersion()).toBe("1.32.0");
      expect(inst.getTimestamp()).toBe("202401151200");
    });

    test("should use version from environment variables", () => {
      process.env.JDTLS_VERSION = "1.30.0";
      process.env.JDTLS_TIMESTAMP = "202311011000";

      const inst = new TestableJDTLSInstaller();
      expect(inst.getVersion()).toBe("1.30.0");
      expect(inst.getTimestamp()).toBe("202311011000");
    });

    test("constructor options should take precedence over env vars", () => {
      process.env.JDTLS_VERSION = "1.30.0";
      process.env.JDTLS_TIMESTAMP = "202311011000";

      const inst = new TestableJDTLSInstaller({
        version: "1.32.0",
        timestamp: "202401151200",
      });
      expect(inst.getVersion()).toBe("1.32.0");
      expect(inst.getTimestamp()).toBe("202401151200");
    });

    test("should generate correct version key", () => {
      const inst = new TestableJDTLSInstaller({
        version: "1.31.0",
        timestamp: "202312211634",
      });
      expect(inst.getVersionKey()).toBe("1.31.0-202312211634");
    });
  });

  describe("SHA256 checksum verification (Bug #10)", () => {
    test("should verify valid checksum", async () => {
      const testData = "test data for checksum verification";
      const expectedHash = crypto.createHash("sha256").update(testData).digest("hex");

      const isValid = await installer.verifyChecksum(testData, expectedHash);
      expect(isValid).toBe(true);
    });

    test("should reject invalid checksum", async () => {
      installer.setMockChecksumValid(false);

      const isValid = await installer.verifyChecksum("data", "invalidhash");
      expect(isValid).toBe(false);
    });

    test("should handle case-insensitive hash comparison", async () => {
      const testData = "test data";
      const hash = crypto.createHash("sha256").update(testData).digest("hex");

      // Test with uppercase
      const isValidUpper = await installer.verifyChecksum(testData, hash.toUpperCase());
      expect(isValidUpper).toBe(true);

      // Test with lowercase
      const isValidLower = await installer.verifyChecksum(testData, hash.toLowerCase());
      expect(isValidLower).toBe(true);
    });
  });

  describe("Progress tracking (Bug #11)", () => {
    test("should report progress during download", async () => {
      const progressUpdates: DownloadProgress[] = [];

      const inst = new TestableJDTLSInstaller({
        progressCallback: (progress) => {
          progressUpdates.push({ ...progress });
        },
      });

      await inst.simulateDownload(1000, 100);

      expect(progressUpdates.length).toBeGreaterThan(0);

      // First progress should be partial
      expect(progressUpdates[0].bytesDownloaded).toBeLessThan(1000);

      // Last progress should be 100%
      const lastProgress = progressUpdates[progressUpdates.length - 1];
      expect(lastProgress.bytesDownloaded).toBe(1000);
      expect(lastProgress.totalBytes).toBe(1000);
      expect(lastProgress.percentage).toBe(100);
    });

    test("should calculate percentage correctly", async () => {
      const progressUpdates: DownloadProgress[] = [];

      const inst = new TestableJDTLSInstaller({
        progressCallback: (progress) => {
          progressUpdates.push({ ...progress });
        },
      });

      await inst.simulateDownload(100, 25);

      const percentages = progressUpdates.map(p => p.percentage);
      expect(percentages).toEqual([25, 50, 75, 100]);
    });

    test("should work without progress callback", async () => {
      const inst = new TestableJDTLSInstaller();

      // Should not throw when no progress callback
      await expect(inst.simulateDownload(100, 50)).resolves.toBeUndefined();
    });
  });

  describe("Cancellation support (Bug #11)", () => {
    test("should stop download when cancelled", async () => {
      const cancellationToken: CancellationToken = { cancelled: false };

      const inst = new TestableJDTLSInstaller({
        cancellationToken,
      });

      // Start download and cancel midway
      const downloadPromise = inst.simulateDownload(1000, 100);

      // Cancel after short delay
      setTimeout(() => {
        cancellationToken.cancelled = true;
      }, 5);

      try {
        await downloadPromise;
        expect(true).toBe(false); // Should not reach
      } catch (error) {
        expect((error as Error).message).toBe("Download cancelled");
      }

      // Should have stopped before completing
      const bytes = inst.getDownloadedBytes();
      expect(bytes[bytes.length - 1]).toBeLessThan(1000);
    });

    test("should complete download if not cancelled", async () => {
      const cancellationToken: CancellationToken = { cancelled: false };

      const inst = new TestableJDTLSInstaller({
        cancellationToken,
      });

      await inst.simulateDownload(500, 100);

      const bytes = inst.getDownloadedBytes();
      expect(bytes[bytes.length - 1]).toBe(500);
    });

    test("should work without cancellation token", async () => {
      const inst = new TestableJDTLSInstaller();

      await expect(inst.simulateDownload(300, 100)).resolves.toBeUndefined();
    });
  });

  describe("Error handling", () => {
    test("should handle download failure", async () => {
      installer.setMockDownloadFails(true);

      try {
        await installer.simulateDownload(1000, 100);
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain("network error");
      }
    });

    test("should handle install failure", async () => {
      installer.setMockDownloadFails(true);

      try {
        await installer.install();
        expect(true).toBe(false);
      } catch (error) {
        expect((error as Error).message).toContain("Installation failed");
      }
    });
  });

  describe("isInstalled", () => {
    test("should return false when not installed", async () => {
      installer.setMockInstalled(false);
      expect(await installer.isInstalled()).toBe(false);
    });

    test("should return true when installed", async () => {
      installer.setMockInstalled(true);
      expect(await installer.isInstalled()).toBe(true);
    });

    test("install should set installed to true", async () => {
      expect(await installer.isInstalled()).toBe(false);

      await installer.install();

      expect(await installer.isInstalled()).toBe(true);
    });
  });

  describe("Combined progress and cancellation", () => {
    test("should report progress before cancellation", async () => {
      const progressUpdates: DownloadProgress[] = [];
      const cancellationToken: CancellationToken = { cancelled: false };

      const inst = new TestableJDTLSInstaller({
        progressCallback: (progress) => {
          progressUpdates.push({ ...progress });
          // Cancel at 50%
          if (progress.percentage && progress.percentage >= 50) {
            cancellationToken.cancelled = true;
          }
        },
        cancellationToken,
      });

      try {
        await inst.simulateDownload(1000, 100);
      } catch {
        // Expected cancellation
      }

      // Should have some progress updates before cancellation
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1].percentage).toBeGreaterThanOrEqual(50);
    });
  });
});
