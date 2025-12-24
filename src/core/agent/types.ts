/**
 * Internal interfaces for the refactored AIAgent architecture
 */

import type { ToolDefinition, TodoItem, TodoState, Plan, PlanState } from "../types.js";

// Re-export commonly used types
export type { ToolDefinition, TodoItem, TodoState, Plan, PlanState };

/**
 * Options for creating an AIAgent
 */
export interface AgentOptions {
  verboseTools?: boolean;
  maxToolOutputChars?: number;
  streamCommandOutput?: boolean;
  streamAssistantResponses?: boolean;
}

/**
 * Chat message format for conversation history
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  reasoning_details?: ReasoningDetail[];
}

/**
 * Tool call structure from API response
 */
export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
  index?: number;
}

/**
 * Reasoning detail from model (OpenRouter extension)
 */
export interface ReasoningDetail {
  type: "reasoning.text" | "reasoning.summary" | "reasoning.encrypted";
  id?: string;
  format?: string;
  index?: number;
  text?: string;
  summary?: string;
  data?: string;
  signature?: string;
}

/**
 * Result from tool execution
 */
export interface ToolCallResult {
  tool_call_id: string;
  role: "tool";
  content: string;
}

/**
 * Result from API completion
 */
export interface CompletionResult {
  message: ChatMessage;
  elapsedSeconds: number;
  streamedContent: string;
  reasoningDetails?: ReasoningDetail[];
}

/**
 * Options for CompletionService
 */
export interface CompletionServiceOptions {
  model: string;
  baseURL: string;
  apiKey: string;
  timeout: number;
  streamAssistantResponses: boolean;
}

/**
 * Request to create a completion
 */
export interface CompletionRequest {
  model: string;
  messages: ChatMessage[];
  tools?: OpenAITool[];
  tool_choice?: "auto" | "none" | "required";
  temperature?: number;
  max_tokens?: number;
  reasoning?: {
    max_tokens?: number;
  };
}

/**
 * OpenAI-format tool definition
 */
export interface OpenAITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

/**
 * Options for MessageHistoryManager
 */
export interface MessageHistoryOptions {
  maxMessagesInHistory: number;
  maxTokenEstimate: number;
}

/**
 * Options for ToolExecutor
 */
export interface ToolExecutorOptions {
  tools: ToolDefinition[];
  verboseTools: boolean;
  maxToolOutputChars: number;
}

/**
 * Options for ToolOutputFormatter
 */
export interface FormatterOptions {
  verboseTools: boolean;
  maxToolOutputChars: number;
}

/**
 * JSON parse result with metadata
 */
export interface ParseResult {
  success: boolean;
  args?: any;
  error?: string;
  wasTruncated?: boolean;
  truncationInfo?: string;
}

/**
 * Tool validation result
 */
export interface ValidationResult {
  valid: boolean;
  issues: string[];
}

/**
 * Dependencies injected into AIAgentCore
 */
export interface AIAgentCoreDependencies {
  completionService: ICompletionService;
  messageHistory: IMessageHistoryManager;
  toolExecutor: IToolExecutor;
  todoManager: ITodoStateManager;
  planManager: IPlanStateManager;
  outputFormatter: IToolOutputFormatter;
}

// Interfaces for dependency injection

export interface ICompletionService {
  createCompletion(request: CompletionRequest): Promise<CompletionResult>;
  resetRetryCount(): void;
  getClient(): any; // OpenAI client
}

export interface IMessageHistoryManager {
  addMessage(message: ChatMessage): void;
  getMessages(): ChatMessage[];
  getSystemPrompt(): ChatMessage | undefined;
  trimIfNeeded(): Promise<void>;
  estimateTokens(): number;
  removeLastMessage(): ChatMessage | undefined;
  clear(): void;
}

export interface IToolExecutor {
  executeToolCalls(toolCalls: ToolCall[]): Promise<ToolCallResult[]>;
  validateToolSchemas(): ValidationResult;
  getTools(): ToolDefinition[];
  getOpenAITools(): OpenAITool[];
}

export interface ITodoStateManager {
  getState(): TodoState;
  getTodos(): TodoItem[];
  updateTodos(todos: TodoItem[]): void;
  getInProgressTodo(): TodoItem | null;
}

export interface IPlanStateManager {
  getState(): PlanState;
  getPlan(): Plan | null;
  getStatus(): PlanState["status"];
  updatePlan(plan: Plan): void;
  clearPlan(): void;
  approve(): TodoItem[];
  reject(): void;
  requestModification(instructions: string): void;
}

export interface IToolOutputFormatter {
  formatForDisplay(functionName: string, args: any, result: string): string;
  truncateText(text: string, maxChars: number): string;
  maybePrintFormattedAfterStream(content: string): void;
  shouldShowOutput(functionName: string): boolean;
  emitOutput(functionName: string, args: any, result: string, displayedResult: string): void;
}
