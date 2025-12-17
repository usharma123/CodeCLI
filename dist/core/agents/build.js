import { BaseAgent } from "../agent-base.js";
import { commandTools } from "../tools/commands.js";
import { scaffoldTools } from "../tools/scaffold.js";
import { getAgentEvents } from "../agent-events.js";
/**
 * BuildAgent - Specialist agent for build operations and command execution
 * Handles running commands, scaffolding projects, managing builds
 */
export class BuildAgent extends BaseAgent {
    constructor(apiKey, context, baseURL) {
        const capabilities = {
            name: "BuildAgent",
            type: "build",
            tools: [...commandTools, ...scaffoldTools],
            systemPrompt: `You are a build and command execution specialist agent. Your expertise is in running commands, managing builds, and scaffolding projects.

Your responsibilities:
- Executing shell commands safely and efficiently
- Managing build processes (Maven, Gradle, npm, pip, etc.)
- Scaffolding new projects with proper structure
- Installing dependencies and managing environments
- Running scripts and automation tasks
- Monitoring command output and detecting errors

Supported build systems:
- Java: Maven, Gradle
- JavaScript/TypeScript: npm, yarn, bun
- Python: pip, poetry, setuptools
- General: make, cmake, shell scripts

Best practices:
- Always verify commands before execution
- Use appropriate working directories
- Handle long-running commands with streaming output
- Detect and report errors promptly
- Suggest fixes for common build failures
- Ensure proper environment setup

Scaffolding templates available:
- API servers (REST, GraphQL)
- Web apps (React, static sites)
- Chatbots and conversational AI
- Custom project structures

When handling tasks:
1. Understand the command or build objective
2. Verify environment and dependencies
3. Choose the correct tool (run_command vs scaffold_project)
4. Execute with appropriate timeouts
5. Monitor output for errors or warnings
6. Provide clear status and results
7. Suggest next steps or fixes if needed

Be cautious with destructive commands. Always confirm intent before executing operations that modify the system state.`,
            canDelegate: false, // Leaf agent
            maxConcurrentTasks: 2, // Limit concurrent builds
        };
        super(apiKey, capabilities, context, baseURL);
    }
    /**
     * Check if this agent can handle a task
     * Returns true for build/command-related tasks
     */
    canHandle(task) {
        // Check task type
        if (task.type === "build") {
            return true;
        }
        // Check task description for build-related keywords
        const description = task.description.toLowerCase();
        const buildKeywords = [
            "run command",
            "execute",
            "build",
            "compile",
            "install",
            "scaffold",
            "npm",
            "maven",
            "gradle",
            "pip",
            "make",
            "script",
            "deploy",
        ];
        return buildKeywords.some((keyword) => description.includes(keyword));
    }
    /**
     * Execute a build task
     */
    async executeTask(task) {
        const startTime = Date.now();
        let toolCallCount = 0;
        const agentEvents = getAgentEvents();
        // Emit status: analyzing task
        agentEvents.emitAgentStatus({
            agentId: this.id,
            agentType: this.capabilities.type,
            phase: "thinking",
            message: "Analyzing build/command request",
            timestamp: Date.now(),
        });
        try {
            // Add task to conversation
            this.addUserMessage(task.description);
            // Get AI response with build tools
            const tools = this.capabilities.tools.map((t) => ({
                type: "function",
                function: {
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters,
                },
            }));
            const message = await this.createCompletion({ tools });
            // Handle tool calls
            if (message.tool_calls && message.tool_calls.length > 0) {
                this.addAssistantMessage(message);
                // Emit status: executing tools
                agentEvents.emitAgentStatus({
                    agentId: this.id,
                    agentType: this.capabilities.type,
                    phase: "running_tools",
                    message: `Executing ${message.tool_calls.length} build operation(s)`,
                    timestamp: Date.now(),
                });
                const results = [];
                for (const toolCall of message.tool_calls) {
                    toolCallCount++;
                    const toolName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);
                    // Execute tool
                    const result = await this.executeTool(toolName, args);
                    this.addToolResult(toolCall.id, result);
                    results.push(result);
                }
                // Get final response
                const finalMessage = await this.createCompletion();
                const finalResponse = finalMessage.content || results.join("\n");
                // Emit status: completed
                agentEvents.emitAgentStatus({
                    agentId: this.id,
                    agentType: this.capabilities.type,
                    phase: "idle",
                    message: "Build operations completed successfully",
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
    }
}
