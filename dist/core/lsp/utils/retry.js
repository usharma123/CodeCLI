/**
 * Retry utility with exponential backoff
 *
 * Provides a robust retry mechanism for operations that may fail transiently.
 */
const DEFAULT_OPTIONS = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    isRetryable: () => true,
    onRetry: () => { },
};
/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Calculate delay for a given attempt using exponential backoff with jitter
 */
function calculateDelay(attempt, initialDelayMs, maxDelayMs, backoffMultiplier) {
    // Exponential backoff: initialDelay * multiplier^attempt
    const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt);
    // Add jitter (random factor between 0.5 and 1.5)
    const jitter = 0.5 + Math.random();
    const delayWithJitter = exponentialDelay * jitter;
    // Cap at max delay
    return Math.min(delayWithJitter, maxDelayMs);
}
/**
 * Execute an async function with retry logic
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the function if successful
 * @throws The last error if all retries fail
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetchData(),
 *   { maxRetries: 3, initialDelayMs: 1000 }
 * );
 * ```
 */
export async function withRetry(fn, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError;
    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            // Check if we've exhausted retries
            if (attempt >= opts.maxRetries) {
                break;
            }
            // Check if error is retryable
            if (!opts.isRetryable(error)) {
                throw error;
            }
            // Calculate delay and wait
            const delayMs = calculateDelay(attempt, opts.initialDelayMs, opts.maxDelayMs, opts.backoffMultiplier);
            // Call onRetry callback
            opts.onRetry(attempt + 1, error, delayMs);
            await sleep(delayMs);
        }
    }
    throw lastError;
}
/**
 * Create a retryable version of an async function
 *
 * @param fn - The async function to wrap
 * @param options - Retry configuration options
 * @returns A wrapped function that will retry on failure
 *
 * @example
 * ```typescript
 * const retryableFetch = retryable(fetchData, { maxRetries: 3 });
 * const result = await retryableFetch();
 * ```
 */
export function retryable(fn, options = {}) {
    return ((...args) => withRetry(() => fn(...args), options));
}
/**
 * Common retry configurations
 */
export const RetryConfigs = {
    /** Fast retry for transient network errors */
    network: {
        maxRetries: 3,
        initialDelayMs: 500,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
    },
    /** Slower retry for installation operations */
    installation: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
        onRetry: (attempt, error, delayMs) => {
            console.warn(`Installation attempt ${attempt} failed, retrying in ${Math.round(delayMs / 1000)}s...`, error instanceof Error ? error.message : String(error));
        },
    },
    /** Quick retry for file operations */
    fileOperation: {
        maxRetries: 2,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        backoffMultiplier: 2,
    },
};
/**
 * Check if an error is likely transient (retryable)
 *
 * @param error - The error to check
 * @returns true if the error is likely transient
 */
export function isTransientError(error) {
    if (!(error instanceof Error)) {
        return false;
    }
    const message = error.message.toLowerCase();
    // Network errors
    if (message.includes("econnreset") ||
        message.includes("econnrefused") ||
        message.includes("etimedout") ||
        message.includes("enotfound") ||
        message.includes("network") ||
        message.includes("socket hang up") ||
        message.includes("timeout")) {
        return true;
    }
    // Temporary file system errors
    if (message.includes("ebusy") ||
        message.includes("eagain") ||
        message.includes("enotempty")) {
        return true;
    }
    // HTTP temporary errors (5xx, 429)
    if (message.includes("500") ||
        message.includes("502") ||
        message.includes("503") ||
        message.includes("504") ||
        message.includes("429") ||
        message.includes("too many requests")) {
        return true;
    }
    return false;
}
