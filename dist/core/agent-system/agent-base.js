import OpenAI from "openai";
import { createAgentResult } from "./agent-protocol.js";
/**
 * Base class for all agents in the multi-agent system
 * Provides common functionality and enforces contract
 */
export class BaseAgent {
    static idCounter = 0;
    id;
    capabilities;
    context;
    client;
    messages = [];
    taskMessages = new Map(); // Per-task message isolation
    constructor(apiKey, capabilities, context, baseURL) {
        this.id = this.generateAgentId();
        this.capabilities = capabilities;
        this.context = context;
        // Initialize OpenAI client
        this.client = new OpenAI({
            apiKey,
            baseURL: baseURL || "https://openrouter.ai/api/v1",
        });
        // Initialize messages with system prompt
        this.messages = [
            {
                role: "system",
                content: capabilities.systemPrompt,
            },
        ];
    }
    /**
     * Generate unique agent ID
     */
    generateAgentId() {
        return `${this.capabilities?.type || "agent"}_${Date.now()}_${BaseAgent.idCounter++}`;
    }
    /**
     * Get agent ID
     */
    getId() {
        return this.id;
    }
    /**
     * Get agent type
     */
    getType() {
        return this.capabilities.type;
    }
    /**
     * Get agent capabilities
     */
    getCapabilities() {
        return this.capabilities;
    }
    /**
     * Get available tools for this agent
     */
    getTools() {
        return this.capabilities.tools;
    }
    /**
     * Check if agent can delegate to other agents
     */
    canDelegate() {
        return this.capabilities.canDelegate;
    }
    /**
     * Initialize per-task message context for concurrent execution
     */
    initTaskContext(taskId) {
        this.taskMessages.set(taskId, [this.messages[0]]); // Copy system prompt
    }
    /**
     * Clean up per-task message context
     */
    cleanupTaskContext(taskId) {
        this.taskMessages.delete(taskId);
    }
    /**
     * Get messages for task (supports concurrent execution)
     */
    getTaskMessages(taskId) {
        return taskId && this.taskMessages.has(taskId)
            ? this.taskMessages.get(taskId)
            : this.messages;
    }
    /**
     * Add user message to conversation
     */
    addUserMessage(content, taskId) {
        this.getTaskMessages(taskId).push({
            role: "user",
            content,
        });
    }
    /**
     * Add assistant message to conversation
     */
    addAssistantMessage(message, taskId) {
        this.getTaskMessages(taskId).push({
            role: "assistant",
            content: message.content || "",
            tool_calls: message.tool_calls,
        });
    }
    /**
     * Add tool result to conversation
     */
    addToolResult(toolCallId, result, taskId) {
        this.getTaskMessages(taskId).push({
            role: "tool",
            tool_call_id: toolCallId,
            content: result,
        });
    }
    /**
     * Create AI completion using OpenAI API
     */
    async createCompletion(options = {}) {
        const request = {
            model: "anthropic/claude-sonnet-4.5",
            messages: this.getTaskMessages(options.taskId),
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 4096,
        };
        if (options.tools && options.tools.length > 0) {
            request.tools = options.tools;
        }
        const completion = await this.client.chat.completions.create(request);
        return completion.choices[0].message;
    }
    /**
     * Execute a tool function
     */
    async executeTool(toolName, args) {
        const tool = this.capabilities.tools.find((t) => t.name === toolName);
        if (!tool) {
            throw new Error(`Tool ${toolName} not found in agent ${this.capabilities.name}`);
        }
        try {
            return await tool.function(args);
        }
        catch (error) {
            throw new Error(`Tool ${toolName} execution failed: ${error}`);
        }
    }
    /**
     * Create a success result
     */
    createSuccessResult(taskId, data, metrics) {
        return createAgentResult(taskId, "success", data, metrics);
    }
    /**
     * Create an error result
     */
    createErrorResult(taskId, error, metrics) {
        return createAgentResult(taskId, "error", null, metrics, error);
    }
    /**
     * Create a partial result
     */
    createPartialResult(taskId, data, error, metrics) {
        return createAgentResult(taskId, "partial", data, metrics, error);
    }
    /**
     * Get message count
     */
    getMessageCount() {
        return this.messages.length;
    }
    /**
     * Clear conversation history (keep system prompt)
     */
    clearMessages() {
        const systemPrompt = this.messages[0];
        this.messages = [systemPrompt];
    }
}
