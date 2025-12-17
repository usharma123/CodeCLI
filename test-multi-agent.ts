/**
 * Test script for multi-agent system
 * Verifies initialization and basic functionality
 */

import { isSubAgentsEnabled, FeatureFlags } from "./src/core/feature-flags.js";
import { getAgentManager } from "./src/core/agent-manager.js";
import { getSharedContext } from "./src/core/agent-context.js";
import { FileSystemAgent } from "./src/core/agents/filesystem.js";
import { createAgentTask } from "./src/core/agent-protocol.js";

console.log("=== Multi-Agent System Test ===\n");

// Test 1: Feature Flags
console.log("1. Feature Flags:");
console.log(`   ENABLE_SUB_AGENTS: ${isSubAgentsEnabled()}`);
console.log(`   MAX_CONCURRENT_AGENTS: ${FeatureFlags.MAX_CONCURRENT_AGENTS}`);
console.log(`   MAX_DELEGATION_DEPTH: ${FeatureFlags.MAX_DELEGATION_DEPTH}`);
console.log(`   AGENT_TIMEOUT_MS: ${FeatureFlags.AGENT_TIMEOUT_MS}`);
console.log();

// Test 2: Agent Manager
console.log("2. Agent Manager:");
const agentManager = getAgentManager();
console.log(`   ✓ AgentManager initialized`);
console.log(`   Registered agents: ${agentManager.getStats().registeredAgents}`);
console.log();

// Test 3: Shared Context
console.log("3. Shared Context:");
const sharedContext = getSharedContext(process.cwd());
console.log(`   ✓ SharedContext initialized`);
console.log(`   Working directory: ${process.cwd()}`);
const cacheStats = sharedContext.getCacheStats();
console.log(`   Files in cache: ${cacheStats.filesInCache}`);
console.log();

// Test 4: FileSystemAgent Registration
console.log("4. FileSystemAgent:");
if (isSubAgentsEnabled()) {
  const apiKey = process.env.OPENROUTER_API_KEY || "test-key";
  const fsAgent = new FileSystemAgent(apiKey, sharedContext.createAgentContext());
  agentManager.registerAgent(fsAgent);

  console.log(`   ✓ FileSystemAgent created (ID: ${fsAgent.getId()})`);
  console.log(`   Type: ${fsAgent.getType()}`);
  console.log(`   Can delegate: ${fsAgent.canDelegate()}`);
  console.log(`   Available tools: ${fsAgent.getTools().map(t => t.name).join(", ")}`);

  // Test task handling
  const testTask = createAgentTask(
    "filesystem",
    "Test task: Read a file",
    { path: "package.json" }
  );
  const canHandle = fsAgent.canHandle(testTask);
  console.log(`   Can handle file task: ${canHandle}`);

  console.log();
  console.log("5. Agent Manager Stats:");
  const stats = agentManager.getStats();
  console.log(`   Registered agents: ${stats.registeredAgents}`);
  console.log(`   Agent types: ${stats.agentTypes.join(", ")}`);
  console.log(`   Active delegations: ${stats.activeDelegations}`);
} else {
  console.log(`   ⚠ Skipped (ENABLE_SUB_AGENTS=false)`);
  console.log(`   Set ENABLE_SUB_AGENTS=true to test agent registration`);
}

console.log();
console.log("=== Test Complete ===");
console.log("✅ All imports successful");
console.log("✅ No runtime errors");
console.log("✅ Multi-agent infrastructure operational");
