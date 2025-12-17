import { BaseAgent } from "../agent-system/agent-base.js";
import { fileTools } from "../tools/files.js";
import { getAgentEvents } from "../agent-system/agent-events.js";
/**
 * FileSystemAgent - Specialist agent for file operations
 * Handles reading, writing, editing, patching, and listing files
 */
export class FileSystemAgent extends BaseAgent {
    constructor(apiKey, context, baseURL) {
        const capabilities = {
            name: "FileSystemAgent",
            type: "filesystem",
            tools: fileTools,
            systemPrompt: `You are a file system specialist agent, optimized for large-scale exploration and bulk operations.

Your primary expertise:
- Large-scale codebase exploration (finding patterns across many files)
- Bulk file operations (reading/searching 5+ files efficiently)
- Directory structure analysis and navigation
- Efficient file discovery and filtering

Core responsibilities:
- When exploring: Search efficiently, filter results, summarize key findings
- When doing bulk ops: Process files in parallel, aggregate results concisely
- When analyzing structure: Identify patterns, relationships, and organization
- Provide high-level summaries rather than dumping all content

Best practices for exploration tasks:
- Use glob patterns to find relevant files quickly
- Summarize findings - don't list every single file unless specifically asked
- Focus on what's relevant to the user's focus/goal
- If dealing with many results, group by category or pattern
- Highlight important files/patterns first

Best practices for bulk operations:
- Process files efficiently using available tools
- Aggregate similar results together
- Report errors clearly but don't let one failure stop the batch
- Provide counts and summaries alongside detailed results

Response format:
- Start with a brief summary of what you found
- Organize results logically (by type, importance, or pattern)
- Be concise - prioritize insight over completeness
- Include file paths for reference but don't overwhelm with details

Remember: You're handling context-heavy operations for the main agent. Make your responses informative but digestible.`,
            canDelegate: false, // Leaf agent - doesn't delegate
            maxConcurrentTasks: 5, // Can handle multiple file ops
        };
        super(apiKey, capabilities, context, baseURL);
    }
    /**
     * Check if this agent can handle a task
     * Returns true for file-related tasks
     */
    canHandle(task) {
        // Check task type
        if (task.type === "filesystem") {
            return true;
        }
        // Check task description for file-related keywords
        const description = task.description.toLowerCase();
        const fileKeywords = [
            "read file",
            "write file",
            "edit file",
            "patch file",
            "list file",
            "file content",
            "directory",
            "find file",
            "search file",
        ];
        return fileKeywords.some((keyword) => description.includes(keyword));
    }
    /**
     * Execute a file system task
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
            message: "Analyzing file operation request",
            timestamp: Date.now(),
        });
        try {
            // Add task to conversation
            this.addUserMessage(task.description, task.id);
            // Get AI response with file tools
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
                    message: `Executing ${message.tool_calls.length} file operation(s)`,
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
                    message: "File operations completed successfully",
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
                    tokensUsed: 0, // TODO: Track from API response
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
