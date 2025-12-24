/**
 * ToolOutputFormatter - Handles formatting and display of tool execution output
 *
 * Single Responsibility: Format tool output for display in the terminal
 */

import { colors } from "../../utils/colors.js";
import { renderMarkdownToAnsi } from "../../utils/markdown.js";
import { emitToolOutput } from "../output.js";
import type { FormatterOptions, IToolOutputFormatter } from "./types.js";

export class ToolOutputFormatter implements IToolOutputFormatter {
  private verboseTools: boolean;
  private maxToolOutputChars: number;

  // Tools that show output by default (even in non-verbose mode)
  private static readonly DEFAULT_OUTPUT_TOOLS = new Set([
    "run_command",
    "run_tests",
    "analyze_test_failures",
    "get_coverage",
    "detect_changed_files",
    "generate_tests",
    "analyze_coverage_gaps",
    "generate_regression_test",
    "generate_integration_test",
    "generate_e2e_test",
    "generate_api_test",
    "parse_prd",
    "generate_tests_from_prd",
    "scaffold_project",
    "todo_write",
    "generate_mermaid_diagram",
  ]);

  constructor(options: FormatterOptions) {
    this.verboseTools = options.verboseTools;
    this.maxToolOutputChars = options.maxToolOutputChars;
  }

  /**
   * Check if output should be shown for a given tool
   */
  shouldShowOutput(functionName: string): boolean {
    return this.verboseTools || ToolOutputFormatter.DEFAULT_OUTPUT_TOOLS.has(functionName);
  }

  /**
   * Truncate text to a maximum number of characters
   */
  truncateText(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    return (
      text.substring(0, maxChars) +
      `\n... (truncated, ${text.length - maxChars} chars more)`
    );
  }

  /**
   * Format tool output for display
   */
  formatForDisplay(functionName: string, args: any, result: string): string {
    if (!this.shouldShowOutput(functionName)) {
      return "";
    }

    let outputText = result || "";

    if (!this.verboseTools) {
      // Avoid duplicating already-streamed outputs from long-running tools
      if (functionName === "run_command" || functionName === "run_tests") {
        const splitIndex = outputText.search(/^\s*--- (STDOUT|OUTPUT|ERRORS) ---/m);
        if (splitIndex !== -1) {
          outputText = outputText.slice(0, splitIndex).trimEnd();
        }
      }

      outputText = this.truncateText(outputText, this.maxToolOutputChars);
    }

    return outputText;
  }

  /**
   * Emit tool output event for expandable display in UI
   */
  emitOutput(functionName: string, args: any, result: string, displayedResult: string): void {
    const isTruncated = displayedResult !== result;
    emitToolOutput({
      toolName: functionName,
      args: args,
      result: result,
      displayedResult: displayedResult,
      isTruncated: isTruncated,
      timestamp: Date.now()
    });
  }

  /**
   * Print tool output to console
   */
  printToolOutput(functionName: string, args: any, result: string): void {
    if (!this.shouldShowOutput(functionName)) {
      return;
    }

    const fullResult = result || "";
    const outputText = this.formatForDisplay(functionName, args, result);

    if (!outputText.trim()) return;

    // Emit tool output event for expandable display
    this.emitOutput(functionName, args, fullResult, outputText);

    const rendered =
      outputText.length < 30000
        ? renderMarkdownToAnsi(outputText)
        : outputText;

    const isTruncated = outputText !== fullResult;
    console.log(
      `${colors.gray}  └ Output (${this.verboseTools ? "full" : "truncated"}):${colors.reset}\n${rendered}\n${
        this.verboseTools
          ? ""
          : isTruncated
            ? `${colors.gray}(press Ctrl+O to expand)${colors.reset}\n`
            : ""
      }`
    );
  }

  /**
   * Maybe print formatted markdown after stream if content contains markdown
   */
  maybePrintFormattedAfterStream(content: string): void {
    if (!content) return;
    const hasMarkdown = /(\*\*|__|`{1,3}|^#{1,6}\s|^\s*[-+*]\s|\d+\.\s)/m.test(
      content
    );
    if (!hasMarkdown || content.length > 2000) {
      return;
    }
    console.log(
      `\n${colors.gray}--- Formatted ---${colors.reset}\n${renderMarkdownToAnsi(
        content
      )}\n`
    );
  }
}
