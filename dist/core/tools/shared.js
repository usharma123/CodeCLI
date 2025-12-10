let agentInstance = null;
export const setAgentInstance = (agent) => {
    agentInstance = agent;
};
export const getAgentInstance = () => {
    if (!agentInstance) {
        throw new Error("Agent not initialized");
    }
    return agentInstance;
};
