import { BaseAgent } from "./agent-base.js";
import { AgentType } from "../types.js";

/**
 * Agent Manager - Simple registration for exploration agents
 * Manages FileSystemAgent and AnalysisAgent for hybrid architecture
 */
export class AgentManager {
  private agents: Map<AgentType, BaseAgent> = new Map();

  /**
   * Register an agent with the manager
   */
  registerAgent(agent: BaseAgent): void {
    const type = agent.getType();

    if (this.agents.has(type)) {
      console.warn(`Agent ${type} already registered, replacing...`);
    }

    this.agents.set(type, agent);
  }

  /**
   * Get agent by type
   */
  getAgent(type: AgentType): BaseAgent | undefined {
    return this.agents.get(type);
  }

  /**
   * Clear all agents (for testing)
   */
  clearAll(): void {
    this.agents.clear();
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
