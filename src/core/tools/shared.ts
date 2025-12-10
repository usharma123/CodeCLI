import { AIAgent } from "../agent.js";

let agentInstance: AIAgent | null = null;

export const setAgentInstance = (agent: AIAgent | null) => {
  agentInstance = agent;
};

export const getAgentInstance = (): AIAgent => {
  if (!agentInstance) {
    throw new Error("Agent not initialized");
  }
  return agentInstance;
};
