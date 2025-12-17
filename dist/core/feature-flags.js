/**
 * Feature flags for gradual rollout of multi-agent functionality
 *
 * Environment variables:
 * - ENABLE_SUB_AGENTS: Enable multi-agent delegation (default: false for safety)
 * - ENABLE_PARALLEL_TOOLS: Enable parallel tool execution (default: false)
 * - ENABLE_AGENT_METRICS: Show agent performance metrics (default: false)
 * - MAX_CONCURRENT_AGENTS: Maximum concurrent agents (default: 3)
 * - AGENT_TIMEOUT_MS: Timeout per agent task in milliseconds (default: 60000)
 * - MAX_DELEGATION_DEPTH: Maximum delegation depth to prevent loops (default: 3)
 */
const parseBoolean = (value, defaultValue) => {
    if (value === undefined)
        return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
};
const parseInt = (value, defaultValue) => {
    if (value === undefined)
        return defaultValue;
    const parsed = Number.parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};
/**
 * Global feature flags configuration
 * Set via environment variables for gradual rollout
 */
export const FeatureFlags = {
    // Sub-agent delegation (disabled by default for safety)
    ENABLE_SUB_AGENTS: parseBoolean(process.env.ENABLE_SUB_AGENTS, false),
    // Parallel tool execution (disabled by default)
    ENABLE_PARALLEL_TOOLS: parseBoolean(process.env.ENABLE_PARALLEL_TOOLS, false),
    // Agent performance metrics in UI (disabled by default)
    ENABLE_AGENT_METRICS: parseBoolean(process.env.ENABLE_AGENT_METRICS, false),
    // Maximum number of concurrent agents
    MAX_CONCURRENT_AGENTS: parseInt(process.env.MAX_CONCURRENT_AGENTS, 3),
    // Timeout per agent task (60 seconds)
    AGENT_TIMEOUT_MS: parseInt(process.env.AGENT_TIMEOUT_MS, 60000),
    // Maximum delegation depth to prevent circular delegation
    MAX_DELEGATION_DEPTH: parseInt(process.env.MAX_DELEGATION_DEPTH, 3),
};
/**
 * Check if sub-agent features are enabled
 */
export const isSubAgentsEnabled = () => {
    return FeatureFlags.ENABLE_SUB_AGENTS;
};
/**
 * Check if parallel tool execution is enabled
 */
export const isParallelToolsEnabled = () => {
    return FeatureFlags.ENABLE_PARALLEL_TOOLS;
};
/**
 * Check if agent metrics should be displayed
 */
export const isAgentMetricsEnabled = () => {
    return FeatureFlags.ENABLE_AGENT_METRICS;
};
/**
 * Get maximum concurrent agents allowed
 */
export const getMaxConcurrentAgents = () => {
    return FeatureFlags.MAX_CONCURRENT_AGENTS;
};
/**
 * Get agent timeout in milliseconds
 */
export const getAgentTimeout = () => {
    return FeatureFlags.AGENT_TIMEOUT_MS;
};
/**
 * Get maximum delegation depth
 */
export const getMaxDelegationDepth = () => {
    return FeatureFlags.MAX_DELEGATION_DEPTH;
};
