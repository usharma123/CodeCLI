/**
 * MessageHistoryManager - Manages conversation message history
 *
 * Single Responsibility: Store, trim, and compact message history
 */

import OpenAI from "openai";
import { colors } from "../../utils/colors.js";
import { ContextCompactionManager } from "../context-compaction.js";
import type { ChatMessage, MessageHistoryOptions, IMessageHistoryManager } from "./types.js";

const DEFAULT_OPTIONS: MessageHistoryOptions = {
  maxMessagesInHistory: 40,  // Keep last 40 messages (20 exchanges) plus system prompt
  maxTokenEstimate: 12000    // Leave buffer below 16384 max_tokens
};

export class MessageHistoryManager implements IMessageHistoryManager {
  private messages: ChatMessage[] = [];
  private compactionManager: ContextCompactionManager;
  private options: MessageHistoryOptions;
  private validationFailureCounts: Map<string, number> = new Map();

  constructor(client: OpenAI, options: Partial<MessageHistoryOptions> = {}) {
    this.compactionManager = new ContextCompactionManager(client);
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Add a message to the history
   */
  addMessage(message: ChatMessage): void {
    this.messages.push(message);
  }

  /**
   * Get all messages in the history
   */
  getMessages(): ChatMessage[] {
    return this.messages;
  }

  /**
   * Get the system prompt (first message)
   */
  getSystemPrompt(): ChatMessage | undefined {
    return this.messages.find(m => m.role === "system");
  }

  /**
   * Remove and return the last message
   */
  removeLastMessage(): ChatMessage | undefined {
    return this.messages.pop();
  }

  /**
   * Clear all messages except system prompt
   */
  clear(): void {
    const systemPrompt = this.getSystemPrompt();
    this.messages = systemPrompt ? [systemPrompt] : [];
  }

  /**
   * Estimate token count for messages (rough approximation: 1 token ≈ 4 characters)
   */
  estimateTokens(): number {
    let totalChars = 0;
    for (const msg of this.messages) {
      if (msg.content) {
        totalChars += msg.content.length;
      }
      if (msg.tool_calls) {
        totalChars += JSON.stringify(msg.tool_calls).length;
      }
    }
    return Math.ceil(totalChars / 4);
  }

  /**
   * Trim context window if needed to prevent exceeding token limits
   */
  async trimIfNeeded(): Promise<void> {
    if (this.messages.length <= 1) return; // Keep at least system prompt

    const systemMessage = this.messages[0]; // Preserve system prompt

    // Check if compaction is needed
    const status = this.compactionManager.shouldCompact(this.messages);

    if (status.shouldWarn && !status.shouldCompact) {
      console.log(`${colors.yellow}⚠️  Context usage: ${(status.percentUsed * 100).toFixed(1)}%${colors.reset}`);
    }

    if (status.shouldCompact) {
      try {
        console.log(`${colors.cyan}🔄 Context limit approaching - performing intelligent compaction...${colors.reset}`);

        const { compactedMessages, summary } =
          await this.compactionManager.compactConversation(this.messages);

        this.messages = compactedMessages;

        console.log(`${colors.green}✓ Compaction complete: ${summary.tokensSaved.toLocaleString()} tokens saved${colors.reset}`);
        console.log(`${colors.gray}  Messages: ${status.estimatedTokens.toLocaleString()} → ${this.compactionManager.shouldCompact(this.messages).estimatedTokens.toLocaleString()} tokens${colors.reset}`);
        return;
      } catch (error) {
        console.error(`${colors.red}Failed to compact context, falling back to simple trimming: ${error}${colors.reset}`);
        // Fall through to simple trimming on error
      }
    }

    // Fallback to existing FIFO trimming if under threshold or compaction failed
    if (this.messages.length > this.options.maxMessagesInHistory + 1) {
      // Keep system prompt (first message) and last N messages
      const recentMessages = this.messages.slice(-(this.options.maxMessagesInHistory));
      this.messages = [systemMessage, ...recentMessages];
      console.log(`${colors.gray}  (Trimmed conversation history to last ${this.options.maxMessagesInHistory} messages)${colors.reset}`);
    }

    // Check if we need to trim by token count
    const estimatedTokens = this.estimateTokens();
    if (estimatedTokens > this.options.maxTokenEstimate) {
      // More aggressive trimming - keep system prompt and last 20 messages
      const recentMessages = this.messages.slice(-20);
      this.messages = [systemMessage, ...recentMessages];
      console.log(`${colors.gray}  (Trimmed conversation history due to token limit)${colors.reset}`);
    }

    // Clean up validation failure counts to prevent memory leak
    this.cleanupValidationCounts();
  }

  /**
   * Track validation failure for a tool call signature
   */
  trackValidationFailure(signatureKey: string): number {
    const attempt = (this.validationFailureCounts.get(signatureKey) ?? 0) + 1;
    this.validationFailureCounts.set(signatureKey, attempt);
    return attempt;
  }

  /**
   * Clean up validation failure counts to prevent memory leak
   */
  private cleanupValidationCounts(): void {
    if (this.validationFailureCounts.size > 20) {
      const entries = Array.from(this.validationFailureCounts.entries());
      this.validationFailureCounts.clear();
      // Keep the last 20 entries
      entries.slice(-20).forEach(([key, value]) => {
        this.validationFailureCounts.set(key, value);
      });
    }
  }

  /**
   * Initialize with a system prompt
   */
  setSystemPrompt(content: string): void {
    const existingSystem = this.messages.findIndex(m => m.role === "system");
    const systemMessage: ChatMessage = { role: "system", content };

    if (existingSystem >= 0) {
      this.messages[existingSystem] = systemMessage;
    } else {
      this.messages.unshift(systemMessage);
    }
  }
}
