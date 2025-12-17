import { EventEmitter } from "events";
import {
  AgentTask,
  AgentResult,
  DelegationRequest,
  AgentType,
} from "./types.js";
import { getAgentTimeout } from "./feature-flags.js";

/**
 * Message bus for agent-to-agent communication
 * Uses EventEmitter pattern for async message routing
 */
export class AgentMessageBus extends EventEmitter {
  private tasks: Map<string, AgentTask> = new Map();
  private results: Map<string, AgentResult> = new Map();
  private taskStartTimes: Map<string, number> = new Map();

  constructor() {
    super();
    // Prevent memory leaks from too many listeners
    this.setMaxListeners(50);
  }

  /**
   * Delegate a task to another agent
   * Returns a promise that resolves when the task completes
   */
  async delegateTask(request: DelegationRequest): Promise<AgentResult> {
    this.tasks.set(request.taskId, request.task);
    this.taskStartTimes.set(request.taskId, Date.now());

    return new Promise((resolve, reject) => {
      const timeout = request.task.timeout || getAgentTimeout();

      const timeoutId = setTimeout(() => {
        this.cleanup(request.taskId);
        const elapsed = Date.now() - (this.taskStartTimes.get(request.taskId) || Date.now());
        reject(
          new Error(
            `Task ${request.taskId} (${request.targetAgent}) timed out after ${elapsed}ms`
          )
        );
      }, timeout);

      // Listen for result
      this.once(`result:${request.taskId}`, (result: AgentResult) => {
        clearTimeout(timeoutId);
        this.cleanup(request.taskId);

        if (request.callback) {
          request.callback(result);
        }

        resolve(result);
      });

      // Emit delegation event for target agent
      this.emit("delegate", request);
    });
  }

  /**
   * Publish a task result
   * This completes the delegation promise
   */
  publishResult(result: AgentResult): void {
    this.results.set(result.taskId, result);
    this.emit(`result:${result.taskId}`, result);
    this.emit("result", result); // Global result event
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get result by task ID
   */
  getResult(taskId: string): AgentResult | undefined {
    return this.results.get(taskId);
  }

  /**
   * Get all pending tasks
   */
  getPendingTasks(): AgentTask[] {
    const pending: AgentTask[] = [];
    for (const [taskId, task] of this.tasks.entries()) {
      if (!this.results.has(taskId)) {
        pending.push(task);
      }
    }
    return pending;
  }

  /**
   * Clean up task tracking data
   */
  private cleanup(taskId: string): void {
    this.tasks.delete(taskId);
    this.taskStartTimes.delete(taskId);
    // Keep results for a bit longer for debugging
    setTimeout(() => {
      this.results.delete(taskId);
    }, 60000); // Clear after 1 minute
  }

  /**
   * Get task duration
   */
  getTaskDuration(taskId: string): number {
    const startTime = this.taskStartTimes.get(taskId);
    if (!startTime) return 0;
    return Date.now() - startTime;
  }

  /**
   * Clear all tracked data (for testing)
   */
  clearAll(): void {
    this.tasks.clear();
    this.results.clear();
    this.taskStartTimes.clear();
    this.removeAllListeners();
  }
}

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

// Global singleton message bus
let messageBusInstance: AgentMessageBus | null = null;

/**
 * Get the global agent message bus
 */
export const getMessageBus = (): AgentMessageBus => {
  if (!messageBusInstance) {
    messageBusInstance = new AgentMessageBus();
  }
  return messageBusInstance;
};

/**
 * Reset message bus (for testing)
 */
export const resetMessageBus = (): void => {
  if (messageBusInstance) {
    messageBusInstance.clearAll();
  }
  messageBusInstance = null;
};
