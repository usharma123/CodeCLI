import { EventEmitter } from "events";
import { AgentType } from "./types.js";

/**
 * Agent status phases for UI display
 */
export type AgentStatusPhase = "idle" | "thinking" | "running_tools" | "waiting_approval" | "completed" | "error";

/**
 * Agent status event - emitted when agent state changes
 */
export interface AgentStatusEvent {
  agentId: string;
  agentType: AgentType;
  phase: AgentStatusPhase;
  message: string;
  parentAgentId?: string;
  timestamp: number;
}

/**
 * Agent task event - emitted when tasks start/complete/fail
 */
export interface AgentTaskEvent {
  agentId: string;
  agentType: AgentType;
  taskId: string;
  type: "started" | "completed" | "failed";
  taskDescription: string;
  result?: any;
  error?: string;
  timestamp: number;
  metrics?: {
    duration?: number;
    toolCallCount?: number;
    tokensUsed?: number;
  };
}

/**
 * Agent communication event - tracks inter-agent messages
 */
export interface AgentCommunicationEvent {
  fromAgentId: string;
  fromAgentType: AgentType;
  toAgentId: string;
  toAgentType: AgentType;
  type: "delegation" | "result" | "coordination";
  message: string;
  timestamp: number;
}

/**
 * Agent metrics event - performance data
 */
export interface AgentMetricsEvent {
  agentId: string;
  agentType: AgentType;
  metrics: {
    totalTasks: number;
    successfulTasks: number;
    failedTasks: number;
    averageDuration: number;
    totalDuration: number;
    totalToolCalls: number;
    totalTokensUsed: number;
  };
  timestamp: number;
}

/**
 * Agent lifecycle event - registration/unregistration
 */
export interface AgentLifecycleEvent {
  type: "registered" | "unregistered";
  agentId: string;
  agentType: AgentType;
  timestamp: number;
}

/**
 * Central event emitter for multi-agent system
 * Provides real-time updates for UI components
 */
export class AgentEventEmitter extends EventEmitter {
  private statusHistory: Map<string, AgentStatusEvent[]> = new Map();
  private taskHistory: Map<string, AgentTaskEvent[]> = new Map();
  private communicationHistory: AgentCommunicationEvent[] = [];
  private metricsCache: Map<string, AgentMetricsEvent> = new Map();

  private maxHistoryPerAgent: number = 100;
  private maxCommunicationHistory: number = 200;

  constructor() {
    super();
    this.setMaxListeners(50);
  }

  /**
   * Emit agent status change
   */
  emitAgentStatus(event: AgentStatusEvent): void {
    // Store in history
    const history = this.statusHistory.get(event.agentId) || [];
    history.push(event);
    if (history.length > this.maxHistoryPerAgent) {
      history.shift(); // Remove oldest
    }
    this.statusHistory.set(event.agentId, history);

    // Emit events
    this.emit("agent:status", event);
    this.emit(`agent:${event.agentId}:status`, event);
  }

  /**
   * Emit agent task event
   */
  emitTaskEvent(event: AgentTaskEvent): void {
    // Store in history
    const history = this.taskHistory.get(event.agentId) || [];
    history.push(event);
    if (history.length > this.maxHistoryPerAgent) {
      history.shift();
    }
    this.taskHistory.set(event.agentId, history);

    // Emit events
    this.emit("agent:task", event);
    this.emit(`task:${event.taskId}`, event);
    this.emit(`agent:${event.agentId}:task`, event);
  }

  /**
   * Emit agent communication event
   */
  emitCommunication(event: AgentCommunicationEvent): void {
    // Store in history
    this.communicationHistory.push(event);
    if (this.communicationHistory.length > this.maxCommunicationHistory) {
      this.communicationHistory.shift();
    }

    // Emit events
    this.emit("agent:communication", event);
    this.emit(`agent:${event.fromAgentId}:communication`, event);
  }

  /**
   * Emit agent metrics update
   */
  emitMetrics(event: AgentMetricsEvent): void {
    // Cache latest metrics
    this.metricsCache.set(event.agentId, event);

    // Emit event
    this.emit("agent:metrics", event);
    this.emit(`agent:${event.agentId}:metrics`, event);
  }

  /**
   * Emit agent lifecycle event
   */
  emitLifecycle(event: AgentLifecycleEvent): void {
    this.emit("agent:lifecycle", event);
    this.emit(`agent:${event.agentId}:lifecycle`, event);
  }

  /**
   * Get status history for an agent
   */
  getStatusHistory(agentId: string): AgentStatusEvent[] {
    return this.statusHistory.get(agentId) || [];
  }

  /**
   * Get task history for an agent
   */
  getTaskHistory(agentId: string): AgentTaskEvent[] {
    return this.taskHistory.get(agentId) || [];
  }

  /**
   * Get communication history
   */
  getCommunicationHistory(limit?: number): AgentCommunicationEvent[] {
    if (limit) {
      return this.communicationHistory.slice(-limit);
    }
    return [...this.communicationHistory];
  }

  /**
   * Get latest metrics for an agent
   */
  getMetrics(agentId: string): AgentMetricsEvent | undefined {
    return this.metricsCache.get(agentId);
  }

  /**
   * Get current status for an agent
   */
  getCurrentStatus(agentId: string): AgentStatusEvent | undefined {
    const history = this.statusHistory.get(agentId);
    return history ? history[history.length - 1] : undefined;
  }

  /**
   * Get all active agents (agents with recent status)
   */
  getActiveAgents(): string[] {
    const now = Date.now();
    const activeThreshold = 60000; // 60 seconds
    const activeAgents: string[] = [];

    for (const [agentId, history] of this.statusHistory.entries()) {
      const latestStatus = history[history.length - 1];
      if (latestStatus && now - latestStatus.timestamp < activeThreshold) {
        activeAgents.push(agentId);
      }
    }

    return activeAgents;
  }

  /**
   * Clear history for an agent
   */
  clearAgentHistory(agentId: string): void {
    this.statusHistory.delete(agentId);
    this.taskHistory.delete(agentId);
    this.metricsCache.delete(agentId);
  }

  /**
   * Clear all history
   */
  clearAllHistory(): void {
    this.statusHistory.clear();
    this.taskHistory.clear();
    this.communicationHistory = [];
    this.metricsCache.clear();
  }
}

// Global singleton agent event emitter
let agentEventsInstance: AgentEventEmitter | null = null;

/**
 * Get the global agent event emitter
 */
export const getAgentEvents = (): AgentEventEmitter => {
  if (!agentEventsInstance) {
    agentEventsInstance = new AgentEventEmitter();
  }
  return agentEventsInstance;
};

/**
 * Subscribe to agent status events
 */
export const onAgentStatus = (listener: (event: AgentStatusEvent) => void): (() => void) => {
  const emitter = getAgentEvents();
  emitter.on("agent:status", listener);
  return () => emitter.off("agent:status", listener);
};

/**
 * Subscribe to agent task events
 */
export const onAgentTask = (listener: (event: AgentTaskEvent) => void): (() => void) => {
  const emitter = getAgentEvents();
  emitter.on("agent:task", listener);
  return () => emitter.off("agent:task", listener);
};

/**
 * Subscribe to agent communication events
 */
export const onAgentCommunication = (listener: (event: AgentCommunicationEvent) => void): (() => void) => {
  const emitter = getAgentEvents();
  emitter.on("agent:communication", listener);
  return () => emitter.off("agent:communication", listener);
};

/**
 * Subscribe to agent metrics events
 */
export const onAgentMetrics = (listener: (event: AgentMetricsEvent) => void): (() => void) => {
  const emitter = getAgentEvents();
  emitter.on("agent:metrics", listener);
  return () => emitter.off("agent:metrics", listener);
};

/**
 * Subscribe to agent lifecycle events
 */
export const onAgentLifecycle = (listener: (event: AgentLifecycleEvent) => void): (() => void) => {
  const emitter = getAgentEvents();
  emitter.on("agent:lifecycle", listener);
  return () => emitter.off("agent:lifecycle", listener);
};

/**
 * Reset agent events (for testing)
 */
export const resetAgentEvents = (): void => {
  if (agentEventsInstance) {
    agentEventsInstance.clearAllHistory();
    agentEventsInstance.removeAllListeners();
  }
  agentEventsInstance = null;
};
