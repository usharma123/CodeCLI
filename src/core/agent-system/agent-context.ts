import { EventEmitter } from "events";
import * as fs from "fs/promises";
import { AgentContext } from "../types.js";

/**
 * Cached file entry with timestamp
 */
interface CachedFile {
  content: string;
  timestamp: number;
  size: number;
}

/**
 * Shared context for agent execution
 * Provides file caching, shared memory, and conversation history
 */
export class SharedContext extends EventEmitter {
  private memory: Map<string, any> = new Map();
  private conversationHistory: any[] = [];
  private fileCache: Map<string, CachedFile> = new Map();
  private workingDirectory: string;
  private maxCacheSize: number = 100; // Max 100 cached files
  private maxFileAge: number = 5000; // 5 seconds default cache TTL

  constructor(workingDirectory: string = process.cwd()) {
    super();
    this.workingDirectory = workingDirectory;
    this.setMaxListeners(20);
  }

  /**
   * Get a cached file or read from disk
   * @param path File path to read
   * @param maxAge Maximum age of cached file in ms (default: 5000ms)
   */
  async getCachedFile(path: string, maxAge: number = this.maxFileAge): Promise<string> {
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
  private async fetchAndCache(path: string): Promise<string> {
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
    } catch (error) {
      throw new Error(`Failed to read file ${path}: ${error}`);
    }
  }

  /**
   * Evict oldest cached file (LRU)
   */
  private evictOldest(): void {
    let oldestPath: string | null = null;
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
  invalidateFile(path: string): void {
    const deleted = this.fileCache.delete(path);
    if (deleted) {
      this.emit("cache:invalidate", { path });
    }
  }

  /**
   * Clear all cached files
   */
  clearFileCache(): void {
    const count = this.fileCache.size;
    this.fileCache.clear();
    this.emit("cache:clear", { count });
  }

  /**
   * Set a context key in shared memory
   * Useful for sharing state between agents
   */
  setContextKey(key: string, value: any): void {
    this.memory.set(key, value);
    this.emit("context:update", { key, value });
  }

  /**
   * Get a context key from shared memory
   */
  getContextKey(key: string): any {
    return this.memory.get(key);
  }

  /**
   * Check if context key exists
   */
  hasContextKey(key: string): boolean {
    return this.memory.has(key);
  }

  /**
   * Delete a context key
   */
  deleteContextKey(key: string): void {
    this.memory.delete(key);
    this.emit("context:delete", { key });
  }

  /**
   * Append a message to conversation history
   * @param message The message to append
   * @param agentId The ID of the agent that created the message
   */
  appendMessage(message: any, agentId: string): void {
    this.conversationHistory.push({ ...message, agentId });
    this.emit("conversation:update", { message, agentId });
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): any[] {
    return [...this.conversationHistory];
  }

  /**
   * Get conversation history for specific agent
   */
  getAgentMessages(agentId: string): any[] {
    return this.conversationHistory.filter((msg) => msg.agentId === agentId);
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(): void {
    const count = this.conversationHistory.length;
    this.conversationHistory = [];
    this.emit("conversation:clear", { count });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    filesInCache: number;
    totalSize: number;
    oldestEntry: number | null;
  } {
    let totalSize = 0;
    let oldestTime: number | null = null;

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
  getMemoryStats(): {
    keysInMemory: number;
    messagesInHistory: number;
  } {
    return {
      keysInMemory: this.memory.size,
      messagesInHistory: this.conversationHistory.length,
    };
  }

  /**
   * Create an AgentContext object for agent initialization
   */
  createAgentContext(parentAgent?: string): AgentContext {
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
  clearAll(): void {
    this.fileCache.clear();
    this.memory.clear();
    this.conversationHistory = [];
    this.removeAllListeners();
  }
}

// Global singleton shared context
let sharedContextInstance: SharedContext | null = null;

/**
 * Get the global shared context
 */
export const getSharedContext = (workingDir?: string): SharedContext => {
  if (!sharedContextInstance) {
    sharedContextInstance = new SharedContext(workingDir);
  }
  return sharedContextInstance;
};

/**
 * Reset shared context (for testing)
 */
export const resetSharedContext = (): void => {
  if (sharedContextInstance) {
    sharedContextInstance.clearAll();
  }
  sharedContextInstance = null;
};
