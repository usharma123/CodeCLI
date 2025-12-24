/**
 * ToolExecutor - Handles tool execution, validation, and result formatting
 *
 * Single Responsibility: Execute tools and manage tool-related operations
 */

import { colors } from "../../utils/colors.js";
import { formatToolArgs, formatToolName, formatResultSummary } from "../tool-display.js";
import { JsonRecoveryHelper } from "./JsonRecoveryHelper.js";
import { ToolOutputFormatter } from "./ToolOutputFormatter.js";
import type {
  ToolDefinition,
  ToolCall,
  ToolCallResult,
  OpenAITool,
  ValidationResult,
  ToolExecutorOptions,
  IToolExecutor
} from "./types.js";

export class ToolExecutor implements IToolExecutor {
  private tools: ToolDefinition[];
  private outputFormatter: ToolOutputFormatter;
  private jsonHelper: JsonRecoveryHelper;
  private validationFailureCounts: Map<string, number> = new Map();
  private verboseTools: boolean;

  constructor(options: ToolExecutorOptions) {
    this.tools = options.tools;
    this.verboseTools = options.verboseTools;
    this.outputFormatter = new ToolOutputFormatter({
      verboseTools: options.verboseTools,
      maxToolOutputChars: options.maxToolOutputChars,
    });
    this.jsonHelper = new JsonRecoveryHelper();
  }

  /**
   * Get the tool definitions
   */
  getTools(): ToolDefinition[] {
    return this.tools;
  }

  /**
   * Get tools in OpenAI format
   */
  getOpenAITools(): OpenAITool[] {
    return this.tools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  /**
   * Validate all tool schemas
   */
  validateToolSchemas(): ValidationResult {
    console.log(`${colors.gray}Validating ${this.tools.length} tool schemas...${colors.reset}`);

    const issues: string[] = [];

    for (const tool of this.tools) {
      const params = tool.parameters;

      // Check for additionalProperties constraint
      if (params.additionalProperties === undefined) {
        issues.push(`⚠️  Tool '${tool.name}' missing 'additionalProperties' constraint`);
      }

      // Check required fields exist in properties
      if (params.required && Array.isArray(params.required)) {
        for (const req of params.required) {
          if (!params.properties[req]) {
            issues.push(`❌ Tool '${tool.name}' requires undefined property '${req}'`);
          }
        }
      }

      // Check for empty/undefined descriptions
      if (!tool.description || tool.description.length < 10) {
        issues.push(`⚠️  Tool '${tool.name}' has insufficient description`);
      }
    }

    if (issues.length > 0) {
      console.warn(`${colors.yellow}Schema validation found ${issues.length} issue(s):${colors.reset}`);
      issues.forEach(i => console.warn(`  ${i}`));
    } else {
      console.log(`${colors.green}✓ All tool schemas valid${colors.reset}`);
    }

    return {
      valid: issues.filter(i => i.startsWith('❌')).length === 0,
      issues
    };
  }

  /**
   * Execute a list of tool calls
   */
  async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolCallResult[]> {
    const results: ToolCallResult[] = [];

    for (const toolCall of toolCalls) {
      const result = await this.executeToolCall(toolCall);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute a single tool call
   */
  private async executeToolCall(toolCall: ToolCall): Promise<ToolCallResult> {
    const functionName = toolCall?.function?.name ?? "unknown";

    // Parse and fix JSON arguments
    const parseResult = this.jsonHelper.parseAndFixJson(
      toolCall.function.arguments,
      functionName,
      true
    );

    // Handle parse failure
    if (!parseResult.success) {
      this.jsonHelper.logParseErrorContext(
        toolCall.function.arguments,
        parseResult.error || "Unknown error"
      );

      return {
        tool_call_id: toolCall.id,
        role: "tool",
        content: this.jsonHelper.generateParseErrorMessage(
          functionName,
          toolCall.function.arguments,
          parseResult.error || "Unknown error"
        ),
      };
    }

    const functionArgs = parseResult.args;

    // Handle truncated write_file calls
    if (parseResult.wasTruncated && functionName === "write_file") {
      console.log(`  ${colors.gray}└ ${colors.red}Skipped due to truncation${colors.reset}\n`);
      return {
        tool_call_id: toolCall.id,
        role: "tool",
        content: this.jsonHelper.generateTruncationErrorMessage(
          functionArgs,
          parseResult.truncationInfo || ""
        ),
      };
    }

    // Show clean tool call info (Cursor-style)
    const displayName = formatToolName(functionName);
    const displayArgs = formatToolArgs(functionName, functionArgs);
    console.log(`${colors.green}●${colors.reset} ${colors.bold}${displayName}${colors.reset}${colors.gray}(${displayArgs})${colors.reset}`);

    const tool = this.tools.find((t) => t.name === functionName);

    // Early validation for write_file
    if (functionName === "write_file") {
      const validationResult = this.validateWriteFileArgs(functionArgs, toolCall.id);
      if (validationResult) {
        return validationResult;
      }
    }

    if (!tool) {
      console.log(`  ${colors.gray}└ ${colors.red}Unknown tool${colors.reset}\n`);
      return {
        tool_call_id: toolCall.id,
        role: "tool",
        content: `Error: Unknown tool '${functionName}'. Available tools: ${this.tools
          .map((t) => t.name)
          .join(", ")}`,
      };
    }

    // Execute the tool
    try {
      const result = await tool.function(functionArgs);
      const summary = formatResultSummary(functionName, result);
      console.log(`  ${colors.gray}└ ${summary}${colors.reset}\n`);
      this.outputFormatter.printToolOutput(functionName, functionArgs, result);

      return {
        tool_call_id: toolCall.id,
        role: "tool",
        content: result,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`  ${colors.gray}└ ${colors.red}Error: ${errorMsg}${colors.reset}\n`);

      return {
        tool_call_id: toolCall.id,
        role: "tool",
        content: `Tool Execution Error: ${errorMsg}

The ${functionName} tool failed with the following arguments:
${JSON.stringify(functionArgs, null, 2)}

Please analyze the error and retry with corrected parameters. Common issues:
- File paths may not exist or be incorrect
- Missing required parameters
- Invalid parameter values or formats
- Permission issues`,
      };
    }
  }

  /**
   * Validate write_file arguments
   */
  private validateWriteFileArgs(functionArgs: any, toolCallId: string): ToolCallResult | null {
    const hasContentProp =
      functionArgs &&
      Object.prototype.hasOwnProperty.call(functionArgs, "content");
    const contentIsString =
      hasContentProp && typeof functionArgs.content === "string";
    const pathIsString =
      functionArgs && typeof functionArgs.path === "string";

    if (!pathIsString || !hasContentProp || !contentIsString) {
      const hint =
        'write_file needs both "path" and "content" strings, e.g. {"path":"tests/python/test_agent.py","content":"...file contents..."}';
      const signatureKey = `write_file:${JSON.stringify(functionArgs ?? {})}`;
      const attempt = (this.validationFailureCounts.get(signatureKey) ?? 0) + 1;
      this.validationFailureCounts.set(signatureKey, attempt);

      console.log(`  ${colors.gray}└ ${colors.red}Missing required path/content${colors.reset}\n`);

      const retryNote =
        attempt > 1
          ? `Repeated invalid write_file call (#${attempt}). Do not retry until you include a "content" string with the full file text.`
          : "";

      return {
        tool_call_id: toolCallId,
        role: "tool",
        content: `Tool Validation Error: ${hint}\nAttempt: ${attempt}${
          retryNote ? `\n${retryNote}` : ""
        }\n\nReceived: ${JSON.stringify(functionArgs, null, 2)}`,
      };
    }

    return null;
  }

  /**
   * Get the output formatter
   */
  getOutputFormatter(): ToolOutputFormatter {
    return this.outputFormatter;
  }
}
