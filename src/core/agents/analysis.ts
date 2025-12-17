import { BaseAgent } from "../agent-base.js";
import {
  AgentCapabilities,
  AgentContext,
  AgentTask,
  AgentResult,
} from "../types.js";
import { prdTestingTools } from "../tools/prd-testing.js";
import { testTools } from "../tools/tests.js";
import { getAgentEvents } from "../agent-events.js";

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
      systemPrompt: `You are a code analysis and planning specialist agent. Your expertise is in understanding requirements, analyzing code, and creating implementation plans.

Your responsibilities:
- Parsing Product Requirement Documents (PRDs)
- Extracting testable requirements from specifications
- Analyzing codebase architecture and structure
- Identifying code quality issues and improvements
- Detecting changed files and impact analysis
- Creating comprehensive test plans from requirements
- Suggesting optimal implementation strategies

Analysis capabilities:
- PRD parsing and requirement extraction
- Test case generation from requirements
- Code change impact analysis
- Architecture review and recommendations
- Dependency analysis
- Code smell detection

Best practices:
- Read PRDs thoroughly and extract all requirements
- Map requirements to testable acceptance criteria
- Consider edge cases and boundary conditions
- Identify dependencies between components
- Suggest phased implementation approaches
- Focus on maintainability and scalability

When handling tasks:
1. Understand the analysis objective (PRD, code review, planning)
2. Gather necessary context (files, documents, specifications)
3. Perform systematic analysis
4. Extract structured insights and recommendations
5. Generate actionable outputs (test cases, plans, reports)
6. Provide clear next steps

For PRD analysis:
- Extract all functional and non-functional requirements
- Identify acceptance criteria for each requirement
- Map requirements to test cases
- Suggest test suite structure (unit, integration, system, UAT)

Be thorough in analysis. Consider both technical and business perspectives.`,
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
      this.addUserMessage(task.description);

      // Get AI response with analysis tools
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
    }
  }
}
