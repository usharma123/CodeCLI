/**
 * Feature flags for hybrid agent system
 *
 * Environment variables:
 * - ENABLE_SUB_AGENTS: Enable exploration agents (FileSystem, Analysis) (default: false for safety)
 * - MAX_CONCURRENT_AGENTS: Maximum concurrent agents (default: 3)
 */

export interface FeatureFlagsConfig {
  ENABLE_SUB_AGENTS: boolean;
  MAX_CONCURRENT_AGENTS: number;
}

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};

const parseIntValue = (value: string | undefined, defaultValue: number): number => {
  if (value === undefined) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Global feature flags configuration
 * Set via environment variables for gradual rollout
 */
export const FeatureFlags: FeatureFlagsConfig = {
  // Exploration agents (disabled by default for safety)
  ENABLE_SUB_AGENTS: parseBoolean(process.env.ENABLE_SUB_AGENTS, false),

  // Maximum number of concurrent agents
  MAX_CONCURRENT_AGENTS: parseIntValue(process.env.MAX_CONCURRENT_AGENTS, 3),
};

/**
 * Check if exploration agents are enabled
 */
export const isSubAgentsEnabled = (): boolean => {
  return FeatureFlags.ENABLE_SUB_AGENTS;
};

/**
 * Get maximum concurrent agents allowed
 */
export const getMaxConcurrentAgents = (): number => {
  return FeatureFlags.MAX_CONCURRENT_AGENTS;
};
