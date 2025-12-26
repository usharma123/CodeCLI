import OpenAI from "openai";
import {
  AgentCapabilities,
  AgentContext,
  AgentTask,
  AgentResult,
  AgentType,
  ToolDefinition,
} from "../types.js";
import { createAgentResult } from "./agent-protocol.js";

/**
 * Base class for all agents in the multi-agent system
 * Provides common functionality and enforces contract
 */
export abstract class BaseAgent {
  private static idCounter = 0;
  protected id: string;
  protected capabilities: AgentCapabilities;
  protected context: AgentContext;
  protected client: OpenAI;
  protected messages: any[] = [];
  private taskMessages: Map<string, any[]> = new Map(); // Per-task message isolation

  constructor(
    apiKey: string,
    capabilities: AgentCapabilities,
    context: AgentContext,
    baseURL?: string
  ) {
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
  private generateAgentId(): string {
    return `${this.capabilities?.type || "agent"}_${Date.now()}_${BaseAgent.idCounter++}`;
  }

  /**
   * Execute a task assigned to this agent
   * Must be implemented by subclasses
   */
  abstract executeTask(task: AgentTask): Promise<AgentResult>;

  /**
   * Check if this agent can handle a given task
   * Used by agent manager for auto-routing
   */
  abstract canHandle(task: AgentTask): boolean;

  /**
   * Get agent ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get agent type
   */
  getType(): AgentType {
    return this.capabilities.type;
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): AgentCapabilities {
    return this.capabilities;
  }

  /**
   * Get available tools for this agent
   */
  getTools(): ToolDefinition[] {
    return this.capabilities.tools;
  }

  /**
   * Check if agent can delegate to other agents
   */
  canDelegate(): boolean {
    return this.capabilities.canDelegate;
  }

  /**
   * Initialize per-task message context for concurrent execution
   */
  protected initTaskContext(taskId: string): void {
    this.taskMessages.set(taskId, [this.messages[0]]); // Copy system prompt
  }

  /**
   * Clean up per-task message context
   */
  protected cleanupTaskContext(taskId: string): void {
    this.taskMessages.delete(taskId);
  }

  /**
   * Get messages for task (supports concurrent execution)
   */
  protected getTaskMessages(taskId?: string): any[] {
    return taskId && this.taskMessages.has(taskId)
      ? this.taskMessages.get(taskId)!
      : this.messages;
  }

  /**
   * Add user message to conversation
   */
  protected addUserMessage(content: string, taskId?: string): void {
    this.getTaskMessages(taskId).push({
      role: "user",
      content,
    });
  }

  /**
   * Add assistant message to conversation
   */
  protected addAssistantMessage(message: any, taskId?: string): void {
    this.getTaskMessages(taskId).push({
      role: "assistant",
      content: message.content || "",
      tool_calls: message.tool_calls,
    });
  }

  /**
   * Add tool result to conversation
   */
  protected addToolResult(toolCallId: string, result: string, taskId?: string): void {
    this.getTaskMessages(taskId).push({
      role: "tool",
      tool_call_id: toolCallId,
      content: result,
    });
  }

  /**
   * Create AI completion using OpenAI API
   */
  protected async createCompletion(options: {
    tools?: any[];
    temperature?: number;
    maxTokens?: number;
    taskId?: string;
  } = {}): Promise<any> {
    const request: any = {
      model: "anthropic/claude-sonnet-4.5",
      messages: this.getTaskMessages(options.taskId),
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4096,
    };

    if (options.tools && options.tools.length > 0) {
      request.tools = options.tools;
    }

    const completion = await this.client.chat.completions.create(request);
    
    // Validate response - API may return undefined on context overflow or errors
    if (!completion) {
      const estimatedTokens = this.estimateRequestTokens(request.messages);
      throw new Error(
        `API returned undefined response. This may indicate context limit exceeded. ` +
        `Estimated request tokens: ${estimatedTokens.toLocaleString()}`
      );
    }
    
    if (!completion.choices || completion.choices.length === 0) {
      throw new Error(
        `API returned empty choices array. Response: ${JSON.stringify(completion, null, 2)}`
      );
    }
    
    const message = completion.choices[0].message;
    if (!message) {
      throw new Error(
        `API returned null message in choices[0]. Response: ${JSON.stringify(completion, null, 2)}`
      );
    }
    
    return message;
  }

  /**
   * Estimate tokens in messages for diagnostic purposes
   */
  private estimateRequestTokens(messages: any[]): number {
    let totalChars = 0;
    
    for (const msg of messages) {
      if (typeof msg.content === "string") {
        totalChars += msg.content.length;
      } else if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === "text" && part.text) {
            totalChars += part.text.length;
          }
        }
      }
    }
    
    // Rough estimate: ~4 chars per token
    return Math.ceil(totalChars / 4);
  }

  /**
   * Execute a tool function
   */
  protected async executeTool(
    toolName: string,
    args: any
  ): Promise<string> {
    const tool = this.capabilities.tools.find((t) => t.name === toolName);

    if (!tool) {
      throw new Error(`Tool ${toolName} not found in agent ${this.capabilities.name}`);
    }

    try {
      return await tool.function(args);
    } catch (error) {
      throw new Error(`Tool ${toolName} execution failed: ${error}`);
    }
  }

  /**
   * Create a success result
   */
  protected createSuccessResult(
    taskId: string,
    data: any,
    metrics: {
      duration: number;
      toolCallCount?: number;
      tokensUsed?: number;
    }
  ): AgentResult {
    return createAgentResult(taskId, "success", data, metrics);
  }

  /**
   * Create an error result
   */
  protected createErrorResult(
    taskId: string,
    error: string,
    metrics: {
      duration: number;
      toolCallCount?: number;
      tokensUsed?: number;
    }
  ): AgentResult {
    return createAgentResult(taskId, "error", null, metrics, error);
  }

  /**
   * Create a partial result
   */
  protected createPartialResult(
    taskId: string,
    data: any,
    error: string,
    metrics: {
      duration: number;
      toolCallCount?: number;
      tokensUsed?: number;
    }
  ): AgentResult {
    return createAgentResult(taskId, "partial", data, metrics, error);
  }

  /**
   * Get message count
   */
  getMessageCount(): number {
    return this.messages.length;
  }

  /**
   * Clear conversation history (keep system prompt)
   */
  clearMessages(): void {
    const systemPrompt = this.messages[0];
    this.messages = [systemPrompt];
  }
}
