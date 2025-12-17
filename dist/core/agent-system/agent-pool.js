import { getMaxConcurrentAgents } from "../feature-flags.js";
/**
 * Agent pool for managing concurrent agent executions
 * Implements a semaphore pattern to limit concurrent API calls
 */
export class AgentPool {
    activeRequests = 0;
    maxConcurrent;
    requestQueue = [];
    constructor(maxConcurrent) {
        this.maxConcurrent = maxConcurrent || getMaxConcurrentAgents();
    }
    /**
     * Execute a function with concurrency control
     * Waits in queue if max concurrent limit is reached
     */
    async execute(fn) {
        // Wait if at capacity
        if (this.activeRequests >= this.maxConcurrent) {
            await new Promise((resolve) => {
                this.requestQueue.push(resolve);
            });
        }
        this.activeRequests++;
        try {
            return await fn();
        }
        finally {
            this.activeRequests--;
            // Release next queued request
            const next = this.requestQueue.shift();
            if (next) {
                next();
            }
        }
    }
    /**
     * Get current pool statistics
     */
    getStats() {
        return {
            activeRequests: this.activeRequests,
            queuedRequests: this.requestQueue.length,
            maxConcurrent: this.maxConcurrent,
            utilization: this.activeRequests / this.maxConcurrent,
        };
    }
    /**
     * Check if pool is at capacity
     */
    isAtCapacity() {
        return this.activeRequests >= this.maxConcurrent;
    }
    /**
     * Get available slots
     */
    getAvailableSlots() {
        return Math.max(0, this.maxConcurrent - this.activeRequests);
    }
}
// Global singleton agent pool
let agentPoolInstance = null;
/**
 * Get the global agent pool
 */
export const getAgentPool = () => {
    if (!agentPoolInstance) {
        agentPoolInstance = new AgentPool();
    }
    return agentPoolInstance;
};
/**
 * Reset agent pool (for testing)
 */
export const resetAgentPool = () => {
    agentPoolInstance = null;
};
