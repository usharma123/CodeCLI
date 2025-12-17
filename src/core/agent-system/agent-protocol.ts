import {
  AgentTask,
  AgentResult,
  AgentType,
} from "../types.js";

/**
 * Generate unique task ID
 */
export const generateTaskId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Create a standard AgentTask
 */
export const createAgentTask = (
  type: AgentType | string,
  description: string,
  context: Record<string, any> = {},
  options: {
    priority?: "low" | "normal" | "high";
    timeout?: number;
    dependencies?: string[];
  } = {}
): AgentTask => {
  return {
    id: generateTaskId(),
    type,
    description,
    context,
    priority: options.priority || "normal",
    timeout: options.timeout,
    dependencies: options.dependencies,
  };
};

/**
 * Create a standard AgentResult
 */
export const createAgentResult = (
  taskId: string,
  status: "success" | "error" | "partial",
  data: any,
  metrics: {
    duration: number;
    toolCallCount?: number;
    tokensUsed?: number;
  },
  error?: string
): AgentResult => {
  return {
    taskId,
    status,
    data,
    error,
    metrics: {
      duration: metrics.duration,
      toolCallCount: metrics.toolCallCount || 0,
      tokensUsed: metrics.tokensUsed || 0,
    },
  };
};
