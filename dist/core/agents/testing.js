import { BaseAgent } from "../agent-base.js";
import { testTools } from "../tools/tests.js";
import { generationTools } from "../tools/generation.js";
import { advancedTestingTools } from "../tools/advanced-testing.js";
import { getAgentEvents } from "../agent-events.js";
/**
 * TestingAgent - Specialist agent for test operations
 * Handles test execution, generation, coverage analysis, and failure diagnosis
 */
export class TestingAgent extends BaseAgent {
    constructor(apiKey, context, baseURL) {
        const capabilities = {
            name: "TestingAgent",
            type: "testing",
            tools: [...testTools, ...generationTools, ...advancedTestingTools],
            systemPrompt: `You are a testing specialist agent. Your expertise is in software testing and quality assurance.

Your responsibilities:
- Running test suites (unit, integration, E2E)
- Analyzing test failures and identifying root causes
- Generating comprehensive test coverage
- Detecting coverage gaps and suggesting improvements
- Creating regression tests for fixed bugs
- Generating tests from PRDs and requirements

Testing frameworks you support:
- Python: pytest, unittest, coverage.py
- Java: JUnit, TestNG, JaCoCo
- JavaScript: Jest, Mocha, Cypress, Playwright

Best practices:
- Always run tests before making assumptions
- Analyze stack traces systematically
- Focus on edge cases and boundary conditions
- Ensure tests are deterministic and isolated
- Generate meaningful test names and descriptions
- Prioritize test coverage in critical paths

When handling tasks:
1. Understand the testing objective (run, analyze, or generate)
2. Choose the appropriate testing tool
3. Execute tests and collect detailed results
4. Analyze failures with stack traces and error messages
5. Provide actionable recommendations
6. Suggest improvements to test coverage

Be precise with test diagnostics. Include file paths, line numbers, and specific error messages.`,
            canDelegate: false, // Leaf agent - doesn't delegate
            maxConcurrentTasks: 3, // Can handle multiple test suites
        };
        super(apiKey, capabilities, context, baseURL);
    }
    /**
     * Check if this agent can handle a task
     * Returns true for test-related tasks
     */
    canHandle(task) {
        // Check task type
        if (task.type === "testing") {
            return true;
        }
        // Check task description for test-related keywords
        const description = task.description.toLowerCase();
        const testKeywords = [
            "test",
            "coverage",
            "pytest",
            "junit",
            "jest",
            "tdd",
            "unit test",
            "integration test",
            "e2e test",
            "test failure",
            "test suite",
            "regression",
        ];
        return testKeywords.some((keyword) => description.includes(keyword));
    }
    /**
     * Execute a testing task
     */
    async executeTask(task) {
        const startTime = Date.now();
        let toolCallCount = 0;
        const agentEvents = getAgentEvents();
        // Initialize isolated message context for concurrent execution
        this.initTaskContext(task.id);
        // Emit status: analyzing task
        agentEvents.emitAgentStatus({
            agentId: this.id,
            agentType: this.capabilities.type,
            phase: "thinking",
            message: "Analyzing testing request",
            timestamp: Date.now(),
        });
        try {
            // Add task to conversation
            this.addUserMessage(task.description, task.id);
            // Get AI response with test tools
            const tools = this.capabilities.tools.map((t) => ({
                type: "function",
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters,
                },
            }));
            const message = await this.createCompletion({ tools, taskId: task.id });
            // Handle tool calls
            if (message.tool_calls && message.tool_calls.length > 0) {
                this.addAssistantMessage(message, task.id);
                // Emit status: executing tools
                agentEvents.emitAgentStatus({
                    agentId: this.id,
                    agentType: this.capabilities.type,
                    phase: "running_tools",
                    message: `Running ${message.tool_calls.length} test operation(s)`,
                    timestamp: Date.now(),
                });
                const results = [];
                for (const toolCall of message.tool_calls) {
                    toolCallCount++;
                    const toolName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);
                    // Execute tool
                    const result = await this.executeTool(toolName, args);
                    this.addToolResult(toolCall.id, result, task.id);
                    results.push(result);
                }
                // Get final response
                const finalMessage = await this.createCompletion({ taskId: task.id });
                const finalResponse = finalMessage.content || results.join("\n");
                // Emit status: completed
                agentEvents.emitAgentStatus({
                    agentId: this.id,
                    agentType: this.capabilities.type,
                    phase: "idle",
                    message: "Testing completed successfully",
                    timestamp: Date.now(),
                });
                return this.createSuccessResult(task.id, {
                    response: finalResponse,
                    toolResults: results,
                    toolCalls: message.tool_calls.map((tc) => ({
                        tool: tc.function.name,
                        args: JSON.parse(tc.function.arguments),
                    })),
                }, {
                    duration: Date.now() - startTime,
                    toolCallCount,
                    tokensUsed: 0,
                });
            }
            else {
                // No tool calls needed
                agentEvents.emitAgentStatus({
                    agentId: this.id,
                    agentType: this.capabilities.type,
                    phase: "idle",
                    message: "Task completed",
                    timestamp: Date.now(),
                });
                return this.createSuccessResult(task.id, {
                    response: message.content || "Task completed without tool calls",
                }, {
                    duration: Date.now() - startTime,
                    toolCallCount,
                    tokensUsed: 0,
                });
            }
        }
        catch (error) {
            return this.createErrorResult(task.id, error instanceof Error ? error.message : String(error), {
                duration: Date.now() - startTime,
                toolCallCount,
                tokensUsed: 0,
            });
        }
        finally {
            // Clean up task-specific message context
            this.cleanupTaskContext(task.id);
        }
    }
}
