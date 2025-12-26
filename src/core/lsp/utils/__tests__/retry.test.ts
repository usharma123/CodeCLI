/**
 * Tests for retry utility
 * Tests Bug #14: Retry mechanism with exponential backoff
 */

import { describe, test, expect, mock, beforeEach } from "bun:test";
import { withRetry, retryable, isTransientError, RetryConfigs } from "../retry.js";

describe("withRetry", () => {
  test("should succeed on first attempt when no error", async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      return "success";
    };

    const result = await withRetry(fn, { maxRetries: 3 });

    expect(result).toBe("success");
    expect(callCount).toBe(1);
  });

  test("should retry on failure and eventually succeed", async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      if (callCount < 3) {
        throw new Error("transient error");
      }
      return "success";
    };

    const result = await withRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 10,
      backoffMultiplier: 1
    });

    expect(result).toBe("success");
    expect(callCount).toBe(3);
  });

  test("should throw after exhausting retries", async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      throw new Error("persistent error");
    };

    try {
      await withRetry(fn, {
        maxRetries: 2,
        initialDelayMs: 10
      });
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect((error as Error).message).toBe("persistent error");
      expect(callCount).toBe(3); // Initial + 2 retries
    }
  });

  test("should not retry when isRetryable returns false", async () => {
    let callCount = 0;
    const fn = async () => {
      callCount++;
      throw new Error("non-retryable error");
    };

    try {
      await withRetry(fn, {
        maxRetries: 3,
        initialDelayMs: 10,
        isRetryable: () => false
      });
      expect(true).toBe(false);
    } catch (error) {
      expect((error as Error).message).toBe("non-retryable error");
      expect(callCount).toBe(1); // Only initial attempt
    }
  });

  test("should call onRetry callback before each retry", async () => {
    let callCount = 0;
    const retryAttempts: number[] = [];

    const fn = async () => {
      callCount++;
      if (callCount < 3) {
        throw new Error("error");
      }
      return "success";
    };

    await withRetry(fn, {
      maxRetries: 3,
      initialDelayMs: 10,
      backoffMultiplier: 1,
      onRetry: (attempt) => {
        retryAttempts.push(attempt);
      }
    });

    expect(retryAttempts).toEqual([1, 2]);
  });

  test("should respect maxDelayMs", async () => {
    let callCount = 0;
    const startTime = Date.now();

    const fn = async () => {
      callCount++;
      if (callCount < 4) {
        throw new Error("error");
      }
      return "success";
    };

    await withRetry(fn, {
      maxRetries: 5,
      initialDelayMs: 100,
      maxDelayMs: 200,
      backoffMultiplier: 10 // Would grow quickly without cap
    });

    const elapsed = Date.now() - startTime;
    // Should not take more than ~600ms (3 retries * 200ms max)
    expect(elapsed).toBeLessThan(1000);
  });
});

describe("retryable", () => {
  test("should wrap function with retry logic", async () => {
    let callCount = 0;
    const fn = async (x: number) => {
      callCount++;
      if (callCount < 2) {
        throw new Error("error");
      }
      return x * 2;
    };

    const retryableFn = retryable(fn, {
      maxRetries: 3,
      initialDelayMs: 10
    });

    const result = await retryableFn(5);
    expect(result).toBe(10);
    expect(callCount).toBe(2);
  });
});

describe("isTransientError", () => {
  test("should return true for network errors", () => {
    expect(isTransientError(new Error("ECONNRESET"))).toBe(true);
    expect(isTransientError(new Error("ECONNREFUSED"))).toBe(true);
    expect(isTransientError(new Error("ETIMEDOUT"))).toBe(true);
    expect(isTransientError(new Error("socket hang up"))).toBe(true);
    expect(isTransientError(new Error("network error"))).toBe(true);
    expect(isTransientError(new Error("timeout"))).toBe(true);
  });

  test("should return true for temporary file system errors", () => {
    expect(isTransientError(new Error("EBUSY"))).toBe(true);
    expect(isTransientError(new Error("EAGAIN"))).toBe(true);
  });

  test("should return true for HTTP temporary errors", () => {
    expect(isTransientError(new Error("500 Internal Server Error"))).toBe(true);
    expect(isTransientError(new Error("502 Bad Gateway"))).toBe(true);
    expect(isTransientError(new Error("503 Service Unavailable"))).toBe(true);
    expect(isTransientError(new Error("429 Too Many Requests"))).toBe(true);
  });

  test("should return false for non-transient errors", () => {
    expect(isTransientError(new Error("File not found"))).toBe(false);
    expect(isTransientError(new Error("Permission denied"))).toBe(false);
    expect(isTransientError(new Error("Invalid argument"))).toBe(false);
  });

  test("should return false for non-Error objects", () => {
    expect(isTransientError("string error")).toBe(false);
    expect(isTransientError(null)).toBe(false);
    expect(isTransientError(undefined)).toBe(false);
    expect(isTransientError(42)).toBe(false);
  });
});

describe("RetryConfigs", () => {
  test("network config should have appropriate values", () => {
    expect(RetryConfigs.network.maxRetries).toBe(3);
    expect(RetryConfigs.network.initialDelayMs).toBe(500);
    expect(RetryConfigs.network.maxDelayMs).toBe(5000);
  });

  test("installation config should have appropriate values", () => {
    expect(RetryConfigs.installation.maxRetries).toBe(3);
    expect(RetryConfigs.installation.initialDelayMs).toBe(1000);
    expect(RetryConfigs.installation.maxDelayMs).toBe(10000);
  });

  test("fileOperation config should have appropriate values", () => {
    expect(RetryConfigs.fileOperation.maxRetries).toBe(2);
    expect(RetryConfigs.fileOperation.initialDelayMs).toBe(100);
    expect(RetryConfigs.fileOperation.maxDelayMs).toBe(1000);
  });
});
