import { getAgentManager } from "../agent-manager.js";
import { createAgentTask } from "../agent-protocol.js";
import { isSubAgentsEnabled } from "../feature-flags.js";
/**
 * Delegation tool - allows agents to delegate work to specialist agents
 * This is the primary mechanism for multi-agent coordination
 */
const delegateToAgentTool = {
    name: "delegate_to_agent",
    description: `Delegate a specific task to a specialist agent for better results and parallel execution.

Available specialist agents:
- filesystem: File operations (read, write, edit, patch, list files)
  Best for: Reading/writing files, directory exploration, file searches

- testing: Test execution, generation, and coverage analysis
  Best for: Running test suites, analyzing failures, generating tests, coverage reports

- build: Command execution, project scaffolding, builds
  Best for: Running commands, managing builds (npm/maven/gradle), scaffolding projects

- analysis: Code analysis, PRD parsing, requirement extraction, planning
  Best for: Analyzing PRDs, extracting requirements, code review, architecture planning

Use this when:
1. A task requires specialized expertise (e.g., test generation → testing agent)
2. You want to parallelize independent subtasks (delegate to multiple agents concurrently)
3. A task is better handled by a focused agent with domain-specific prompts
4. You need to execute multiple operations in parallel for faster results

Example workflows:
- Parallel testing: Delegate Python tests to one testing agent, Java tests to another
- File + Test: Delegate file reading to filesystem agent while testing agent runs tests
- Analysis + Build: Parse PRD with analysis agent while build agent sets up project

The system automatically manages parallel execution when ENABLE_PARALLEL_TOOLS is enabled.`,
    parameters: {
        type: "object",
        properties: {
            agent_type: {
                type: "string",
                enum: ["filesystem", "testing", "build", "analysis"],
                description: "The type of specialist agent to delegate to",
            },
            task_description: {
                type: "string",
                description: "Clear description of what the agent should do (be specific)",
            },
            context: {
                type: "object",
                description: "Additional context for the task (file paths, parameters, etc.)",
            },
            priority: {
                type: "string",
                enum: ["low", "normal", "high"],
                description: "Task priority (default: normal)",
            },
        },
        required: ["agent_type", "task_description"],
    },
    function: async (input) => {
        // Check if sub-agents are enabled
        if (!isSubAgentsEnabled()) {
            return JSON.stringify({
                error: "Sub-agent delegation is currently disabled. Set ENABLE_SUB_AGENTS=true to enable.",
                suggestion: "Proceeding with direct tool execution instead of delegation.",
            });
        }
        const agentManager = getAgentManager();
        // Check if target agent is registered
        if (!agentManager.hasAgent(input.agent_type)) {
            return JSON.stringify({
                error: `Agent ${input.agent_type} is not registered`,
                availableAgents: agentManager.getStats().agentTypes,
                suggestion: `Try one of the available agents: ${agentManager
                    .getStats()
                    .agentTypes.join(", ")}`,
            });
        }
        // Create task
        const task = createAgentTask(input.agent_type, input.task_description, input.context || {}, {
            priority: input.priority || "normal",
        });
        try {
            // Delegate to agent manager
            const result = await agentManager.delegate({
                taskId: task.id,
                targetAgent: input.agent_type,
                task,
            });
            // Format result for orchestrator
            if (result.status === "success") {
                return JSON.stringify({
                    status: "success",
                    agent: input.agent_type,
                    taskId: result.taskId,
                    result: result.data,
                    metrics: {
                        duration: `${result.metrics.duration}ms`,
                        toolCalls: result.metrics.toolCallCount,
                        tokensUsed: result.metrics.tokensUsed,
                    },
                });
            }
            else if (result.status === "error") {
                return JSON.stringify({
                    status: "error",
                    agent: input.agent_type,
                    taskId: result.taskId,
                    error: result.error,
                    suggestion: "Task failed - try rephrasing or using a different agent",
                });
            }
            else {
                // Partial success
                return JSON.stringify({
                    status: "partial",
                    agent: input.agent_type,
                    taskId: result.taskId,
                    result: result.data,
                    error: result.error,
                    suggestion: "Task partially completed - review results carefully",
                });
            }
        }
        catch (error) {
            return JSON.stringify({
                status: "error",
                agent: input.agent_type,
                error: error instanceof Error ? error.message : String(error),
                suggestion: "Delegation failed - check if agent is properly initialized",
            });
        }
    },
};
/**
 * Export delegation tool for inclusion in toolDefinitions
 */
export const delegationTools = [delegateToAgentTool];
