import { BaseAgent } from "../agent-base.js";
import {
  AgentCapabilities,
  AgentContext,
  AgentTask,
  AgentResult,
} from "../types.js";
import { fileTools } from "../tools/files.js";

/**
 * FileSystemAgent - Specialist agent for file operations
 * Handles reading, writing, editing, patching, and listing files
 */
export class FileSystemAgent extends BaseAgent {
  constructor(apiKey: string, context: AgentContext, baseURL?: string) {
    const capabilities: AgentCapabilities = {
      name: "FileSystemAgent",
      type: "filesystem",
      tools: fileTools,
      systemPrompt: `You are a file system specialist agent. Your expertise is in file operations.

Your responsibilities:
- Reading files efficiently
- Writing new files with proper formatting
- Editing existing files with precision
- Applying patches to files
- Listing and exploring directory structures

Best practices:
- Always verify file paths before operations
- Use edit_file for small changes (more precise than rewriting)
- Use patch_file for complex multi-location changes
- List files to understand directory structure before reading
- Cache frequently accessed files to reduce disk I/O

When handling tasks:
1. Understand the file operation required
2. Choose the most efficient tool (read vs edit vs patch)
3. Execute the operation
4. Return clear results with file paths and sizes
5. Report any errors with helpful context

Be concise and focus on the file operations. Don't add unnecessary commentary.`,
      canDelegate: false, // Leaf agent - doesn't delegate
      maxConcurrentTasks: 5, // Can handle multiple file ops
    };

    super(apiKey, capabilities, context, baseURL);
  }

  /**
   * Check if this agent can handle a task
   * Returns true for file-related tasks
   */
  canHandle(task: AgentTask): boolean {
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
  async executeTask(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    let toolCallCount = 0;

    try {
      // Add task to conversation
      this.addUserMessage(task.description);

      // Get AI response with file tools
      const tools = this.capabilities.tools.map((t) => ({
        type: "function" as const,
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

        const results: string[] = [];

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

        return this.createSuccessResult(
          task.id,
          {
            response: finalResponse,
            toolResults: results,
            toolCalls: message.tool_calls.map((tc: any) => ({
              tool: tc.function.name,
              args: JSON.parse(tc.function.arguments),
            })),
          },
          {
            duration: Date.now() - startTime,
            toolCallCount,
            tokensUsed: 0, // TODO: Track from API response
          }
        );
      } else {
        // No tool calls needed
        return this.createSuccessResult(
          task.id,
          {
            response: message.content || "Task completed without tool calls",
          },
          {
            duration: Date.now() - startTime,
            toolCallCount,
            tokensUsed: 0,
          }
        );
      }
    } catch (error) {
      return this.createErrorResult(
        task.id,
        error instanceof Error ? error.message : String(error),
        {
          duration: Date.now() - startTime,
          toolCallCount,
          tokensUsed: 0,
        }
      );
    }
  }
}
