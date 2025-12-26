/**
 * JsonRecoveryHelper - Handles parsing and recovery of malformed JSON from tool calls
 *
 * Single Responsibility: Parse JSON arguments and recover from common truncation issues
 */

import { colors } from "../../utils/colors.js";
import type { ParseResult } from "./types.js";

export interface TruncationInfo {
  wasTruncated: boolean;
  truncationInfo: string;
}

export class JsonRecoveryHelper {
  /**
   * Detect if write_file arguments appear to be truncated
   */
  detectWriteFileTruncation(rawArgs: string): TruncationInfo {
    const openQuotes = (rawArgs.match(/"/g) || []).length;
    const openBraces = (rawArgs.match(/\{/g) || []).length;
    const closeBraces = (rawArgs.match(/\}/g) || []).length;

    const hasPathKey = rawArgs.includes('"path"');
    const hasContentKey = rawArgs.includes('"content"');

    // If we have path but no content key, or unbalanced structure, it's truncated
    if (hasPathKey && !hasContentKey && (openBraces > closeBraces || openQuotes % 2 !== 0)) {
      return {
        wasTruncated: true,
        truncationInfo: "The response was truncated before the 'content' property could be included."
      };
    }

    // If content key exists but value is incomplete (odd quotes after content key)
    if (hasContentKey) {
      const afterContent = rawArgs.substring(rawArgs.indexOf('"content"'));
      const contentQuotes = (afterContent.match(/"/g) || []).length;
      if (contentQuotes % 2 !== 0 || openBraces > closeBraces) {
        return {
          wasTruncated: true,
          truncationInfo: "The 'content' property value was truncated mid-string."
        };
      }
    }

    return { wasTruncated: false, truncationInfo: "" };
  }

  /**
   * Fix common JSON issues like trailing commas, unterminated strings, unbalanced braces
   */
  fixMalformedJson(rawArgs: string, verbose: boolean = false): string {
    if (typeof rawArgs !== 'string') {
      return rawArgs;
    }

    let fixed = rawArgs;

    // Remove any trailing commas before closing braces/brackets
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

    // Fix unterminated strings by adding closing quotes if needed
    const openQuotes = (fixed.match(/"/g) || []).length;
    if (openQuotes % 2 !== 0) {
      if (verbose) {
        console.log(`  ${colors.gray}└ ${colors.yellow}Fixing unterminated string${colors.reset}`);
      }
      fixed = fixed + '"';
    }

    // Track the order of unclosed braces/brackets to close them in correct order
    // We need to close in reverse order of opening (LIFO)
    const unclosedStack: string[] = [];
    let inString = false;
    let escapeNext = false;

    for (const char of fixed) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (char === '{') {
        unclosedStack.push('}');
      } else if (char === '[') {
        unclosedStack.push(']');
      } else if (char === '}') {
        // Pop the most recent unclosed brace if it matches
        if (unclosedStack.length > 0 && unclosedStack[unclosedStack.length - 1] === '}') {
          unclosedStack.pop();
        }
      } else if (char === ']') {
        // Pop the most recent unclosed bracket if it matches
        if (unclosedStack.length > 0 && unclosedStack[unclosedStack.length - 1] === ']') {
          unclosedStack.pop();
        }
      }
    }

    // Add missing closures in reverse order (LIFO)
    if (unclosedStack.length > 0) {
      if (verbose) {
        console.log(`  ${colors.gray}└ ${colors.yellow}Adding ${unclosedStack.length} missing brace(s)${colors.reset}`);
      }
      fixed = fixed + unclosedStack.reverse().join('');
    }

    // Remove any trailing commas again after fixes
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

    return fixed;
  }

  /**
   * Parse JSON with automatic error recovery
   */
  parseAndFixJson(rawArgs: string | any, functionName: string, verbose: boolean = true): ParseResult {
    // If already an object, return as-is
    if (typeof rawArgs !== 'string') {
      return { success: true, args: rawArgs };
    }

    // Check for truncation in write_file calls before fixing
    let truncationInfo: TruncationInfo = { wasTruncated: false, truncationInfo: "" };
    if (functionName === "write_file") {
      truncationInfo = this.detectWriteFileTruncation(rawArgs);
      if (truncationInfo.wasTruncated && verbose) {
        console.log(`  ${colors.gray}└ ${colors.red}Truncation detected: ${truncationInfo.truncationInfo}${colors.reset}`);
      }
    }

    // Fix malformed JSON (only show verbose messages if not already detected as truncated)
    const fixedArgs = this.fixMalformedJson(rawArgs, verbose && !truncationInfo.wasTruncated);

    try {
      const args = JSON.parse(fixedArgs);
      return {
        success: true,
        args,
        wasTruncated: truncationInfo.wasTruncated,
        truncationInfo: truncationInfo.truncationInfo
      };
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
      return {
        success: false,
        error: errorMsg,
        wasTruncated: truncationInfo.wasTruncated,
        truncationInfo: truncationInfo.truncationInfo
      };
    }
  }

  /**
   * Log parse error context for debugging
   */
  logParseErrorContext(rawArgs: string, errorMsg: string): void {
    console.log(
      `  ${colors.gray}└ ${colors.red}Parse error: ${errorMsg}${colors.reset}`
    );

    // Show context around error position
    const posMatch = errorMsg.match(/position (\d+)/);
    if (posMatch && typeof rawArgs === 'string') {
      const pos = parseInt(posMatch[1]);
      const start = Math.max(0, pos - 50);
      const end = Math.min(rawArgs.length, pos + 50);
      const snippet = rawArgs.substring(start, end);
      const caretPos = Math.min(50, pos - start);

      console.log(`\n${colors.gray}Context around error position:${colors.reset}`);
      console.log(`${colors.gray}${snippet}${colors.reset}`);
      console.log(`${colors.gray}${' '.repeat(caretPos)}^${colors.reset}`);
      console.log(`${colors.gray}Character: ${rawArgs[pos] || 'EOF'}${colors.reset}\n`);
    } else {
      console.log(`${colors.gray}Raw arguments (first 500 chars): ${rawArgs?.substring(0, 500)}${colors.reset}\n`);
    }
  }

  /**
   * Generate error message for truncated write_file calls
   */
  generateTruncationErrorMessage(functionArgs: any, truncationInfo: string): string {
    return `TRUNCATION ERROR: Your response was cut off before the complete tool call could be transmitted.

${truncationInfo}

The write_file tool requires BOTH "path" AND "content" properties.

SOLUTION: Your response may have been too long. Please try again with a shorter file content, or split the file into multiple smaller write_file calls.

Example of valid write_file call:
{
  "path": "tests/python/test_agent.py",
  "content": "import pytest\\n\\ndef test_example():\\n    assert True"
}

Received (truncated): ${JSON.stringify(functionArgs, null, 2)}`;
  }

  /**
   * Generate error message for JSON parse failures
   */
  generateParseErrorMessage(functionName: string, rawArgs: string, errorMsg: string): string {
    return `JSON Parse Error: ${errorMsg}

The tool call failed because the arguments are not valid JSON.

Original malformed JSON:
${rawArgs}

Please retry the ${functionName} tool call with properly formatted JSON. Make sure:
- All strings are properly quoted with double quotes
- All braces {} and brackets [] are balanced
- No trailing commas before closing braces/brackets
- All property names are quoted`;
  }
}
