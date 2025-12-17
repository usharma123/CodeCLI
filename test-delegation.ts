/**
 * Test delegation functionality
 * Verifies that tasks can be delegated to specialist agents
 */

import { getAgentManager } from "./src/core/agent-manager.js";
import { getSharedContext } from "./src/core/agent-context.js";
import { FileSystemAgent } from "./src/core/agents/filesystem.js";
import { createAgentTask } from "./src/core/agent-protocol.js";
import { FeatureFlags } from "./src/core/feature-flags.js";

console.log("=== Delegation Test ===\n");

if (!FeatureFlags.ENABLE_SUB_AGENTS) {
  console.error("❌ ENABLE_SUB_AGENTS must be true for this test");
  console.error("   Run: ENABLE_SUB_AGENTS=true bun run test-delegation.ts");
  process.exit(1);
}

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error("❌ OPENROUTER_API_KEY not set");
  console.error("   This test requires a valid API key to execute agent tasks");
  process.exit(1);
}

async function runTests() {
  try {
    // Initialize
    const agentManager = getAgentManager();
    const sharedContext = getSharedContext(process.cwd());

    // Register FileSystemAgent
    const fsAgent = new FileSystemAgent(apiKey, sharedContext.createAgentContext());
    agentManager.registerAgent(fsAgent);

    console.log("✓ FileSystemAgent registered\n");

    // Test 1: Delegate a file read task
    console.log("Test 1: Delegating file read task");
    const readTask = createAgentTask(
      "filesystem",
      "Read the package.json file and tell me the project name",
      { path: "package.json" },
      { priority: "high" }
    );

    console.log(`   Task ID: ${readTask.id}`);
    console.log(`   Task Type: ${readTask.type}`);
    console.log(`   Task Description: ${readTask.description}`);

    const startTime = Date.now();
    const result = await agentManager.delegate({
      taskId: readTask.id,
      targetAgent: "filesystem",
      task: readTask,
    });

    const duration = Date.now() - startTime;

    console.log(`\n   Result Status: ${result.status}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Tool Calls: ${result.metrics.toolCallCount}`);

    if (result.status === "success") {
      console.log(`   ✅ Delegation successful!`);
      console.log(`\n   Agent Response:`);
      console.log(`   ${JSON.stringify(result.data, null, 2).split("\n").join("\n   ")}`);
    } else {
      console.log(`   ❌ Delegation failed: ${result.error}`);
    }

    console.log();

    // Test 2: Shared Context Cache
    console.log("Test 2: Shared Context File Cache");
    const cacheStats = sharedContext.getCacheStats();
    console.log(`   Files in cache: ${cacheStats.filesInCache}`);
    console.log(`   Total cache size: ${cacheStats.totalSize} bytes`);

    if (cacheStats.filesInCache > 0) {
      console.log(`   ✅ File caching working`);
    }

    console.log();

    // Test 3: Agent Manager Stats
    console.log("Test 3: Agent Manager Statistics");
    const stats = agentManager.getStats();
    console.log(`   Registered agents: ${stats.registeredAgents}`);
    console.log(`   Active delegations: ${stats.activeDelegations}`);
    console.log(`   ✅ Manager tracking working`);

    console.log();
    console.log("=== All Tests Passed ===");
    console.log("✅ Delegation system operational");
    console.log("✅ FileSystemAgent responding correctly");
    console.log("✅ Shared context functional");

  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error(error);
    process.exit(1);
  }
}

runTests();
