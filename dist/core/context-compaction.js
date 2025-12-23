import { getTokenTracker } from './token-tracker.js';
export const DEFAULT_COMPACTION_CONFIG = {
    maxTokens: 150000, // Conservative limit (200k max - 50k buffer)
    warningThreshold: 0.75, // Warn at 75%
    summaryModel: 'minimax/minimax-m2.1',
    preserveMessageCount: 5 // Keep last 5 exchanges
};
export class ContextCompactionManager {
    config;
    client;
    totalTokensProcessed = 0;
    compactionCount = 0;
    constructor(client, config = {}) {
        this.config = { ...DEFAULT_COMPACTION_CONFIG, ...config };
        this.client = client;
    }
    /**
     * Check if context compaction is needed based on current token usage
     */
    shouldCompact(currentMessages) {
        const tokenTracker = getTokenTracker();
        const totalTokens = tokenTracker.getTotalTokens();
        // Estimate tokens in current messages
        const messageTokens = this.estimateMessageTokens(currentMessages);
        const estimatedTotal = totalTokens + messageTokens;
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
     * Estimate tokens in messages using a simple heuristic
     */
    estimateMessageTokens(messages) {
        const tokenTracker = getTokenTracker();
        let totalTokens = 0;
        for (const msg of messages) {
            if (typeof msg.content === 'string') {
                totalTokens += tokenTracker.estimateTokens(msg.content);
            }
            else if (Array.isArray(msg.content)) {
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
    async generateSummary(messages) {
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
                        content: 'You are a highly skilled assistant that creates concise, structured summaries of coding conversations. Extract key information while preserving critical context.'
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
        }
        catch (error) {
            console.error('Failed to generate summary:', error);
            throw error;
        }
    }
    /**
     * Build the prompt for summary generation
     */
    buildSummaryPrompt(messages) {
        let prompt = 'Analyze the following conversation and create a structured summary:\n\n';
        // Include conversation history
        for (const msg of messages) {
            if (msg.role === 'user') {
                prompt += `User: ${this.extractMessageContent(msg)}\n\n`;
            }
            else if (msg.role === 'assistant') {
                const content = this.extractMessageContent(msg);
                const toolCalls = msg.tool_calls ? ` [Called tools: ${msg.tool_calls.map((t) => t.function.name).join(', ')}]` : '';
                prompt += `Assistant: ${content}${toolCalls}\n\n`;
            }
            else if (msg.role === 'tool') {
                const result = msg.content?.substring(0, 200) || '';
                prompt += `Tool Result: ${result}${msg.content.length > 200 ? '...' : ''}\n\n`;
            }
        }
        prompt += `\n\nProvide a summary in the following JSON format:
{
  "taskDescription": "Brief description of the main task",
  "completedWork": ["List of completed subtasks"],
  "currentState": "Current state of the work",
  "remainingWork": ["List of remaining tasks"],
  "importantContext": ["Key decisions, file paths, configurations, or context to preserve"]
}`;
        return prompt;
    }
    /**
     * Extract content from a message
     */
    extractMessageContent(msg) {
        if (typeof msg.content === 'string') {
            return msg.content;
        }
        else if (Array.isArray(msg.content)) {
            return msg.content
                .filter((part) => part.text || part.type === 'text')
                .map((part) => part.text || '')
                .join('\n');
        }
        return '';
    }
    /**
     * Parse the summary response from the model
     */
    parseSummaryResponse(summaryText) {
        try {
            // Try to extract JSON from the response
            const jsonMatch = summaryText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
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
        }
        catch (error) {
            console.warn('Failed to parse summary JSON, using fallback');
        }
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
    formatSummaryForContext(summary) {
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
     * Compact the conversation by preserving system message, summary, and recent messages
     */
    async compactConversation(messages) {
        console.log('\n🔄 Starting context compaction...\n');
        // Separate system message and conversation
        const systemMessage = messages.find(m => m.role === 'system');
        const conversationMessages = messages.filter(m => m.role !== 'system');
        // Keep the last N exchanges (user + assistant pairs + tool results)
        const recentMessages = conversationMessages.slice(-this.config.preserveMessageCount * 3);
        // Messages to summarize (everything except recent)
        const messagesToSummarize = conversationMessages.slice(0, -this.config.preserveMessageCount * 3);
        // Generate summary
        const summary = await this.generateSummary(messagesToSummarize);
        // Create compacted message history
        const compactedMessages = [];
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
        return {
            compactedMessages,
            summary
        };
    }
    /**
     * Get compaction statistics
     */
    getStats() {
        return {
            compactionCount: this.compactionCount,
            totalTokensProcessed: this.totalTokensProcessed,
            averageTokensPerCompaction: this.compactionCount > 0
                ? this.totalTokensProcessed / this.compactionCount
                : 0
        };
    }
}
