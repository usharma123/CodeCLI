import { EventEmitter } from "events";
import * as fs from "fs/promises";
/**
 * Shared context for agent execution
 * Provides file caching, shared memory, and conversation history
 */
export class SharedContext extends EventEmitter {
    memory = new Map();
    conversationHistory = [];
    fileCache = new Map();
    workingDirectory;
    maxCacheSize = 100; // Max 100 cached files
    maxFileAge = 5000; // 5 seconds default cache TTL
    constructor(workingDirectory = process.cwd()) {
        super();
        this.workingDirectory = workingDirectory;
        this.setMaxListeners(20);
    }
    /**
     * Get a cached file or read from disk
     * @param path File path to read
     * @param maxAge Maximum age of cached file in ms (default: 5000ms)
     */
    async getCachedFile(path, maxAge = this.maxFileAge) {
        const cached = this.fileCache.get(path);
        // Return cached if fresh and update access time for LRU
        if (cached && Date.now() - cached.timestamp < maxAge) {
            const age = Date.now() - cached.timestamp;
            cached.timestamp = Date.now();
            this.emit("cache:hit", { path, age });
            return cached.content;
        }
        // Cache miss or stale - read from disk
        this.emit("cache:miss", { path, reason: cached ? "stale" : "not-cached" });
        return await this.fetchAndCache(path);
    }
    /**
     * Fetch file from disk and cache it
     */
    async fetchAndCache(path) {
        try {
            const content = await fs.readFile(path, "utf-8");
            const size = Buffer.byteLength(content, "utf-8");
            // Evict old entries if cache is full
            if (this.fileCache.size >= this.maxCacheSize) {
                this.evictOldest();
            }
            this.fileCache.set(path, {
                content,
                timestamp: Date.now(),
                size,
            });
            this.emit("cache:update", { path, size });
            return content;
        }
        catch (error) {
            throw new Error(`Failed to read file ${path}: ${error}`);
        }
    }
    /**
     * Evict oldest cached file (LRU)
     */
    evictOldest() {
        let oldestPath = null;
        let oldestTime = Infinity;
        for (const [path, entry] of this.fileCache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestPath = path;
            }
        }
        if (oldestPath) {
            this.fileCache.delete(oldestPath);
            this.emit("cache:evict", { path: oldestPath });
        }
    }
    /**
     * Invalidate cached file (e.g., after write)
     */
    invalidateFile(path) {
        const deleted = this.fileCache.delete(path);
        if (deleted) {
            this.emit("cache:invalidate", { path });
        }
    }
    /**
     * Clear all cached files
     */
    clearFileCache() {
        const count = this.fileCache.size;
        this.fileCache.clear();
        this.emit("cache:clear", { count });
    }
    /**
     * Set a context key in shared memory
     * Useful for sharing state between agents
     */
    setContextKey(key, value) {
        this.memory.set(key, value);
        this.emit("context:update", { key, value });
    }
    /**
     * Get a context key from shared memory
     */
    getContextKey(key) {
        return this.memory.get(key);
    }
    /**
     * Check if context key exists
     */
    hasContextKey(key) {
        return this.memory.has(key);
    }
    /**
     * Delete a context key
     */
    deleteContextKey(key) {
        this.memory.delete(key);
        this.emit("context:delete", { key });
    }
    /**
     * Append a message to conversation history
     * @param message The message to append
     * @param agentId The ID of the agent that created the message
     */
    appendMessage(message, agentId) {
        this.conversationHistory.push({ ...message, agentId });
        this.emit("conversation:update", { message, agentId });
    }
    /**
     * Get conversation history
     */
    getConversationHistory() {
        return [...this.conversationHistory];
    }
    /**
     * Get conversation history for specific agent
     */
    getAgentMessages(agentId) {
        return this.conversationHistory.filter((msg) => msg.agentId === agentId);
    }
    /**
     * Clear conversation history
     */
    clearConversationHistory() {
        const count = this.conversationHistory.length;
        this.conversationHistory = [];
        this.emit("conversation:clear", { count });
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        let totalSize = 0;
        let oldestTime = null;
        for (const entry of this.fileCache.values()) {
            totalSize += entry.size;
            if (oldestTime === null || entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
            }
        }
        return {
            filesInCache: this.fileCache.size,
            totalSize,
            oldestEntry: oldestTime,
        };
    }
    /**
     * Get memory statistics
     */
    getMemoryStats() {
        return {
            keysInMemory: this.memory.size,
            messagesInHistory: this.conversationHistory.length,
        };
    }
    /**
     * Create an AgentContext object for agent initialization
     */
    createAgentContext(parentAgent) {
        return {
            conversationHistory: this.getConversationHistory(),
            workingDirectory: this.workingDirectory,
            parentAgent,
            sharedMemory: this.memory,
        };
    }
    /**
     * Clear all data (for testing)
     */
    clearAll() {
        this.fileCache.clear();
        this.memory.clear();
        this.conversationHistory = [];
        this.removeAllListeners();
    }
}
// Global singleton shared context
let sharedContextInstance = null;
/**
 * Get the global shared context
 */
export const getSharedContext = (workingDir) => {
    if (!sharedContextInstance) {
        sharedContextInstance = new SharedContext(workingDir);
    }
    return sharedContextInstance;
};
/**
 * Reset shared context (for testing)
 */
export const resetSharedContext = () => {
    if (sharedContextInstance) {
        sharedContextInstance.clearAll();
    }
    sharedContextInstance = null;
};
