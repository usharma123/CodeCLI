import { EventEmitter } from "events";
import { BaseAgent } from "./agent-base.js";
import {
  AgentType,
  AgentTask,
  AgentResult,
  DelegationRequest,
} from "./types.js";
import { getMessageBus } from "./agent-protocol.js";
import {
  isSubAgentsEnabled,
  getMaxDelegationDepth,
  getMaxConcurrentAgents,
} from "./feature-flags.js";

/**
 * Agent Manager - Central coordinator for multi-agent system
 * Handles agent registration, delegation routing, and lifecycle management
 */
export class AgentManager extends EventEmitter {
  private agents: Map<AgentType, BaseAgent> = new Map();
  private delegationDepth: Map<string, number> = new Map();
  private activeDelegations: number = 0;

  constructor() {
    super();
    this.setMaxListeners(50);

    // Listen to delegation events from message bus
    const messageBus = getMessageBus();
    messageBus.on("delegate", this.handleDelegation.bind(this));
  }

  /**
   * Register an agent with the manager
   */
  registerAgent(agent: BaseAgent): void {
    const type = agent.getType();

    if (this.agents.has(type)) {
      console.warn(`Agent ${type} already registered, replacing...`);
    }

    this.agents.set(type, agent);
    this.emit("agent:registered", {
      type,
      agentId: agent.getId(),
      capabilities: agent.getCapabilities(),
    });
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(type: AgentType): void {
    const agent = this.agents.get(type);
    if (agent) {
      this.agents.delete(type);
      this.emit("agent:unregistered", {
        type,
        agentId: agent.getId(),
      });
    }
  }

  /**
   * Get agent by type
   */
  getAgent(type: AgentType): BaseAgent | undefined {
    return this.agents.get(type);
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Check if an agent type is registered
   */
  hasAgent(type: AgentType): boolean {
    return this.agents.has(type);
  }

  /**
   * Delegate a task to a specific agent
   * Main entry point for task delegation
   */
  async delegate(request: DelegationRequest): Promise<AgentResult> {
    // Check if sub-agents are enabled
    if (!isSubAgentsEnabled()) {
      return {
        taskId: request.taskId,
        status: "error",
        data: null,
        error: "Sub-agent delegation is disabled. Set ENABLE_SUB_AGENTS=true",
        metrics: {
          duration: 0,
          toolCallCount: 0,
          tokensUsed: 0,
        },
      };
    }

    // Check delegation depth
    const depth = this.delegationDepth.get(request.taskId) || 0;
    if (depth >= getMaxDelegationDepth()) {
      return {
        taskId: request.taskId,
        status: "error",
        data: null,
        error: `Max delegation depth (${getMaxDelegationDepth()}) exceeded`,
        metrics: {
          duration: 0,
          toolCallCount: 0,
          tokensUsed: 0,
        },
      };
    }

    // Check concurrent agents limit
    if (this.activeDelegations >= getMaxConcurrentAgents()) {
      return {
        taskId: request.taskId,
        status: "error",
        data: null,
        error: `Max concurrent agents (${getMaxConcurrentAgents()}) reached`,
        metrics: {
          duration: 0,
          toolCallCount: 0,
          tokensUsed: 0,
        },
      };
    }

    // Get target agent
    const targetAgent = this.agents.get(request.targetAgent);
    if (!targetAgent) {
      return {
        taskId: request.taskId,
        status: "error",
        data: null,
        error: `Agent ${request.targetAgent} not registered`,
        metrics: {
          duration: 0,
          toolCallCount: 0,
          tokensUsed: 0,
        },
      };
    }

    // Track delegation
    this.delegationDepth.set(request.taskId, depth + 1);
    this.activeDelegations++;

    this.emit("delegation:started", {
      taskId: request.taskId,
      targetAgent: request.targetAgent,
      depth: depth + 1,
    });

    try {
      // Execute task
      const startTime = Date.now();
      const result = await targetAgent.executeTask(request.task);

      this.emit("delegation:completed", {
        taskId: request.taskId,
        targetAgent: request.targetAgent,
        result,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      const errorResult: AgentResult = {
        taskId: request.taskId,
        status: "error",
        data: null,
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          duration: 0,
          toolCallCount: 0,
          tokensUsed: 0,
        },
      };

      this.emit("delegation:error", {
        taskId: request.taskId,
        targetAgent: request.targetAgent,
        error: errorResult.error,
      });

      return errorResult;
    } finally {
      // Clean up tracking
      this.delegationDepth.delete(request.taskId);
      this.activeDelegations--;
    }
  }

  /**
   * Auto-route task to best agent (hybrid approach)
   * Used when agent type is not explicitly specified
   */
  async autoRoute(task: AgentTask): Promise<AgentResult> {
    // Find best agent for task
    const candidateAgents: BaseAgent[] = [];

    for (const agent of this.agents.values()) {
      if (agent.canHandle(task)) {
        candidateAgents.push(agent);
      }
    }

    if (candidateAgents.length === 0) {
      return {
        taskId: task.id,
        status: "error",
        data: null,
        error: `No agent found to handle task: ${task.description}`,
        metrics: {
          duration: 0,
          toolCallCount: 0,
          tokensUsed: 0,
        },
      };
    }

    // Use first candidate (in future: could use more sophisticated selection)
    const selectedAgent = candidateAgents[0];

    this.emit("auto-route", {
      taskId: task.id,
      selectedAgent: selectedAgent.getType(),
      candidates: candidateAgents.map((a) => a.getType()),
    });

    return await this.delegate({
      taskId: task.id,
      targetAgent: selectedAgent.getType(),
      task,
    });
  }

  /**
   * Handle delegation request from message bus
   */
  private async handleDelegation(request: DelegationRequest): Promise<void> {
    const result = await this.delegate(request);
    const messageBus = getMessageBus();
    messageBus.publishResult(result);
  }

  /**
   * Get active delegation count
   */
  getActiveDelegationCount(): number {
    return this.activeDelegations;
  }

  /**
   * Get delegation statistics
   */
  getStats(): {
    registeredAgents: number;
    activeDelegations: number;
    agentTypes: AgentType[];
  } {
    return {
      registeredAgents: this.agents.size,
      activeDelegations: this.activeDelegations,
      agentTypes: Array.from(this.agents.keys()),
    };
  }

  /**
   * Clear all agents (for testing)
   */
  clearAll(): void {
    this.agents.clear();
    this.delegationDepth.clear();
    this.activeDelegations = 0;
    this.removeAllListeners();
  }
}

// Global singleton agent manager
let agentManagerInstance: AgentManager | null = null;

/**
 * Get the global agent manager
 */
export const getAgentManager = (): AgentManager => {
  if (!agentManagerInstance) {
    agentManagerInstance = new AgentManager();
  }
  return agentManagerInstance;
};

/**
 * Reset agent manager (for testing)
 */
export const resetAgentManager = (): void => {
  if (agentManagerInstance) {
    agentManagerInstance.clearAll();
  }
  agentManagerInstance = null;
};
