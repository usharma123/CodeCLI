import { getTokenTracker } from './token-tracker.js';
import OpenAI from 'openai';

export interface ConversationSummary {
  taskDescription: string;
  completedWork: string[];
  currentState: string;
  remainingWork: string[];
  importantContext: string[];
  timestamp: number;
  tokensSaved: number;
}

export interface CompactionConfig {
  maxTokens: number;           // Maximum tokens before triggering compaction
  warningThreshold: number;    // Warn when reaching this % of max tokens
  summaryModel: string;        // Model to use for generating summaries
  preserveMessageCount: number; // Number of recent messages to preserve
  maxCompactionIterations: number; // Maximum iterations for iterative compaction (Bug #32)
  enableTokenVerification: boolean; // Enable token counting verification (Bug #33)
}

export const DEFAULT_COMPACTION_CONFIG: CompactionConfig = {
  maxTokens: 150000,          // Conservative limit (200k max - 50k buffer)
  warningThreshold: 0.75,     // Warn at 75%
  summaryModel: 'minimax/minimax-m2.1',
  preserveMessageCount: 5,     // Keep last 5 exchanges
  maxCompactionIterations: 3,  // Maximum 3 compaction iterations
  enableTokenVerification: false // Token verification off by default
};

// Supported summary models for validation (Bug #28)
const SUPPORTED_MODELS = [
  'minimax/minimax-m2.1',
  'gpt-4',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307'
];

// Error types for better error handling (Bug #30)
export class CompactionError extends Error {
  constructor(
    message: string,
    public readonly type: 'api' | 'parsing' | 'validation' | 'concurrency',
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'CompactionError';
  }
}

export class ContextCompactionManager {
  private config: CompactionConfig;
  private client: OpenAI;
  private totalTokensProcessed: number = 0;
  private compactionCount: number = 0;

  // Concurrency control (Bug #27)
  private isCompacting: boolean = false;
  private compactionQueue: Array<{
    messages: any[];
    resolve: (result: { compactedMessages: any[]; summary: ConversationSummary }) => void;
    reject: (error: Error) => void;
  }> = [];

  // Original messages storage for restoration (Bug #31)
  private originalMessages: Map<number, any[]> = new Map();
  private compactionId: number = 0;

  constructor(client: OpenAI, config: Partial<CompactionConfig> = {}) {
    this.config = { ...DEFAULT_COMPACTION_CONFIG, ...config };
    this.client = client;

    // Validate model configuration (Bug #28)
    this.validateModelConfig();
  }

  /**
   * Validate model configuration (Bug #28)
   */
  private validateModelConfig(): void {
    const model = this.config.summaryModel;

    // Check if it's a known model or follows a valid pattern
    const isKnownModel = SUPPORTED_MODELS.includes(model);
    const isValidPattern = /^[\w\/-]+$/.test(model);

    if (!isKnownModel && !isValidPattern) {
      console.warn(
        `Warning: Summary model "${model}" is not in the list of known models. ` +
        `Supported models: ${SUPPORTED_MODELS.join(', ')}`
      );
    }
  }

  /**
   * Update configuration dynamically (Bug #25 - configurable preservation)
   */
  updateConfig(config: Partial<CompactionConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.summaryModel) {
      this.validateModelConfig();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): CompactionConfig {
    return { ...this.config };
  }

  /**
   * Check if context compaction is needed based on current token usage
   */
  shouldCompact(currentMessages: any[]): {
    shouldCompact: boolean;
    shouldWarn: boolean;
    estimatedTokens: number;
    percentUsed: number;
  } {
    const tokenTracker = getTokenTracker();
    const totalTokens = tokenTracker.getTotalTokens();

    // Estimate tokens in current messages
    const messageTokens = this.estimateMessageTokens(currentMessages);
    const estimatedTotal = totalTokens + messageTokens;

    // Verify token count if enabled (Bug #33)
    if (this.config.enableTokenVerification) {
      this.verifyTokenCount(currentMessages, messageTokens);
    }

    const percentUsed = estimatedTotal / this.config.maxTokens;
    const shouldWarn = percentUsed >= this.config.warningThreshold;
    const shouldCompact = percentUsed >= 0.9; // Compact at 90%

    return {
      shouldCompact,
      shouldWarn,
      estimatedTokens: estimatedTotal,
      percentUsed
    };
  }

  /**
   * Verify token count estimation (Bug #33)
   */
  private async verifyTokenCount(messages: any[], estimated: number): Promise<void> {
    try {
      const tokenTracker = getTokenTracker();
      let actualTokens = 0;

      for (const msg of messages) {
        if (typeof msg.content === 'string') {
          actualTokens += await tokenTracker.countTokens(msg.content);
        } else if (Array.isArray(msg.content)) {
          for (const part of msg.content) {
            if (part.text) {
              actualTokens += await tokenTracker.countTokens(part.text);
            }
          }
        }
      }

      const variance = Math.abs(estimated - actualTokens) / actualTokens;
      if (variance > 0.2) {
        console.warn(
          `Token count variance: estimated=${estimated}, actual=${actualTokens}, variance=${(variance * 100).toFixed(1)}%`
        );
      }
    } catch (error) {
      // Don't fail on verification errors
      console.debug('Token verification failed:', error);
    }
  }

  /**
   * Estimate tokens in messages using a simple heuristic
   * Uses tiktoken when available for better accuracy (Bug #24)
   */
  private estimateMessageTokens(messages: any[]): number {
    const tokenTracker = getTokenTracker();
    let totalTokens = 0;

    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        totalTokens += tokenTracker.estimateTokens(msg.content);
      } else if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.text) {
            totalTokens += tokenTracker.estimateTokens(part.text);
          }
        }
      }

      // Estimate tool calls
      if (msg.tool_calls) {
        for (const toolCall of msg.tool_calls) {
          totalTokens += tokenTracker.estimateTokens(JSON.stringify(toolCall));
        }
      }
    }

    return totalTokens;
  }

  /**
   * Generate a comprehensive summary of the conversation
   */
  async generateSummary(messages: any[]): Promise<ConversationSummary> {
    console.log('\n📊 Generating conversation summary for context compaction...\n');

    // Extract system message and conversation messages
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    // Build summary prompt
    const summaryPrompt = this.buildSummaryPrompt(conversationMessages);

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.summaryModel,
        messages: [
          {
            role: 'system',
            content: 'You are a highly skilled assistant that creates concise, structured summaries of coding conversations. Extract key information while preserving critical context. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: summaryPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      });

      const summaryText = response.choices[0]?.message?.content || '';
      const summary = this.parseSummaryResponse(summaryText);

      // Calculate tokens saved
      const originalTokens = this.estimateMessageTokens(messages);
      const summaryTokens = this.estimateMessageTokens([
        { role: 'system', content: this.formatSummaryForContext(summary) }
      ]);
      summary.tokensSaved = originalTokens - summaryTokens;
      summary.timestamp = Date.now();

      this.compactionCount++;
      this.totalTokensProcessed += originalTokens;

      console.log(`✓ Summary generated: ${summary.tokensSaved.toLocaleString()} tokens saved\n`);

      return summary;
    } catch (error) {
      // Better error handling (Bug #30)
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        throw new CompactionError(
          'Rate limited while generating summary. Please try again later.',
          'api',
          error instanceof Error ? error : undefined
        );
      }

      if (errorMessage.includes('model') || errorMessage.includes('not found')) {
        throw new CompactionError(
          `Summary model "${this.config.summaryModel}" not available. Check your configuration.`,
          'validation',
          error instanceof Error ? error : undefined
        );
      }

      throw new CompactionError(
        `Failed to generate summary: ${errorMessage}`,
        'api',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Build the prompt for summary generation
   */
  private buildSummaryPrompt(messages: any[]): string {
    let prompt = 'Analyze the following conversation and create a structured summary:\n\n';

    // Include conversation history
    for (const msg of messages) {
      if (msg.role === 'user') {
        prompt += `User: ${this.extractMessageContent(msg)}\n\n`;
      } else if (msg.role === 'assistant') {
        const content = this.extractMessageContent(msg);
        const toolCalls = msg.tool_calls ? ` [Called tools: ${msg.tool_calls.map((t: any) => t.function.name).join(', ')}]` : '';
        prompt += `Assistant: ${content}${toolCalls}\n\n`;
      } else if (msg.role === 'tool') {
        const result = msg.content?.substring(0, 200) || '';
        prompt += `Tool Result: ${result}${msg.content.length > 200 ? '...' : ''}\n\n`;
      }
    }

    prompt += `\n\nProvide a summary in the following JSON format (wrap in a code block if needed):
\`\`\`json
{
  "taskDescription": "Brief description of the main task",
  "completedWork": ["List of completed subtasks"],
  "currentState": "Current state of the work",
  "remainingWork": ["List of remaining tasks"],
  "importantContext": ["Key decisions, file paths, configurations, or context to preserve"]
}
\`\`\``;

    return prompt;
  }

  /**
   * Extract content from a message
   */
  private extractMessageContent(msg: any): string {
    if (typeof msg.content === 'string') {
      return msg.content;
    } else if (Array.isArray(msg.content)) {
      return msg.content
        .filter((part: any) => part.text || part.type === 'text')
        .map((part: any) => part.text || '')
        .join('\n');
    }
    return '';
  }

  /**
   * Parse the summary response from the model (Bug #26 - improved robustness)
   */
  private parseSummaryResponse(summaryText: string): ConversationSummary {
    const extractionStrategies = [
      // Strategy 1: Try to extract JSON from markdown code block
      () => {
        const codeBlockMatch = summaryText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          return JSON.parse(codeBlockMatch[1].trim());
        }
        return null;
      },
      // Strategy 2: Try to extract raw JSON object
      () => {
        const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return null;
      },
      // Strategy 3: Try to parse the whole text as JSON
      () => {
        return JSON.parse(summaryText.trim());
      }
    ];

    for (const strategy of extractionStrategies) {
      try {
        const parsed = strategy();
        if (parsed && typeof parsed === 'object') {
          return {
            taskDescription: parsed.taskDescription || 'No description provided',
            completedWork: Array.isArray(parsed.completedWork) ? parsed.completedWork : [],
            currentState: parsed.currentState || 'Unknown state',
            remainingWork: Array.isArray(parsed.remainingWork) ? parsed.remainingWork : [],
            importantContext: Array.isArray(parsed.importantContext) ? parsed.importantContext : [],
            timestamp: Date.now(),
            tokensSaved: 0
          };
        }
      } catch {
        // Try next strategy
        continue;
      }
    }

    console.warn('Failed to parse summary JSON using all strategies, using fallback');

    // Fallback: create a basic summary from the text
    return {
      taskDescription: 'Continuing previous work',
      completedWork: [],
      currentState: summaryText.substring(0, 500),
      remainingWork: [],
      importantContext: [],
      timestamp: Date.now(),
      tokensSaved: 0
    };
  }

  /**
   * Format summary for use as context in new conversation
   */
  formatSummaryForContext(summary: ConversationSummary): string {
    let context = '# Previous Conversation Summary\n\n';
    context += `**Task:** ${summary.taskDescription}\n\n`;

    if (summary.completedWork.length > 0) {
      context += '## Completed Work\n';
      summary.completedWork.forEach(item => {
        context += `- ${item}\n`;
      });
      context += '\n';
    }

    context += `## Current State\n${summary.currentState}\n\n`;

    if (summary.remainingWork.length > 0) {
      context += '## Remaining Work\n';
      summary.remainingWork.forEach(item => {
        context += `- ${item}\n`;
      });
      context += '\n';
    }

    if (summary.importantContext.length > 0) {
      context += '## Important Context\n';
      summary.importantContext.forEach(item => {
        context += `- ${item}\n`;
      });
      context += '\n';
    }

    context += `\n*Summary generated at: ${new Date(summary.timestamp).toISOString()}*\n`;
    context += `*Tokens saved: ${summary.tokensSaved.toLocaleString()}*\n\n`;
    context += '---\n\n';
    context += 'Continue the work based on the above context. The user will provide additional instructions.\n';

    return context;
  }

  /**
   * Compact the conversation with concurrency control (Bug #27)
   */
  async compactConversation(messages: any[]): Promise<{
    compactedMessages: any[];
    summary: ConversationSummary;
    compactionId?: number;
  }> {
    // Check if already compacting
    if (this.isCompacting) {
      // Queue this request
      return new Promise((resolve, reject) => {
        this.compactionQueue.push({ messages, resolve, reject });
      });
    }

    this.isCompacting = true;

    try {
      const result = await this.performCompaction(messages);
      return result;
    } finally {
      this.isCompacting = false;

      // Process queued requests
      if (this.compactionQueue.length > 0) {
        const next = this.compactionQueue.shift()!;
        this.compactConversation(next.messages)
          .then(next.resolve)
          .catch(next.reject);
      }
    }
  }

  /**
   * Perform the actual compaction logic
   */
  private async performCompaction(messages: any[], iteration: number = 0): Promise<{
    compactedMessages: any[];
    summary: ConversationSummary;
    compactionId?: number;
  }> {
    console.log(`\n🔄 Starting context compaction (iteration ${iteration + 1})...\n`);

    // Store original messages for restoration (Bug #31)
    const currentCompactionId = ++this.compactionId;
    this.originalMessages.set(currentCompactionId, [...messages]);

    // Separate system message and conversation
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    // Calculate messages to preserve (Bug #25 - configurable)
    const preserveCount = this.config.preserveMessageCount * 3; // 3 = user + assistant + potential tool

    // Keep the last N exchanges (user + assistant pairs + tool results)
    const recentMessages = conversationMessages.slice(-preserveCount);

    // Messages to summarize (everything except recent)
    const messagesToSummarize = conversationMessages.slice(0, -preserveCount);

    // If nothing to summarize, return original
    if (messagesToSummarize.length === 0) {
      return {
        compactedMessages: messages,
        summary: {
          taskDescription: 'No summarization needed',
          completedWork: [],
          currentState: 'Active conversation',
          remainingWork: [],
          importantContext: [],
          timestamp: Date.now(),
          tokensSaved: 0
        },
        compactionId: currentCompactionId
      };
    }

    // Generate summary
    const summary = await this.generateSummary(messagesToSummarize);

    // Create compacted message history
    const compactedMessages: any[] = [];

    // Add system message
    if (systemMessage) {
      compactedMessages.push(systemMessage);
    }

    // Add summary as a system message
    compactedMessages.push({
      role: 'system',
      content: this.formatSummaryForContext(summary)
    });

    // Add recent messages
    compactedMessages.push(...recentMessages);

    console.log(`✓ Context compacted: ${messages.length} → ${compactedMessages.length} messages\n`);

    // Check if we need another iteration (Bug #32 - iterative compaction)
    const stillNeedsCompaction = this.shouldCompact(compactedMessages);
    if (stillNeedsCompaction.shouldCompact && iteration < this.config.maxCompactionIterations - 1) {
      console.log('⚠️ Still over token limit, performing additional compaction...\n');
      return this.performCompaction(compactedMessages, iteration + 1);
    }

    return {
      compactedMessages,
      summary,
      compactionId: currentCompactionId
    };
  }

  /**
   * Restore original messages from compaction (Bug #31)
   */
  restoreFromCompaction(compactionId: number): any[] | null {
    const original = this.originalMessages.get(compactionId);
    if (original) {
      this.originalMessages.delete(compactionId); // Clean up after restoration
      return original;
    }
    return null;
  }

  /**
   * Clear stored original messages
   */
  clearRestorationData(): void {
    this.originalMessages.clear();
  }

  /**
   * Get compaction statistics
   */
  getStats(): {
    compactionCount: number;
    totalTokensProcessed: number;
    averageTokensPerCompaction: number;
    pendingQueueLength: number;
    storedRestorationPoints: number;
  } {
    return {
      compactionCount: this.compactionCount,
      totalTokensProcessed: this.totalTokensProcessed,
      averageTokensPerCompaction: this.compactionCount > 0
        ? this.totalTokensProcessed / this.compactionCount
        : 0,
      pendingQueueLength: this.compactionQueue.length,
      storedRestorationPoints: this.originalMessages.size
    };
  }
}
