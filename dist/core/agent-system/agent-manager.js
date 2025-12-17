/**
 * Agent Manager - Simple registration for exploration agents
 * Manages FileSystemAgent and AnalysisAgent for hybrid architecture
 */
export class AgentManager {
    agents = new Map();
    /**
     * Register an agent with the manager
     */
    registerAgent(agent) {
        const type = agent.getType();
        if (this.agents.has(type)) {
            console.warn(`Agent ${type} already registered, replacing...`);
        }
        this.agents.set(type, agent);
    }
    /**
     * Get agent by type
     */
    getAgent(type) {
        return this.agents.get(type);
    }
    /**
     * Clear all agents (for testing)
     */
    clearAll() {
        this.agents.clear();
    }
}
// Global singleton agent manager
let agentManagerInstance = null;
/**
 * Get the global agent manager
 */
export const getAgentManager = () => {
    if (!agentManagerInstance) {
        agentManagerInstance = new AgentManager();
    }
    return agentManagerInstance;
};
/**
 * Reset agent manager (for testing)
 */
export const resetAgentManager = () => {
    if (agentManagerInstance) {
        agentManagerInstance.clearAll();
    }
    agentManagerInstance = null;
};
