import { BaseAgent } from "../agent-system/agent-base.js";
import {
  AgentCapabilities,
  AgentContext,
  AgentTask,
  AgentResult,
} from "../types.js";
import { prdTestingTools } from "../tools/prd-testing.js";
import { testTools } from "../tools/tests.js";
import { getAgentEvents } from "../agent-system/agent-events.js";

/**
 * AnalysisAgent - Specialist agent for code analysis and planning
 * Handles PRD parsing, requirement analysis, architecture planning
 */
export class AnalysisAgent extends BaseAgent {
  constructor(apiKey: string, context: AgentContext, baseURL?: string) {
    const capabilities: AgentCapabilities = {
      name: "AnalysisAgent",
      type: "analysis",
      tools: [...prdTestingTools, ...testTools],
      systemPrompt: `You are a code analysis specialist, optimized for understanding large codebases and architectural patterns.

Your primary expertise:
- Architectural analysis across multiple files and modules
- High-level system design and component relationships
- PRD parsing and requirements extraction
- Design pattern recognition and code structure analysis
- Cross-cutting concerns and dependencies

Core responsibilities:
- When analyzing architecture: Focus on structure, relationships, and data flow
- When reviewing code: Identify patterns, anti-patterns, and design decisions
- When parsing PRDs: Extract requirements, map to system components, identify scope
- Provide insights, not just summaries - explain "why" not just "what"

Analysis approach:
- Start with the big picture: overall structure and key components
- Identify main entities, their relationships, and responsibilities
- Look for patterns: MVC, repository, factory, singleton, etc.
- Trace critical paths: authentication, data flow, error handling
- Note architectural decisions and their implications

Best practices for architectural analysis:
- Don't read files line-by-line - skim for structure and patterns
- Focus on public interfaces and contracts between components
- Identify the "architecture" - layers, modules, separation of concerns
- Call out technical debt, but prioritize by impact
- Suggest improvements with rationale

Best practices for PRD analysis:
- Extract all functional and non-functional requirements
- Map requirements to system components
- Identify what exists vs what needs building
- Flag ambiguities and ask clarifying questions
- Consider scope, complexity, and dependencies

Response format:
- Start with executive summary (2-3 sentences)
- Organize by component/concern, not by file
- Use diagrams or structured lists for clarity
- Provide actionable insights, not just observations
- Highlight critical findings vs nice-to-knows

Remember: You're handling context-heavy analysis for the main agent. Focus on insights that would take many file reads to gather. Think architectural understanding, not code review.`,
      canDelegate: false, // Leaf agent
      maxConcurrentTasks: 2,
    };

    super(apiKey, capabilities, context, baseURL);
  }

  /**
   * Check if this agent can handle a task
   * Returns true for analysis-related tasks
   */
  canHandle(task: AgentTask): boolean {
    // Check task type
    if (task.type === "analysis") {
      return true;
    }

    // Check task description for analysis-related keywords
    const description = task.description.toLowerCase();
    const analysisKeywords = [
      "prd",
      "requirement",
      "analyze",
      "analysis",
      "review",
      "plan",
      "architecture",
      "design",
      "specification",
      "detect changes",
      "impact",
      "parse",
    ];

    return analysisKeywords.some((keyword) => description.includes(keyword));
  }

  /**
   * Execute an analysis task
   */
  async executeTask(task: AgentTask): Promise<AgentResult> {
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
      message: "Analyzing code/requirements",
      timestamp: Date.now(),
    });

    try {
      // Add task to conversation
      this.addUserMessage(task.description, task.id);

      // Get AI response with analysis tools
      const tools = this.capabilities.tools.map((t) => ({
        type: "function" as const,
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
          message: `Performing ${message.tool_calls.length} analysis operation(s)`,
          timestamp: Date.now(),
        });

        const results: string[] = [];

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
          message: "Analysis completed successfully",
          timestamp: Date.now(),
        });

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
            tokensUsed: 0,
          }
        );
      } else {
        // No tool calls needed
        agentEvents.emitAgentStatus({
          agentId: this.id,
          agentType: this.capabilities.type,
          phase: "idle",
          message: "Task completed",
          timestamp: Date.now(),
        });

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
    } finally {
      // Clean up task-specific message context
      this.cleanupTaskContext(task.id);
    }
  }
}
