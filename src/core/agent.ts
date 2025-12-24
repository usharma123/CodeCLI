/**
 * AIAgent Facade
 *
 * This file provides backward compatibility by re-exporting AIAgentCore as AIAgent.
 * All implementation has been refactored into the agent/ directory following SRP.
 *
 * New architecture:
 * - AIAgentCore: Main orchestrator (~300 lines)
 * - MessageHistoryManager: Message management
 * - ToolExecutor: Tool execution
 * - CompletionService: API calls & streaming
 * - TodoStateManager: Todo state
 * - PlanStateManager: Plan approval workflow
 * - ToolOutputFormatter: Output formatting
 * - JsonRecoveryHelper: JSON parsing/fixing
 */

import { AIAgentCore } from "./agent/index.js";

// Re-export AIAgentCore as AIAgent for backward compatibility
export { AIAgentCore as AIAgent };

// Also export AIAgentCore directly for new code
export { AIAgentCore };

// Re-export AgentOptions type from the agent module
export type { AgentOptions } from "./agent/types.js";
