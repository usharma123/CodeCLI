/**
 * Feature flags for hybrid agent system
 *
 * Environment variables:
 * - ENABLE_SUB_AGENTS: Enable exploration agents (FileSystem, Analysis) (default: false for safety)
 * - MAX_CONCURRENT_AGENTS: Maximum concurrent agents (default: 3)
 * - ENABLE_LSP: Enable Language Server Protocol support for real-time diagnostics (default: false)
 * - LSP_AUTO_INSTALL: Auto-install language servers when needed (default: true)
 * - DEBUG_API: Enable API debug logging (request sizes, timing) for diagnosing context issues (default: false)
 */

export interface FeatureFlagsConfig {
  ENABLE_SUB_AGENTS: boolean;
  MAX_CONCURRENT_AGENTS: number;
  ENABLE_LSP: boolean;
  LSP_AUTO_INSTALL: boolean;
  DEBUG_API: boolean;
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

  // LSP support for real-time diagnostics (disabled by default)
  ENABLE_LSP: parseBoolean(process.env.ENABLE_LSP, false),

  // Auto-install language servers when needed
  LSP_AUTO_INSTALL: parseBoolean(process.env.LSP_AUTO_INSTALL, true),

  // Debug API calls - log request sizes and timing (disabled by default)
  DEBUG_API: parseBoolean(process.env.DEBUG_API, false),
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

/**
 * Check if LSP support is enabled
 */
export const isLSPEnabled = (): boolean => {
  return FeatureFlags.ENABLE_LSP;
};

/**
 * Check if LSP auto-install is enabled
 */
export const isLSPAutoInstallEnabled = (): boolean => {
  return FeatureFlags.LSP_AUTO_INSTALL;
};

/**
 * Toggle LSP support at runtime
 * @returns The new state (true = enabled)
 */
export const toggleLSP = (): boolean => {
  FeatureFlags.ENABLE_LSP = !FeatureFlags.ENABLE_LSP;
  return FeatureFlags.ENABLE_LSP;
};

/**
 * Set LSP support state explicitly
 */
export const setLSPEnabled = (enabled: boolean): void => {
  FeatureFlags.ENABLE_LSP = enabled;
};

/**
 * Toggle sub-agents at runtime
 * @returns The new state (true = enabled)
 */
export const toggleSubAgents = (): boolean => {
  FeatureFlags.ENABLE_SUB_AGENTS = !FeatureFlags.ENABLE_SUB_AGENTS;
  return FeatureFlags.ENABLE_SUB_AGENTS;
};

/**
 * Set sub-agents state explicitly
 */
export const setSubAgentsEnabled = (enabled: boolean): void => {
  FeatureFlags.ENABLE_SUB_AGENTS = enabled;
};

/**
 * Check if API debug logging is enabled
 */
export const isDebugAPIEnabled = (): boolean => {
  return FeatureFlags.DEBUG_API;
};

/**
 * Set API debug logging state explicitly
 */
export const setDebugAPIEnabled = (enabled: boolean): void => {
  FeatureFlags.DEBUG_API = enabled;
};
