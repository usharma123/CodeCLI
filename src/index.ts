import OpenAI from "openai";
import * as fs from "fs/promises";
import * as path from "path";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { spawn } from "child_process";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Tool Definition Types
interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  function: (input: any) => Promise<string>;
}

// Tool Input Types
interface ReadFileInput {
  path: string;
}

interface ListFilesInput {
  path?: string;
}

interface EditFileInput {
  path: string;
  old_str: string;
  new_str: string;
}

interface WriteFileInput {
  path: string;
  content: string;
}

interface ScaffoldProjectInput {
  template: "api" | "chatbot" | "static" | "react";
  name?: string;
  target_dir?: string;
  model?: string;
  include_api?: boolean;
}

interface PatchFileInput {
  path: string;
  patch: string;
}

interface RunCommandInput {
  command: string;
  working_dir?: string;
  timeout_seconds?: number;
}

// Color codes for terminal output
const colors = {
  reset: "\u001b[0m",
  cyan: "\u001b[96m",
  yellow: "\u001b[93m",
  green: "\u001b[92m",
  red: "\u001b[91m",
  blue: "\u001b[94m",
  magenta: "\u001b[95m",
  gray: "\u001b[90m",
  bold: "\u001b[1m",
  white: "\u001b[97m",
};

// UI Helper Functions for Cursor-style display

// Format tool name for display (e.g., "read_file" -> "Read")
const formatToolName = (name: string): string => {
  const nameMap: Record<string, string> = {
    read_file: "Read",
    list_files: "List",
    write_file: "Write",
    edit_file: "Update",
    patch_file: "Patch",
    run_command: "Run",
    scaffold_project: "Scaffold",
    run_tests: "Test",
    analyze_test_failures: "Analyze",
    get_coverage: "Coverage",
    detect_changed_files: "Detect",
    generate_tests: "Generate",
    analyze_coverage_gaps: "Gaps",
    generate_regression_test: "Regression",
  };
  return nameMap[name] || name.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("");
};

// Format tool arguments for single-line display
const formatToolArgs = (name: string, args: any): string => {
  switch (name) {
    case "read_file":
      return args.path || "";
    case "list_files":
      return args.path || ".";
    case "write_file":
      return args.path || "";
    case "edit_file":
      return args.path || "";
    case "patch_file":
      return args.path || "";
    case "run_command": {
      const cmd = args.command || "";
      return cmd.length > 60 ? cmd.substring(0, 57) + "..." : cmd;
    }
    case "scaffold_project":
      return `${args.template}${args.name ? `: ${args.name}` : ""}`;
    case "run_tests":
      return `${args.mode || "full"} (${args.language || "all"})`;
    case "analyze_test_failures":
      return args.language || "unknown";
    case "get_coverage":
      return args.language || "unknown";
    case "detect_changed_files":
      return `since ${args.since || "HEAD"}`;
    case "generate_tests":
      return args.file_path || "";
    case "analyze_coverage_gaps":
      return `${args.language} (min ${args.min_coverage || 80}%)`;
    case "generate_regression_test":
      return args.fixed_file || "";
    default:
      return JSON.stringify(args).substring(0, 50);
  }
};

// Format result summary for tree display
const formatResultSummary = (name: string, result: string): string => {
  switch (name) {
    case "read_file": {
      const lines = result.split("\n").length;
      return `Read ${colors.bold}${lines}${colors.reset}${colors.gray} lines`;
    }
    case "list_files": {
      try {
        const files = JSON.parse(result);
        return `Listed ${colors.bold}${files.length}${colors.reset}${colors.gray} paths`;
      } catch {
        return "Listed files";
      }
    }
    case "write_file":
      return result.includes("created") ? "File created" : result.includes("overwritten") ? "File overwritten" : result;
    case "edit_file":
      return result.includes("updated") ? "Changes applied" : result;
    case "run_command": {
      if (result.includes("SUCCESS")) return `${colors.green}Completed successfully${colors.reset}`;
      if (result.includes("FAILED")) return `${colors.red}Failed${colors.reset}`;
      if (result.includes("TIMEOUT")) return `${colors.yellow}Timed out${colors.reset}`;
      if (result.includes("cancelled")) return `${colors.yellow}Cancelled${colors.reset}`;
      return "Completed";
    }
    case "run_tests": {
      if (result.includes("Status: PASSED")) return `${colors.green}All tests passed${colors.reset}`;
      if (result.includes("Status: FAILED")) return `${colors.red}Some tests failed${colors.reset}`;
      return "Tests completed";
    }
    case "analyze_test_failures":
      return "Analysis complete";
    case "get_coverage": {
      const match = result.match(/(\d+\.\d+)%/);
      if (match) return `Coverage: ${colors.bold}${match[1]}%${colors.reset}${colors.gray}`;
      return "Coverage report ready";
    }
    case "detect_changed_files": {
      const match = result.match(/Filtered: (\d+) files/);
      if (match) return `Found ${colors.bold}${match[1]}${colors.reset}${colors.gray} changed files`;
      return "Files detected";
    }
    case "generate_tests":
      return "Test scaffolds generated";
    case "analyze_coverage_gaps": {
      if (result.includes("All files meet") || result.includes("All packages meet")) {
        return `${colors.green}All files meet threshold${colors.reset}`;
      }
      return `${colors.yellow}Gaps identified${colors.reset}`;
    }
    case "generate_regression_test":
      return "Regression test generated";
    default:
      return result.length > 50 ? result.substring(0, 47) + "..." : result;
  }
};

// AI Coding Agent Class
class AIAgent {
  private client: OpenAI;
  public rl: readline.Interface; // Public so tools can access for confirmations
  private tools: ToolDefinition[];
  private messages: any[] = [];
  private retryCount: number = 0;
  private maxRetries: number = 3;
  // Track repeated validation failures to prevent retry storms
  private validationFailureCounts: Map<string, number> = new Map();

  constructor(apiKey: string, tools: ToolDefinition[]) {
    // Configure OpenAI client to use OpenRouter's API
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://github.com/yourusername/ai-coding-agent",
        "X-Title": "AI Coding Agent",
      },
    });

    this.tools = tools;
    this.rl = readline.createInterface({ input, output });

    // Add system prompt to encourage tool usage
    this.messages.push({
      role: "system",
      content: `You are an AI coding assistant with direct access to the file system and terminal. When the user asks you to create, read, edit, list files, or run commands, you MUST use the available tools to do it directly - do NOT give instructions for the user to do it manually.

Available tools:
- read_file: Read any file's contents
- write_file: Create new files or overwrite existing ones
- edit_file: Make string replacements in existing files (USE THIS for most edits)
- patch_file: Apply unified diff patches (advanced - only if you know unified diff format perfectly)
- list_files: List files and directories
- run_command: Execute shell commands (pytest, npm test, python, etc.)
- run_tests: Run Python/Java tests with structured output (smoke/sanity/full modes, optional coverage)
- analyze_test_failures: AI-powered analysis of test failures with fix suggestions
- get_coverage: Get code coverage reports for Python or Java
- detect_changed_files: Detect code changes since a commit/time (for smart test selection)
- generate_tests: AI-powered test generation for uncovered code
- analyze_coverage_gaps: Identify critical missing tests and low-coverage files
- generate_regression_test: Create tests for fixed bugs to prevent regressions

Tool selection guide:
- For NEW files: Use write_file
- For EDITING files: Use edit_file (find the exact text to replace)
- For COMPLEX multi-hunk patches: Use patch_file (only if you can generate perfect unified diff format)
- For RUNNING tests: Use run_command with pytest, npm test, etc.
- For BUILDING/LINTING: Use run_command

IMPORTANT: Always use these tools directly. Never tell the user to manually create files or run commands. You have the power to do it yourself!

Python environment setup (do this before running Python tests):
1. Check if venv exists: run_command with "ls -la" or check for venv/bin/activate
2. If no venv, create one: run_command with "python3 -m venv venv"
3. Install dependencies: run_command with "venv/bin/pip install pytest" (or other needed packages)
4. Run tests with venv: run_command with "venv/bin/pytest tests/" (use venv/bin/python for scripts)
Note: On Windows use venv\\Scripts\\pytest instead of venv/bin/pytest

Node.js environment setup:
1. Check for package.json
2. If dependencies not installed: run_command with "npm install" or "bun install"
3. Run tests: run_command with "npm test" or "bun test"

Java/JUnit environment setup (do this before running Java tests):
1. Check if junit-platform-console-standalone.jar exists: run_command with "ls *.jar" or check the test directory
2. If no JUnit JAR, download it: run_command with "curl -L -o junit-platform-console-standalone.jar https://repo1.maven.org/maven2/org/junit/platform/junit-platform-console-standalone/1.10.2/junit-platform-console-standalone-1.10.2.jar"
3. Compile source and test files: run_command with "javac -cp junit-platform-console-standalone.jar:. SourceFile.java TestFile.java"
4. Run tests: run_command with "java -jar junit-platform-console-standalone.jar --class-path . --scan-class-path"
Note: On Windows use semicolon (;) instead of colon (:) for classpath separator

JUnit test file conventions:
- Test class name should end with "Test" (e.g., CurrencyConverterTest.java)
- Import org.junit.jupiter.api.Test and org.junit.jupiter.api.Assertions
- Each test method should be annotated with @Test
- Use assertions like assertEquals(), assertTrue(), assertThrows()

Test-Driven Development workflow:
1. Set up environment (venv for Python, npm install for Node, download JUnit JAR for Java)
2. Write tests using write_file
3. Run tests using run_command
4. If tests fail, read the output, fix the code using edit_file
5. Run tests again until they pass

Example:
User: "Create an index.html file with a simple page"
You should: Use write_file tool to create the file immediately
You should NOT: Say "Copy this code into a file named index.html"

User: "Run the Python tests and fix any failures"
You should: Use run_tests tool with language="python", analyze failures with analyze_test_failures if any fail, then fix using edit_file
You should NOT: Tell the user to set up the environment themselves

Testing workflow (RECOMMENDED):
1. Use run_tests to execute tests (supports Python, Java, or both)
2. If failures occur, use analyze_test_failures to get detailed analysis
3. Read the failing test files and implementation code
4. Fix issues using edit_file
5. Rerun tests with run_tests to verify
6. Use get_coverage to check test coverage and identify gaps

Advanced testing features (Phase 2):
- detect_changed_files: Find what code changed, run only affected tests
- generate_tests: Create comprehensive tests for functions/classes without coverage
- analyze_coverage_gaps: Identify files below coverage threshold, get specific missing lines
- generate_regression_test: After fixing a bug, create a test to prevent it from reoccurring

Smart testing workflow:
1. detect_changed_files to see what changed
2. Run tests for affected files only (faster feedback)
3. analyze_coverage_gaps to find critical missing tests
4. generate_tests for uncovered code
5. When fixing bugs, use generate_regression_test to prevent regressions`,
    });
  }

  async run(): Promise<void> {
    // ASCII Art header
    console.log(`${colors.cyan}
   █████╗ ██╗     █████╗  ██████╗ ███████╗███╗   ██╗████████╗
  ██╔══██╗██║    ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
  ███████║██║    ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║
  ██╔══██║██║    ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║
  ██║  ██║██║    ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║
  ╚═╝  ╚═╝╚═╝    ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝
${colors.reset}`);
    console.log(
      `${colors.gray}Safe mode enabled (ctrl+c to quit)${colors.reset}`
    );
    console.log(
      `${colors.gray}File changes require your approval before being applied${colors.reset}`
    );
    console.log(
      `${colors.gray}Using Claude Sonnet 4.5 via OpenRouter${colors.reset}\n`
    );

    process.on("SIGINT", () => {
      console.log("\n\nGoodbye!");
      this.rl.close();
      process.exit(0);
    });

    while (true) {
      try {
        const userInput = await this.rl.question(`\n${colors.blue}>${colors.reset} `);

        if (!userInput) continue;

        // Reset retry count on new user input
        this.retryCount = 0;

        // Add user message to history
        this.messages.push({
          role: "user",
          content: userInput,
        });

        await this.processMessage();
      } catch (error) {
        console.error(
          `${colors.red}Error in main loop: ${error}${colors.reset}`
        );

        // Try to recover by removing problematic messages
        if (this.messages.length > 0) {
          const lastMessage = this.messages[this.messages.length - 1];
          if (lastMessage.role === "assistant" && lastMessage.tool_calls) {
            console.log(
              `${colors.yellow}Recovering from tool call error...${colors.reset}`
            );
            this.messages.pop(); // Remove the problematic assistant message

            // Add a simple text response instead
            this.messages.push({
              role: "assistant",
              content:
                "I encountered an error processing that request. Could you please rephrase what you need?",
            });
          }
        }
      }
    }
  }

  private async processMessage(): Promise<void> {
    try {
      // Prepare tools for OpenAI format
      const openAITools = this.tools.map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));

      // Show processing indicator
      process.stdout.write(`${colors.yellow}*${colors.reset} ${colors.gray}Thinking...${colors.reset}`);
      const startTime = Date.now();

      // Call OpenRouter API with Claude Sonnet 4.5 model
      const completion = await this.client.chat.completions.create({
        model: "anthropic/claude-sonnet-4.5", // Using Claude Sonnet 4.5 for reliable tool calling
        messages: this.messages,
        tools: openAITools,
        tool_choice: "auto",
        temperature: 0.3, // Lower temperature for consistent tool calling
        max_tokens: 16384, // Large enough for write_file with full content
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const message = completion.choices[0].message;
      // Clear the "Thinking..." line and show completion
      process.stdout.write(`\r${colors.green}●${colors.reset} ${colors.gray}Response (${elapsed}s)${colors.reset}\n`);

      // Safety net: Check if model should have called tools but didn't
      // (This is rare with Claude Sonnet 4.5 but kept as a precaution)
      if (!message.tool_calls && message.content) {
        const mentionsTools = message.content.match(/\b(read_file|write_file|edit_file|list_files|patch_file)\b/i);

        if (mentionsTools) {
          console.log(`  ${colors.gray}└ Retrying with tool enforcement...${colors.reset}`);
          process.stdout.write(`${colors.yellow}*${colors.reset} ${colors.gray}Thinking...${colors.reset}`);
          const retryStart = Date.now();

          // Retry the same request with Sonnet as fallback
          const fallbackCompletion = await this.client.chat.completions.create({
            model: "anthropic/claude-4.5-sonnet",
            messages: this.messages,
            tools: openAITools,
            tool_choice: "auto",
            temperature: 0.3,  // Sonnet works well with lower temp
            max_tokens: 16384,
          });

          const retryElapsed = ((Date.now() - retryStart) / 1000).toFixed(1);
          const fallbackMessage = fallbackCompletion.choices[0].message;
          process.stdout.write(`\r${colors.green}●${colors.reset} ${colors.gray}Response (${retryElapsed}s)${colors.reset}\n`);
          this.messages.push(fallbackMessage);

          // Continue with fallback response
          if (fallbackMessage.tool_calls && fallbackMessage.tool_calls.length > 0) {
            await this.handleToolCalls(fallbackMessage.tool_calls);
            return;
          } else if (fallbackMessage.content) {
            console.log(`\n${fallbackMessage.content}\n`);
            return;
          }
        }
      }

      // Add assistant message to history
      this.messages.push(message);

      // Handle proper tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        await this.handleToolCalls(message.tool_calls);
      } else if (message.content) {
        // Regular text response
        console.log(`\n${message.content}\n`);
      }
    } catch (error: any) {
      if (error?.status === 400 && this.retryCount < this.maxRetries) {
        console.log(`  ${colors.gray}└ ${colors.yellow}Retrying (${this.retryCount + 1}/${this.maxRetries})...${colors.reset}`);
        this.retryCount++;

        // Remove the last message and try again
        if (this.messages.length > 0) {
          this.messages.pop();
        }

        // Add a clarification message
        this.messages.push({
          role: "user",
          content: "Please proceed with the task",
        });

        // Retry
        await this.processMessage();
      } else {
        throw error;
      }
    }
  }

  private async handleToolCalls(toolCalls: any[]): Promise<void> {
    const toolCallResults = [];

    for (const toolCall of toolCalls) {
      const functionName = toolCall?.function?.name ?? "unknown";
      let functionArgs: any;

      try {
        // Try to parse JSON, with truncation detection
        let rawArgs = toolCall.function.arguments;
        let wasTruncated = false;
        let truncationInfo = "";

        // Clean up common JSON issues
        if (typeof rawArgs === 'string') {
          // Remove any trailing commas before closing braces/brackets
          rawArgs = rawArgs.replace(/,(\s*[}\]])/g, '$1');

          // Detect truncation: check for unbalanced quotes/braces BEFORE fixing
          const openQuotes = (rawArgs.match(/"/g) || []).length;
          const openBraces = (rawArgs.match(/\{/g) || []).length;
          const closeBraces = (rawArgs.match(/\}/g) || []).length;
          
          // For write_file, check if we have path but content appears truncated
          if (functionName === "write_file") {
            const hasPathKey = rawArgs.includes('"path"');
            const hasContentKey = rawArgs.includes('"content"');
            
            // If we have path but no content key, or unbalanced structure, it's truncated
            if (hasPathKey && !hasContentKey && (openBraces > closeBraces || openQuotes % 2 !== 0)) {
              wasTruncated = true;
              truncationInfo = "The response was truncated before the 'content' property could be included.";
            }
            // If content key exists but value is incomplete (odd quotes after content key)
            else if (hasContentKey) {
              const afterContent = rawArgs.substring(rawArgs.indexOf('"content"'));
              const contentQuotes = (afterContent.match(/"/g) || []).length;
              if (contentQuotes % 2 !== 0 || openBraces > closeBraces) {
                wasTruncated = true;
                truncationInfo = "The 'content' property value was truncated mid-string.";
              }
            }
          }

          // Fix unterminated strings by adding closing quotes if needed
          if (openQuotes % 2 !== 0) {
            if (!wasTruncated) {
              console.log(`  ${colors.gray}└ ${colors.yellow}Fixing unterminated string${colors.reset}`);
            }
            rawArgs = rawArgs + '"';
          }

          // Count braces and brackets to fix missing closures (recount after quote fix)
          const finalOpenBraces = (rawArgs.match(/\{/g) || []).length;
          const finalCloseBraces = (rawArgs.match(/\}/g) || []).length;
          const openBrackets = (rawArgs.match(/\[/g) || []).length;
          const closeBrackets = (rawArgs.match(/\]/g) || []).length;

          if (finalOpenBraces > finalCloseBraces) {
            if (!wasTruncated) {
              console.log(`  ${colors.gray}└ ${colors.yellow}Adding ${finalOpenBraces - finalCloseBraces} missing brace(s)${colors.reset}`);
            }
            rawArgs = rawArgs + '}'.repeat(finalOpenBraces - finalCloseBraces);
          }

          if (openBrackets > closeBrackets) {
            if (!wasTruncated) {
              console.log(`  ${colors.gray}└ ${colors.yellow}Adding ${openBrackets - closeBrackets} missing bracket(s)${colors.reset}`);
            }
            rawArgs = rawArgs + ']'.repeat(openBrackets - closeBrackets);
          }

          // Remove any trailing commas again after fixes
          rawArgs = rawArgs.replace(/,(\s*[}\]])/g, '$1');
          
          // Log truncation detection for write_file
          if (wasTruncated) {
            console.log(`  ${colors.gray}└ ${colors.red}Truncation detected: ${truncationInfo}${colors.reset}`);
          }
        }

        functionArgs = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;
        
        // If truncation was detected for write_file, skip execution and report
        if (wasTruncated && functionName === "write_file") {
          console.log(`  ${colors.gray}└ ${colors.red}Skipped due to truncation${colors.reset}\n`);
          toolCallResults.push({
            tool_call_id: toolCall.id,
            role: "tool" as const,
            content: `TRUNCATION ERROR: Your response was cut off before the complete tool call could be transmitted.

${truncationInfo}

The write_file tool requires BOTH "path" AND "content" properties.

SOLUTION: Your response may have been too long. Please try again with a shorter file content, or split the file into multiple smaller write_file calls.

Example of valid write_file call:
{
  "path": "tests/python/test_agent.py",
  "content": "import pytest\\n\\ndef test_example():\\n    assert True"
}

Received (truncated): ${JSON.stringify(functionArgs, null, 2)}`,
          });
          continue;
        }
      } catch (parseError) {
        const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
        console.log(
`  ${colors.gray}└ ${colors.red}Parse error: ${errorMsg}${colors.reset}`
        );
        console.log(`${colors.gray}Raw arguments: ${toolCall.function.arguments}${colors.reset}\n`);

        // Send detailed error back to the model so it can fix itself
        toolCallResults.push({
          tool_call_id: toolCall.id,
          role: "tool" as const,
          content: `JSON Parse Error: ${errorMsg}

The tool call failed because the arguments are not valid JSON.

Original malformed JSON:
${toolCall.function.arguments}

Please retry the ${functionName} tool call with properly formatted JSON. Make sure:
- All strings are properly quoted with double quotes
- All braces {} and brackets [] are balanced
- No trailing commas before closing braces/brackets
- All property names are quoted`,
        });
        continue;
      }

      // Show clean tool call info (Cursor-style)
      const displayName = formatToolName(functionName);
      const displayArgs = formatToolArgs(functionName, functionArgs);
      console.log(`${colors.green}●${colors.reset} ${colors.bold}${displayName}${colors.reset}${colors.gray}(${displayArgs})${colors.reset}`);

      const tool = this.tools.find((t) => t.name === functionName);

      // Early validation for common mistakes so the model can self-correct
      if (functionName === "write_file") {
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
          const signatureKey = `${functionName}:${JSON.stringify(
            functionArgs ?? {}
          )}`;
          const attempt =
            (this.validationFailureCounts.get(signatureKey) ?? 0) + 1;
          this.validationFailureCounts.set(signatureKey, attempt);
          console.log(`  ${colors.gray}└ ${colors.red}Missing required path/content${colors.reset}\n`);
          const retryNote =
            attempt > 1
              ? `Repeated invalid write_file call (#${attempt}). Do not retry until you include a "content" string with the full file text.`
              : "";
          toolCallResults.push({
            tool_call_id: toolCall.id,
            role: "tool" as const,
            content: `Tool Validation Error: ${hint}\nAttempt: ${attempt}${
              retryNote ? `\n${retryNote}` : ""
            }\n\nReceived: ${JSON.stringify(
              functionArgs,
              null,
              2
            )}`,
          });
          continue;
        }
      }

      if (tool) {
        try {
          const result = await tool.function(functionArgs);
          const summary = formatResultSummary(functionName, result);
          console.log(`  ${colors.gray}└ ${summary}${colors.reset}\n`);

          toolCallResults.push({
            tool_call_id: toolCall.id,
            role: "tool" as const,
            content: result,
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.log(`  ${colors.gray}└ ${colors.red}Error: ${errorMsg}${colors.reset}\n`);

          // Send detailed error back to the model so it can fix itself
          toolCallResults.push({
            tool_call_id: toolCall.id,
            role: "tool" as const,
            content: `Tool Execution Error: ${errorMsg}

The ${functionName} tool failed with the following arguments:
${JSON.stringify(functionArgs, null, 2)}

Please analyze the error and retry with corrected parameters. Common issues:
- File paths may not exist or be incorrect
- Missing required parameters
- Invalid parameter values or formats
- Permission issues`,
          });
        }
      } else {
        console.log(`  ${colors.gray}└ ${colors.red}Unknown tool${colors.reset}\n`);
        toolCallResults.push({
          tool_call_id: toolCall.id,
          role: "tool" as const,
          content: `Error: Unknown tool '${functionName}'. Available tools: ${this.tools
            .map((t) => t.name)
            .join(", ")}`,
        });
      }
    }

    // Add ALL tool results to messages
    for (const result of toolCallResults) {
      this.messages.push(result);
    }

    try {
      // Prepare tools for OpenAI format
      const openAITools = this.tools.map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));

      // Get follow-up response after tool execution (with tools enabled for continuation)
      const followUp = await this.client.chat.completions.create({
        model: "anthropic/claude-sonnet-4.5",
        messages: this.messages,
        tools: openAITools,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 16384, // Large enough for write_file with full content
      });

      const followUpMessage = followUp.choices[0].message;
      this.messages.push(followUpMessage);

      // Check if the model wants to call more tools
      if (followUpMessage.tool_calls && followUpMessage.tool_calls.length > 0) {
        // Continue the tool calling loop
        await this.handleToolCalls(followUpMessage.tool_calls);
      } else if (followUpMessage.content) {
        // Task is complete, show final response
        console.log(`\n${followUpMessage.content}\n`);
      }
    } catch (followUpError) {
      // Silent fail - tools were executed
    }
  }

  close(): void {
    this.rl.close();
  }
}

// Store reference to the agent instance for tool confirmations
let agentInstance: AIAgent | null = null;

const getConfirmInterface = () => {
  if (!agentInstance) {
    throw new Error("Agent not initialized");
  }
  return agentInstance.rl;
};

// Tool Implementations

const readFileDefinition: ToolDefinition = {
  name: "read_file",
  description: "Read the contents of a given relative file path.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The relative path of a file in the working directory",
      },
    },
    required: ["path"],
  },
  function: async (input: ReadFileInput) => {
    try {
      const content = await fs.readFile(input.path, "utf-8");
      // Limit response size to avoid issues
      if (content.length > 10000) {
        return (
          content.substring(0, 10000) + "\n... (truncated, file too large)"
        );
      }
      return content;
    } catch (error) {
      throw new Error(`Failed to read file: ${error}`);
    }
  },
};

const listFilesDefinition: ToolDefinition = {
  name: "list_files",
  description: "List files and directories at a given path.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Optional relative path to list files from.",
      },
    },
  },
  function: async (input: ListFilesInput) => {
    const dir = input.path || ".";

    try {
      const files: string[] = [];

      async function walk(
        currentPath: string,
        basePath: string,
        depth: number = 0
      ) {
        // Limit depth to avoid too many files
        if (depth > 3) return;

        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          // Skip node_modules and .git directories
          if (
            entry.name === "node_modules" ||
            entry.name === ".git" ||
            entry.name.startsWith(".")
          ) {
            continue;
          }

          const fullPath = path.join(currentPath, entry.name);
          const relativePath = path.relative(basePath, fullPath);

          if (entry.isDirectory()) {
            files.push(relativePath + "/");
            if (depth < 3) {
              await walk(fullPath, basePath, depth + 1);
            }
          } else {
            files.push(relativePath);
          }
        }
      }

      await walk(dir, dir);
      return JSON.stringify(files);
    } catch (error) {
      throw new Error(`Failed to list files: ${error}`);
    }
  },
};

const writeFileDefinition: ToolDefinition = {
  name: "write_file",
  description:
    "Create a new file or completely overwrite an existing file with the provided content.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path where the file should be created",
      },
      content: {
        type: "string",
        description: "The complete content to write to the file",
      },
    },
    required: ["path", "content"],
  },
  function: async (input: WriteFileInput) => {
    if (!agentInstance) {
      throw new Error("Agent not initialized");
    }
    const rl = agentInstance.rl;

    try {
      // Validate input eagerly so the model gets actionable feedback
      if (!input.path || typeof input.path !== "string") {
        throw new Error(
          "write_file requires a string 'path' (relative or absolute)."
        );
      }

      const hasContentProp =
        input && Object.prototype.hasOwnProperty.call(input, "content");

      if (!hasContentProp) {
        throw new Error(
          "write_file is missing the required 'content' string. Please call with both 'path' and the full file contents, e.g. {\"path\":\"tests/python/test_agent.py\",\"content\":\"...\"}."
        );
      }

      if (typeof input.content !== "string") {
        throw new Error("write_file 'content' must be a string (can be empty).");
      }

      // Check if file exists
      let fileExists = true;
      let currentContent = "";

      try {
        currentContent = await fs.readFile(input.path, "utf-8");
      } catch (error: any) {
        if (error.code === "ENOENT") {
          fileExists = false;
        } else {
          throw error;
        }
      }

      // Show preview (Cursor-style)
      const lines = input.content.split("\n");
      const totalLines = lines.length;
      const previewCount = Math.min(15, totalLines);
      
      console.log(`  ${colors.gray}└ ${fileExists ? "Overwrite" : "Create"} ${colors.bold}${input.path}${colors.reset}${colors.gray} (${totalLines} lines)${colors.reset}`);
      
      // Show line-numbered preview
      for (let i = 0; i < previewCount; i++) {
        const lineNum = String(i + 1).padStart(4, " ");
        console.log(`    ${colors.gray}${lineNum}${colors.reset} ${colors.green}+${colors.reset} ${lines[i]}`);
      }
      
      if (totalLines > previewCount) {
        console.log(`    ${colors.gray}     ... (${totalLines - previewCount} more lines)${colors.reset}`);
      }

      // Ask for confirmation
      const question = `\n${colors.yellow}Apply changes? (y/n): ${colors.reset}`;

      const answer = await rl.question(question);

      if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
        // Create directory if it doesn't exist
        const dir = path.dirname(input.path);
        if (dir !== ".") {
          await fs.mkdir(dir, { recursive: true });
        }

        // Write the file
        await fs.writeFile(input.path, input.content, "utf-8");
        return `File ${input.path} ${fileExists ? "overwritten" : "created"} successfully`;
      } else {
        return "Operation cancelled by user";
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to write file: ${error}`);
    }
  },
};

const editFileDefinition: ToolDefinition = {
  name: "edit_file",
  description:
    "Edit a file by replacing specific text. Use this for partial file modifications.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path to the file",
      },
      old_str: {
        type: "string",
        description:
          "Text to search for and replace. Use empty string to append to file.",
      },
      new_str: {
        type: "string",
        description: "Text to replace old_str with",
      },
    },
    required: ["path", "old_str", "new_str"],
  },
  function: async (input: EditFileInput) => {
    if (!input.path || input.old_str === input.new_str) {
      throw new Error("Invalid input parameters");
    }

    if (!agentInstance) {
      throw new Error("Agent not initialized");
    }
    const rl = agentInstance.rl;

    try {
      let currentContent: string = "";
      let fileExists = true;

      try {
        currentContent = await fs.readFile(input.path, "utf-8");
      } catch (error: any) {
        if (error.code === "ENOENT") {
          fileExists = false;
          if (input.old_str !== "") {
            throw new Error(
              `File ${input.path} does not exist. Use write_file to create new files.`
            );
          }
        } else {
          throw error;
        }
      }

      // Calculate new content
      let newContent: string;
      if (!fileExists) {
        newContent = input.new_str;
      } else {
        if (!currentContent.includes(input.old_str) && input.old_str !== "") {
          throw new Error(
            `Text not found in file: "${input.old_str.substring(0, 50)}${
              input.old_str.length > 50 ? "..." : ""
            }"`
          );
        }
        newContent = currentContent.replace(input.old_str, input.new_str);
      }

      // Show preview (Cursor-style with line numbers)
      const oldLines = input.old_str.split("\n");
      const newLines = input.new_str.split("\n");
      const addCount = newLines.filter(l => l.trim()).length;
      const removeCount = oldLines.filter(l => l.trim()).length;
      
      // Find line number where the change starts
      const allLines = currentContent.split("\n");
      let startLineNum = 1;
      if (input.old_str) {
        const idx = currentContent.indexOf(input.old_str);
        if (idx >= 0) {
          startLineNum = currentContent.substring(0, idx).split("\n").length;
        }
      }
      
      console.log(`  ${colors.gray}└ Updated ${colors.bold}${input.path}${colors.reset}${colors.gray} with ${colors.green}${addCount} addition${addCount !== 1 ? "s" : ""}${colors.gray} and ${colors.red}${removeCount} removal${removeCount !== 1 ? "s" : ""}${colors.reset}`);
      
      // Show the diff with line numbers
      const maxPreview = 8;
      let lineNum = startLineNum;
      
      // Show removals
      const oldPreview = oldLines.slice(0, maxPreview);
      for (const line of oldPreview) {
        const ln = String(lineNum).padStart(4, " ");
        console.log(`    ${colors.gray}${ln}${colors.reset} ${colors.red}-${colors.reset} ${colors.red}${line}${colors.reset}`);
      }
      if (oldLines.length > maxPreview) {
        console.log(`    ${colors.gray}     ... (${oldLines.length - maxPreview} more removals)${colors.reset}`);
      }
      
      // Show additions
      lineNum = startLineNum;
      const newPreview = newLines.slice(0, maxPreview);
      for (const line of newPreview) {
        const ln = String(lineNum).padStart(4, " ");
        console.log(`    ${colors.gray}${ln}${colors.reset} ${colors.green}+${colors.reset} ${colors.green}${line}${colors.reset}`);
        lineNum++;
      }
      if (newLines.length > maxPreview) {
        console.log(`    ${colors.gray}     ... (${newLines.length - maxPreview} more additions)${colors.reset}`);
      }

      // Ask for confirmation
      const question = `\n${colors.yellow}Apply changes? (y/n): ${colors.reset}`;
      const answer = await rl.question(question);

      if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
        if (!fileExists) {
          const dir = path.dirname(input.path);
          if (dir !== ".") {
            await fs.mkdir(dir, { recursive: true });
          }
        }

        await fs.writeFile(input.path, newContent, "utf-8");
        return "File successfully updated";
      } else {
        return "Changes cancelled by user";
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to edit file: ${error}`);
    }
  },
};

type TemplateFile = { path: string; content: string };

const sanitizeName = (name: string): string => {
  const safe = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe || "app";
};

const getApiTemplate = (base: string, name: string): TemplateFile[] => {
  return [
    {
      path: `${base}/package.json`,
      content: JSON.stringify(
        {
          name: sanitizeName(name || "api-server"),
          type: "module",
          scripts: {
            dev: "bun --watch src/server.ts",
            start: "bun src/server.ts",
          },
          dependencies: {
            express: "^4.19.2",
            dotenv: "^16.4.5",
          },
        },
        null,
        2
      ),
    },
    {
      path: `${base}/tsconfig.json`,
      content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  }
}
`,
    },
    {
      path: `${base}/.env.example`,
      content: `PORT=3000
`,
    },
    {
      path: `${base}/src/server.ts`,
      content: `import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "${name || "api"}" });
});

app.get("/", (_req, res) => {
  res.json({
    message: "Hello from ${name || "API"}",
  });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(\`API listening on http://localhost:\${port}\`);
});
`,
    },
    {
      path: `${base}/README.md`,
      content: `# ${name || "API Server"}

## Run
1) Copy .env.example to .env and set PORT (optional)
2) bun install
3) bun run dev   # or bun run start

## Test
curl http://localhost:3000/health
`,
    },
  ];
};

const getChatbotTemplate = (
  base: string,
  name: string,
  model?: string
): TemplateFile[] => {
  const appName = name || "chatbot-api";
  const defaultModel = model || "anthropic/claude-3.5-sonnet";

  return [
    {
      path: `${base}/package.json`,
      content: JSON.stringify(
        {
          name: sanitizeName(appName),
          type: "module",
          scripts: {
            dev: "bun --watch src/server.ts",
            start: "bun src/server.ts",
          },
          dependencies: {
            express: "^4.19.2",
            dotenv: "^16.4.5",
            openai: "^4.57.2",
          },
        },
        null,
        2
      ),
    },
    {
      path: `${base}/tsconfig.json`,
      content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  }
}
`,
    },
    {
      path: `${base}/.env.example`,
      content: `OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_MODEL=${defaultModel}
PORT=3001
`,
    },
    {
      path: `${base}/src/server.ts`,
      content: `import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(express.json());

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.warn("OPENROUTER_API_KEY is not set. /chat will return 500.");
}

const client = new OpenAI({
  apiKey,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://github.com/yourusername/ai-coding-agent",
    "X-Title": "${appName}",
  },
});

const model = process.env.OPENROUTER_MODEL || "${defaultModel}";

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "${appName}", model });
});

app.post("/chat", async (req, res) => {
  if (!apiKey) {
    return res.status(500).json({ error: "OPENROUTER_API_KEY missing" });
  }

  const userMessage: string = req.body?.message;
  const history: { role: "user" | "assistant"; content: string }[] =
    req.body?.history || [];

  if (!userMessage) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are a helpful chatbot API." },
        ...history,
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || "";
    res.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Chat error:", msg);
    res.status(500).json({ error: msg });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(\`Chatbot API listening on http://localhost:\${port}\`);
});
`,
    },
    {
      path: `${base}/README.md`,
      content: `# ${appName}

## Run
1) Copy .env.example to .env and set OPENROUTER_API_KEY (and model/port if needed)
2) bun install
3) bun run dev   # or bun run start

## Test
curl -X POST http://localhost:3001/chat -H 'Content-Type: application/json' \\
  -d '{"message":"Hello"}'
`,
    },
  ];
};

const getStaticTemplate = (base: string, name: string): TemplateFile[] => [
  {
    path: `${base}/index.html`,
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${name || "Static Site"}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="page">
      <h1>${name || "Static Site"}</h1>
      <p>Your static site is ready. Edit <code>index.html</code> to get started.</p>
      <button id="cta">Click me</button>
      <pre id="log"></pre>
    </main>
    <script type="module">
      const log = document.getElementById("log");
      document.getElementById("cta")?.addEventListener("click", () => {
        log.textContent = "Hello from ${name || "static app"}!";
      });
    </script>
  </body>
</html>
`,
  },
  {
    path: `${base}/styles.css`,
    content: `:root {
  color-scheme: light dark;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
body {
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, #2d2f36, #0e0f12);
  color: #e8ecf1;
}
.page {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 24px;
  border-radius: 12px;
  width: min(720px, 90vw);
  box-shadow: 0 12px 80px rgba(0, 0, 0, 0.35);
}
button {
  background: #6c7bfd;
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
pre {
  background: rgba(0, 0, 0, 0.35);
  padding: 12px;
  border-radius: 8px;
}
`,
  },
  {
    path: `${base}/README.md`,
    content: `# ${name || "Static Site"}

Open index.html in a browser or serve the folder with:

bunx serve .
`,
  },
];

const getReactTemplate = (
  base: string,
  name: string,
  includeApi?: boolean
): TemplateFile[] => {
  const files: TemplateFile[] = [
    {
      path: `${base}/package.json`,
      content: JSON.stringify(
        {
          name: sanitizeName(name || "react-app"),
          private: true,
          type: "module",
          scripts: {
            dev: "bunx vite",
            build: "bunx vite build",
            preview: "bunx vite preview",
          },
          dependencies: {
            react: "^18.3.1",
            "react-dom": "^18.3.1",
          },
          devDependencies: {
            typescript: "^5.6.3",
            vite: "^5.4.8",
            "@types/react": "^18.3.10",
            "@types/react-dom": "^18.3.0",
          },
        },
        null,
        2
      ),
    },
    {
      path: `${base}/tsconfig.json`,
      content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  }
}
`,
    },
    {
      path: `${base}/vite.config.ts`,
      content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`,
    },
    {
      path: `${base}/index.html`,
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name || "React App"}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    {
      path: `${base}/src/main.tsx`,
      content: `import React from "react";
      import ReactDOM from "react-dom/client";
      import App from "./App";
      import "./styles.css";

      ReactDOM.createRoot(document.getElementById("root")!).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      `,
    },
    {
      path: `${base}/src/App.tsx`,
      content: `import { useState } from "react";

export default function App() {
  const [messages, setMessages] = useState<string[]>([]);

  return (
    <main className="page">
      <header>
        <p className="badge">Vite + React (Bun)</p>
        <h1>${name || "React App"}</h1>
      </header>
      <section>
        <p>Edit <code>src/App.tsx</code> and save to reload.</p>
        <button
          onClick={() =>
            setMessages((prev) => [...prev, "Hello from your new app!"])
          }
        >
          Add message
        </button>
        <ul>
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
`,
    },
    {
      path: `${base}/src/styles.css`,
      content: `:root {
  color-scheme: light dark;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
body {
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, #20212b, #0e0f12);
  color: #e8ecf1;
}
.page {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 24px;
  border-radius: 12px;
  width: min(720px, 90vw);
  box-shadow: 0 12px 80px rgba(0, 0, 0, 0.35);
}
.badge {
  display: inline-flex;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 12px;
  letter-spacing: 0.02em;
}
button {
  background: #6c7bfd;
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
`,
    },
    {
      path: `${base}/README.md`,
      content: `# ${name || "React App"}

## Run
bun install
bun run dev   # http://localhost:5173

## Build
bun run build
bun run preview
`,
    },
  ];

  if (includeApi) {
    files.push(
      ...getApiTemplate(`${base}/api`, `${name || "api"}-api`).map(
        (file) => ({
          ...file,
          // Avoid nested package name collisions
          path: file.path,
        })
      )
    );
  }

  return files;
};

const buildTemplateFiles = (
  input: ScaffoldProjectInput
): { baseDir: string; files: TemplateFile[]; description: string } => {
  const template = input.template || "chatbot";
  const baseDir = input.target_dir?.trim() || sanitizeName(input.name || template);
  const name = input.name || template;

  switch (template) {
    case "api":
      return {
        baseDir,
        files: getApiTemplate(baseDir, name),
        description: "Bun + Express REST API",
      };
    case "chatbot":
      return {
        baseDir,
        files: getChatbotTemplate(baseDir, name, input.model),
        description: "Bun + Express chatbot API via OpenRouter",
      };
    case "static":
      return {
        baseDir,
        files: getStaticTemplate(baseDir, name),
        description: "Static HTML/CSS site",
      };
    case "react":
    default:
      return {
        baseDir,
        files: getReactTemplate(baseDir, name, input.include_api),
        description: input.include_api
          ? "React/Vite frontend with optional API scaffold"
          : "React/Vite frontend",
      };
  }
};

const scaffoldProjectDefinition: ToolDefinition = {
  name: "scaffold_project",
  description:
    "Scaffold a project using Bun. Supported templates: api, chatbot, static, react (include_api optional).",
  parameters: {
    type: "object",
    properties: {
      template: {
        type: "string",
        description: "Template type: api | chatbot | static | react",
      },
      name: {
        type: "string",
        description: "Project name (used for package name and titles)",
      },
      target_dir: {
        type: "string",
        description: "Directory to create (relative). Defaults to name.",
      },
      model: {
        type: "string",
        description:
          "Model identifier for chatbot template (e.g., anthropic/claude-3.5-sonnet)",
      },
      include_api: {
        type: "boolean",
        description: "For react template, also scaffold an API folder",
      },
    },
    required: ["template"],
  },
  function: async (input: ScaffoldProjectInput) => {
    const { baseDir, files, description } = buildTemplateFiles(input);
    const rl = getConfirmInterface();

    console.log(`  ${colors.gray}└ ${description} -> ${colors.bold}${baseDir}${colors.reset}${colors.gray} (${files.length} files)${colors.reset}`);

    const answer = await rl.question(
      `\n${colors.yellow}Scaffold project? (y/n): ${colors.reset}`
    );

    if (!["y", "yes"].includes(answer.toLowerCase())) {
      return "Scaffold cancelled by user";
    }

    for (const file of files) {
      const fullDir = path.dirname(file.path);
      await fs.mkdir(fullDir, { recursive: true });
      await fs.writeFile(file.path, file.content, "utf-8");
    }

    return `Scaffolded ${description} at ${baseDir} (${files.length} files).`;
  },
};

const patchFileDefinition: ToolDefinition = {
  name: "patch_file",
  description:
    "Apply a unified diff patch to a file. Use this to make complex multi-line changes. The patch should be in unified diff format.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "The path to the file to patch",
      },
      patch: {
        type: "string",
        description:
          "The unified diff patch to apply. Should start with @@ line numbers and contain - lines (remove) and + lines (add).",
      },
    },
    required: ["path", "patch"],
  },
  function: async (input: PatchFileInput) => {
    if (!input.path || !input.patch) {
      throw new Error("Invalid input parameters");
    }

    if (!agentInstance) {
      throw new Error("Agent not initialized");
    }
    const rl = agentInstance.rl;

    try {
      // Read current file content
      let currentContent: string;
      try {
        currentContent = await fs.readFile(input.path, "utf-8");
      } catch (error: any) {
        if (error.code === "ENOENT") {
          throw new Error(
            `File ${input.path} does not exist. Use write_file to create new files.`
          );
        }
        throw error;
      }

      // Parse and apply the patch
      const lines = currentContent.split("\n");
      const patchLines = input.patch.split("\n");

      // Find the @@ hunk header
      let hunkHeader = patchLines.find((line) => line.startsWith("@@"));
      if (!hunkHeader) {
        throw new Error(
          "Invalid patch format: no @@ hunk header found. Patch should be in unified diff format.\n\n" +
          "Example format:\n" +
          "@@ -10,3 +10,4 @@\n" +
          " unchanged line\n" +
          "-removed line\n" +
          "+added line\n\n" +
          "Suggestion: For simple changes, use edit_file instead."
        );
      }

      // Extract line numbers from @@ -start,count +start,count @@
      // More flexible regex to handle various formats
      const match = hunkHeader.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (!match) {
        console.log(`${colors.red}Failed to parse hunk header: "${hunkHeader}"${colors.reset}`);
        console.log(`${colors.yellow}This usually means the patch format is incomplete or incorrect.${colors.reset}`);
        console.log(`${colors.cyan}Suggestion: Use edit_file for simple string replacements instead.${colors.reset}\n`);

        throw new Error(
          `Invalid hunk header format.\n\n` +
          `Expected format: "@@ -startLine,count +startLine,count @@"\n` +
          `Got: "${hunkHeader}"\n\n` +
          `Example of valid patch:\n` +
          `@@ -5,3 +5,3 @@\n` +
          ` function test() {\n` +
          `-  console.log("old");\n` +
          `+  console.log("new");\n` +
          ` }\n\n` +
          `Tip: For simple changes, use edit_file instead of patch_file.`
        );
      }

      const startLine = parseInt(match[1]) - 1; // Convert to 0-based index

      // Apply the patch
      const newLines = [...lines];
      let currentLine = startLine;
      let patchIndex = patchLines.findIndex((line) => line.startsWith("@@")) + 1;

      const removedLines: string[] = [];
      const addedLines: string[] = [];

      while (patchIndex < patchLines.length) {
        const patchLine = patchLines[patchIndex];

        if (patchLine.startsWith("-")) {
          // Remove line
          const lineContent = patchLine.substring(1);
          removedLines.push(lineContent);
          if (newLines[currentLine] === lineContent) {
            newLines.splice(currentLine, 1);
          } else {
            console.log(
              `${colors.yellow}⚠️  Warning: Line mismatch at ${currentLine + 1}${
                colors.reset
              }`
            );
            console.log(
              `${colors.gray}Expected: "${lineContent}"${colors.reset}`
            );
            console.log(
              `${colors.gray}Found: "${newLines[currentLine]}"${colors.reset}`
            );
          }
        } else if (patchLine.startsWith("+")) {
          // Add line
          const lineContent = patchLine.substring(1);
          addedLines.push(lineContent);
          newLines.splice(currentLine, 0, lineContent);
          currentLine++;
        } else if (patchLine.startsWith(" ")) {
          // Context line (unchanged)
          currentLine++;
        } else if (patchLine.startsWith("@@")) {
          // New hunk
          break;
        }

        patchIndex++;
      }

      const newContent = newLines.join("\n");

      // Show preview (Cursor-style)
      console.log(`  ${colors.gray}└ Patch ${colors.bold}${input.path}${colors.reset}${colors.gray} with ${colors.green}${addedLines.length} addition${addedLines.length !== 1 ? "s" : ""}${colors.gray} and ${colors.red}${removedLines.length} removal${removedLines.length !== 1 ? "s" : ""}${colors.reset}`);
      
      // Show removals with line numbers
      const maxPreview = 8;
      let lineNum = startLine + 1;
      removedLines.slice(0, maxPreview).forEach((line) => {
        const ln = String(lineNum).padStart(4, " ");
        console.log(`    ${colors.gray}${ln}${colors.reset} ${colors.red}-${colors.reset} ${colors.red}${line}${colors.reset}`);
      });
      if (removedLines.length > maxPreview) {
        console.log(`    ${colors.gray}     ... (${removedLines.length - maxPreview} more removals)${colors.reset}`);
      }
      
      // Show additions with line numbers
      lineNum = startLine + 1;
      addedLines.slice(0, maxPreview).forEach((line) => {
        const ln = String(lineNum).padStart(4, " ");
        console.log(`    ${colors.gray}${ln}${colors.reset} ${colors.green}+${colors.reset} ${colors.green}${line}${colors.reset}`);
        lineNum++;
      });
      if (addedLines.length > maxPreview) {
        console.log(`    ${colors.gray}     ... (${addedLines.length - maxPreview} more additions)${colors.reset}`);
      }

      // Ask for confirmation
      const question = `\n${colors.yellow}Apply patch? (y/n): ${colors.reset}`;
      const answer = await rl.question(question);

      if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
        await fs.writeFile(input.path, newContent, "utf-8");
        return "Patch successfully applied to file";
      } else {
        return "Patch cancelled by user";
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to apply patch: ${error}`);
    }
  },
};

// Helper to run a shell command and capture output (used internally)
const runShellCommand = (
  command: string,
  workingDir: string,
  timeoutMs: number,
  env: NodeJS.ProcessEnv = process.env
): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> => {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const child = spawn(command, [], {
      shell: true,
      cwd: workingDir,
      env: { ...env },
    });

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 5000);
    }, timeoutMs);

    child.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(colors.gray + text + colors.reset);
    });

    child.stderr.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      process.stdout.write(colors.yellow + text + colors.reset);
    });

    child.on("close", (code) => {
      clearTimeout(timeoutId);
      resolve({ stdout, stderr, exitCode: code ?? -1, timedOut });
    });

    child.on("error", (error) => {
      clearTimeout(timeoutId);
      resolve({ stdout, stderr: error.message, exitCode: -1, timedOut: false });
    });
  });
};

// Helper to install Java via Homebrew
const installJavaWithHomebrew = async (rl: readline.Interface): Promise<{ success: boolean; javaHome?: string }> => {
  console.log(`\n${colors.yellow}Java is not installed on this system.${colors.reset}`);
  console.log(`${colors.cyan}Would you like to install Java via Homebrew?${colors.reset}`);
  
  const answer = await rl.question(`\n${colors.yellow}Install Java? (y/n): ${colors.reset}`);
  
  if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
    return { success: false };
  }

  console.log(`\n${colors.cyan}Installing OpenJDK via Homebrew...${colors.reset}\n`);
  
  // First check if Homebrew is installed
  const brewCheck = await runShellCommand("which brew", process.cwd(), 10000);
  if (brewCheck.exitCode !== 0) {
    console.log(`\n${colors.red}Homebrew is not installed.${colors.reset}`);
    console.log(`${colors.yellow}Install Homebrew first: https://brew.sh${colors.reset}\n`);
    return { success: false };
  }

  // Install OpenJDK
  console.log(`${colors.cyan}Running: brew install openjdk${colors.reset}\n`);
  const installResult = await runShellCommand("brew install openjdk", process.cwd(), 300000); // 5 min timeout
  
  if (installResult.exitCode !== 0) {
    console.log(`\n${colors.red}Failed to install Java.${colors.reset}\n`);
    return { success: false };
  }

  // Get the Homebrew prefix and construct JAVA_HOME
  const prefixResult = await runShellCommand("brew --prefix openjdk", process.cwd(), 10000);
  const brewPrefix = prefixResult.stdout.trim();
  const javaHome = `${brewPrefix}/libexec/openjdk.jdk/Contents/Home`;

  console.log(`\n${colors.green}Java installed successfully!${colors.reset}`);
  console.log(`${colors.gray}JAVA_HOME: ${javaHome}${colors.reset}\n`);

  // Create symlink for system-wide access (optional, may require sudo)
  console.log(`${colors.cyan}Creating symlink for system Java access...${colors.reset}\n`);
  const symlinkCmd = `sudo ln -sfn ${brewPrefix}/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk.jdk 2>/dev/null || true`;
  await runShellCommand(symlinkCmd, process.cwd(), 30000);

  return { success: true, javaHome };
};

// Track Java installation state for the session
let sessionJavaHome: string | undefined = undefined;

const runCommandDefinition: ToolDefinition = {
  name: "run_command",
  description:
    "Execute a shell command and return the output. Use this to run tests (pytest, npm test), linters, build commands, or other CLI tools. The command runs in a shell with the working directory defaulting to the project root.",
  parameters: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description:
          "The shell command to execute (e.g., 'pytest tests/', 'npm test', 'python script.py')",
      },
      working_dir: {
        type: "string",
        description:
          "Optional working directory for the command. Defaults to current directory.",
      },
      timeout_seconds: {
        type: "number",
        description:
          "Optional timeout in seconds. Defaults to 60. Max 300 (5 minutes).",
      },
    },
    required: ["command"],
  },
  function: async (input: RunCommandInput) => {
    if (!input.command || typeof input.command !== "string") {
      throw new Error("Command must be a non-empty string");
    }

    if (!agentInstance) {
      throw new Error("Agent not initialized");
    }
    const rl = agentInstance.rl;

    // Validate and set timeout (default 60s, max 300s)
    const timeoutSeconds = Math.min(
      Math.max(input.timeout_seconds || 60, 1),
      300
    );
    const timeoutMs = timeoutSeconds * 1000;

    // Set working directory
    const workingDir = input.working_dir || process.cwd();

    // Show command preview (Cursor-style)
    console.log(`  ${colors.gray}└ Command: ${colors.white}${input.command}${colors.reset}`);
    if (input.working_dir) {
      console.log(`    ${colors.gray}cwd: ${workingDir}${colors.reset}`);
    }

    // Ask for confirmation
    const answer = await rl.question(
      `\n${colors.yellow}Run command? (y/n): ${colors.reset}`
    );

    if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
      return "Command cancelled by user";
    }

    console.log();

    // Build environment with Java if we've installed it this session
    const commandEnv: NodeJS.ProcessEnv = { ...process.env };
    if (sessionJavaHome) {
      commandEnv.JAVA_HOME = sessionJavaHome;
      commandEnv.PATH = `${sessionJavaHome}/bin:${process.env.PATH}`;
    }

    // Run the command
    const { stdout, stderr, exitCode, timedOut } = await runShellCommand(
      input.command,
      workingDir,
      timeoutMs,
      commandEnv
    );

    // Check for Java not installed error
    const combinedOutput = stdout + stderr;
    const javaNotInstalled = combinedOutput.includes("Unable to locate a Java Runtime") ||
                            combinedOutput.includes("No Java runtime present");

    if (javaNotInstalled && !sessionJavaHome) {
      // Offer to install Java
      const installResult = await installJavaWithHomebrew(rl);
      
      if (installResult.success && installResult.javaHome) {
        sessionJavaHome = installResult.javaHome;
        
        // Ask if user wants to retry the command
        const retryAnswer = await rl.question(
          `\n${colors.yellow}Retry the original command with Java? (y/n): ${colors.reset}`
        );
        
        if (retryAnswer.toLowerCase() === "y" || retryAnswer.toLowerCase() === "yes") {
          console.log(`\n${colors.cyan}Retrying command with Java...${colors.reset}\n`);
          
          // Build new environment with Java
          const javaEnv: NodeJS.ProcessEnv = { ...process.env };
          javaEnv.JAVA_HOME = sessionJavaHome;
          javaEnv.PATH = `${sessionJavaHome}/bin:${process.env.PATH}`;
          
          // Retry the command
          const retryResult = await runShellCommand(
            input.command,
            workingDir,
            timeoutMs,
            javaEnv
          );

          console.log("\n");
          if (retryResult.timedOut) {
            console.log(`  ${colors.gray}└ ${colors.yellow}Timed out after ${timeoutSeconds}s${colors.reset}\n`);
          } else if (retryResult.exitCode === 0) {
            console.log(`  ${colors.gray}└ ${colors.green}Exit code ${retryResult.exitCode}${colors.reset}\n`);
          } else {
            console.log(`  ${colors.gray}└ ${colors.red}Failed with exit code ${retryResult.exitCode}${colors.reset}\n`);
          }

          // Build result string
          let result = `Command: ${input.command}\n`;
          result += `Exit code: ${retryResult.exitCode}\n`;
          result += `Status: ${retryResult.timedOut ? "TIMEOUT" : retryResult.exitCode === 0 ? "SUCCESS" : "FAILED"}\n`;
          result += `Note: Java was installed via Homebrew (JAVA_HOME=${sessionJavaHome})\n`;

          if (retryResult.stdout.trim()) {
            const maxLength = 8000;
            const truncatedStdout =
              retryResult.stdout.length > maxLength
                ? retryResult.stdout.substring(0, maxLength) + "\n... (output truncated)"
                : retryResult.stdout;
            result += `\n--- STDOUT ---\n${truncatedStdout}`;
          }

          if (retryResult.stderr.trim()) {
            const maxLength = 4000;
            const truncatedStderr =
              retryResult.stderr.length > maxLength
                ? retryResult.stderr.substring(0, maxLength) + "\n... (stderr truncated)"
                : retryResult.stderr;
            result += `\n--- STDERR ---\n${truncatedStderr}`;
          }

          return result;
        }
      }
    }

    const success = exitCode === 0;

    console.log("\n");
    if (timedOut) {
      console.log(`  ${colors.gray}└ ${colors.yellow}Timed out after ${timeoutSeconds}s${colors.reset}\n`);
    } else if (success) {
      console.log(`  ${colors.gray}└ ${colors.green}Exit code ${exitCode}${colors.reset}\n`);
    } else {
      console.log(`  ${colors.gray}└ ${colors.red}Failed with exit code ${exitCode}${colors.reset}\n`);
    }

    // Build result string for the model
    let result = `Command: ${input.command}\n`;
    result += `Exit code: ${exitCode}\n`;
    result += `Status: ${timedOut ? "TIMEOUT" : success ? "SUCCESS" : "FAILED"}\n`;

    if (stdout.trim()) {
      // Limit output size to avoid token issues
      const maxLength = 8000;
      const truncatedStdout =
        stdout.length > maxLength
          ? stdout.substring(0, maxLength) + "\n... (output truncated)"
          : stdout;
      result += `\n--- STDOUT ---\n${truncatedStdout}`;
    }

    if (stderr.trim()) {
      const maxLength = 4000;
      const truncatedStderr =
        stderr.length > maxLength
          ? stderr.substring(0, maxLength) + "\n... (stderr truncated)"
          : stderr;
      result += `\n--- STDERR ---\n${truncatedStderr}`;
    }

    if (!stdout.trim() && !stderr.trim()) {
      result += "\n(No output)";
    }

    return result;
  },
};

// Testing Tools

interface RunTestsInput {
  language?: "python" | "java" | "all";
  mode?: "smoke" | "sanity" | "full";
  coverage?: boolean;
}

interface AnalyzeTestFailuresInput {
  test_output: string;
  language: "python" | "java";
}

interface GetCoverageInput {
  language: "python" | "java";
}

interface DetectChangedFilesInput {
  since?: string;
  language?: "python" | "java" | "all";
}

interface GenerateTestsInput {
  file_path: string;
  language: "python" | "java";
  coverage_data?: string;
}

interface AnalyzeCoverageGapsInput {
  language: "python" | "java";
  min_coverage?: number;
}

interface GenerateRegressionTestInput {
  bug_description: string;
  fixed_file: string;
  language: "python" | "java";
}

const runTestsDefinition: ToolDefinition = {
  name: "run_tests",
  description:
    "Run tests for Python and/or Java projects with structured output parsing. Supports smoke, sanity, and full test modes. Returns test results with pass/fail counts and detailed failure information.",
  parameters: {
    type: "object",
    properties: {
      language: {
        type: "string",
        enum: ["python", "java", "all"],
        description:
          "Language to test: python, java, or all (default: all)",
      },
      mode: {
        type: "string",
        enum: ["smoke", "sanity", "full"],
        description:
          "Test mode: smoke (fast critical tests), sanity (targeted tests), full (all tests) (default: full)",
      },
      coverage: {
        type: "boolean",
        description: "Generate coverage reports (default: false)",
      },
    },
  },
  function: async (input: RunTestsInput) => {
    try {
      const language = input.language || "all";
      const mode = input.mode || "full";
      const coverage = input.coverage || false;

      console.log(
        `\n${colors.blue}Running ${mode} tests for ${language}...${colors.reset}`
      );

      // Build command
      let command = `bash scripts/test-runner.sh --mode ${mode} --language ${language}`;
      if (coverage) {
        command += " --coverage";
      }

      // Execute test runner
      const result = await new Promise<string>((resolve, reject) => {
        const proc = spawn("bash", ["-c", command], {
          cwd: process.cwd(),
          shell: true,
        });

        let stdout = "";
        let stderr = "";

        proc.stdout.on("data", (data) => {
          const output = data.toString();
          stdout += output;
          process.stdout.write(output);
        });

        proc.stderr.on("data", (data) => {
          const output = data.toString();
          stderr += output;
          process.stderr.write(output);
        });

        proc.on("close", (exitCode) => {
          let result = `Test Execution Results\n`;
          result += `======================\n\n`;
          result += `Mode: ${mode}\n`;
          result += `Language: ${language}\n`;
          result += `Coverage: ${coverage ? "enabled" : "disabled"}\n`;
          result += `Exit Code: ${exitCode}\n`;
          result += `Status: ${exitCode === 0 ? "PASSED" : "FAILED"}\n\n`;

          if (stdout.trim()) {
            result += `--- OUTPUT ---\n${stdout}`;
          }

          if (stderr.trim()) {
            result += `\n--- ERRORS ---\n${stderr}`;
          }

          // Parse results from output
          const totalMatch = stdout.match(/Total Tests:\s+(\d+)/);
          const passedMatch = stdout.match(/Passed:\s+(\d+)/);
          const failedMatch = stdout.match(/Failed:\s+(\d+)/);

          if (totalMatch && passedMatch && failedMatch) {
            result += `\n\n--- SUMMARY ---\n`;
            result += `Total:  ${totalMatch[1]}\n`;
            result += `Passed: ${passedMatch[1]}\n`;
            result += `Failed: ${failedMatch[1]}\n`;
          }

          // Check for Python test report
          if (
            (language === "python" || language === "all") &&
            require("fs").existsSync("tests/python/test-report.json")
          ) {
            try {
              const reportData = require("fs").readFileSync(
                "tests/python/test-report.json",
                "utf-8"
              );
              const report = JSON.parse(reportData);

              if (report.tests && report.tests.length > 0) {
                result += `\n--- PYTHON TEST DETAILS ---\n`;
                report.tests.forEach((test: any) => {
                  if (test.outcome === "failed") {
                    result += `\n❌ ${test.nodeid}\n`;
                    if (test.call && test.call.longrepr) {
                      result += `   Error: ${test.call.longrepr}\n`;
                    }
                  }
                });
              }
            } catch (e) {
              // Ignore JSON parsing errors
            }
          }

          // Check for Java test reports
          if (language === "java" || language === "all") {
            const surefire = "tests/java/target/surefire-reports";
            if (require("fs").existsSync(surefire)) {
              result += `\n--- JAVA TEST REPORTS ---\n`;
              result += `Reports location: ${surefire}\n`;
            }
          }

          resolve(result);
        });

        proc.on("error", (error) => {
          reject(new Error(`Failed to run tests: ${error.message}`));
        });
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to run tests: ${error}`);
    }
  },
};

const analyzeTestFailuresDefinition: ToolDefinition = {
  name: "analyze_test_failures",
  description:
    "AI-powered analysis of test failures. Parses stack traces, identifies root causes, and suggests specific fixes. Use this after run_tests when failures occur.",
  parameters: {
    type: "object",
    properties: {
      test_output: {
        type: "string",
        description:
          "The test output containing failures and stack traces from run_tests",
      },
      language: {
        type: "string",
        enum: ["python", "java"],
        description: "Programming language of the tests",
      },
    },
    required: ["test_output", "language"],
  },
  function: async (input: AnalyzeTestFailuresInput) => {
    try {
      console.log(
        `\n${colors.yellow}Analyzing ${input.language} test failures...${colors.reset}\n`
      );

      // Extract failure information
      const failures: Array<{
        test: string;
        error: string;
        location?: string;
      }> = [];

      if (input.language === "python") {
        // Parse Python pytest failures
        const failurePattern = /FAILED (.*?) - (.*?)(?:\n|$)/g;
        let match;
        while ((match = failurePattern.exec(input.test_output)) !== null) {
          failures.push({
            test: match[1],
            error: match[2],
          });
        }

        // Extract stack traces
        const stackPattern = /(.*?):\d+: (.*?)$/gm;
        let stackMatch;
        while (
          (stackMatch = stackPattern.exec(input.test_output)) !== null
        ) {
          if (failures.length > 0) {
            failures[failures.length - 1].location = stackMatch[1];
          }
        }
      } else if (input.language === "java") {
        // Parse Java JUnit failures
        const failurePattern = /(?:FAILED|ERROR) (.*?)\((.*?)\)/g;
        let match;
        while ((match = failurePattern.exec(input.test_output)) !== null) {
          failures.push({
            test: `${match[2]}.${match[1]}`,
            error: "See stack trace below",
          });
        }
      }

      let analysis = `Test Failure Analysis (${input.language})\n`;
      analysis += `${"=".repeat(50)}\n\n`;
      analysis += `Found ${failures.length} test failure(s)\n\n`;

      for (let i = 0; i < failures.length; i++) {
        const failure = failures[i];
        analysis += `${i + 1}. ${failure.test}\n`;
        analysis += `   Error: ${failure.error}\n`;
        if (failure.location) {
          analysis += `   Location: ${failure.location}\n`;
        }
        analysis += `\n`;
      }

      analysis += `\nRecommended Actions:\n`;
      analysis += `1. Read the failing test files to understand expectations\n`;
      analysis += `2. Read the implementation files at failure locations\n`;
      analysis += `3. Identify the root cause (logic error, missing feature, incorrect assertion)\n`;
      analysis += `4. Apply fixes using edit_file tool\n`;
      analysis += `5. Rerun tests with run_tests to verify fixes\n\n`;

      analysis += `Detailed Output:\n`;
      analysis += `${"-".repeat(50)}\n`;
      analysis += input.test_output;

      return analysis;
    } catch (error) {
      throw new Error(`Failed to analyze test failures: ${error}`);
    }
  },
};

const getCoverageDefinition: ToolDefinition = {
  name: "get_coverage",
  description:
    "Get code coverage analysis for Python or Java tests. Returns coverage percentages, uncovered lines, and suggestions for additional tests.",
  parameters: {
    type: "object",
    properties: {
      language: {
        type: "string",
        enum: ["python", "java"],
        description: "Programming language to analyze coverage for",
      },
    },
    required: ["language"],
  },
  function: async (input: GetCoverageInput) => {
    try {
      console.log(
        `\n${colors.blue}Getting ${input.language} coverage...${colors.reset}\n`
      );

      let result = `Coverage Analysis (${input.language})\n`;
      result += `${"=".repeat(50)}\n\n`;

      if (input.language === "python") {
        // Check if coverage report exists
        const coverageFile = "tests/python/.coverage";
        const htmlReport = "tests/python/htmlcov/index.html";

        if (!require("fs").existsSync(coverageFile)) {
          return (
            result +
            "No coverage data found. Run tests with coverage:\n" +
            "  run_tests with coverage=true\n"
          );
        }

        // Run coverage report command
        const proc = spawn("bash", [
          "-c",
          "cd tests/python && python3 -m coverage report",
        ]);

        let stdout = "";
        let stderr = "";

        proc.stdout.on("data", (data) => {
          stdout += data.toString();
        });
        proc.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        await new Promise((resolve) => proc.on("close", resolve));

        result += `Coverage Report:\n${stdout}\n`;

        if (require("fs").existsSync(htmlReport)) {
          result += `\nDetailed HTML report: ${htmlReport}\n`;
        }
      } else if (input.language === "java") {
        // Check for JaCoCo report
        const jacocoReport = "tests/java/target/site/jacoco/index.html";
        const jacocoXml = "tests/java/target/site/jacoco/jacoco.xml";

        if (!require("fs").existsSync(jacocoXml)) {
          return (
            result +
            "No coverage data found. Run tests with coverage:\n" +
            "  run_tests with coverage=true\n"
          );
        }

        result += `JaCoCo coverage report generated\n`;
        result += `HTML report: ${jacocoReport}\n`;
        result += `XML report: ${jacocoXml}\n\n`;

        // Parse XML for summary (basic)
        try {
          const xmlData = require("fs").readFileSync(jacocoXml, "utf-8");
          const instructionMatch = xmlData.match(
            /<counter type="INSTRUCTION" missed="(\d+)" covered="(\d+)"/
          );
          const branchMatch = xmlData.match(
            /<counter type="BRANCH" missed="(\d+)" covered="(\d+)"/
          );
          const lineMatch = xmlData.match(
            /<counter type="LINE" missed="(\d+)" covered="(\d+)"/
          );

          if (instructionMatch) {
            const missed = parseInt(instructionMatch[1]);
            const covered = parseInt(instructionMatch[2]);
            const total = missed + covered;
            const percent = ((covered / total) * 100).toFixed(2);
            result += `Instruction Coverage: ${percent}% (${covered}/${total})\n`;
          }

          if (lineMatch) {
            const missed = parseInt(lineMatch[1]);
            const covered = parseInt(lineMatch[2]);
            const total = missed + covered;
            const percent = ((covered / total) * 100).toFixed(2);
            result += `Line Coverage: ${percent}% (${covered}/${total})\n`;
          }

          if (branchMatch) {
            const missed = parseInt(branchMatch[1]);
            const covered = parseInt(branchMatch[2]);
            const total = missed + covered;
            const percent = ((covered / total) * 100).toFixed(2);
            result += `Branch Coverage: ${percent}% (${covered}/${total})\n`;
          }
        } catch (e) {
          result += "Could not parse coverage XML\n";
        }
      }

      result += `\nNext Steps:\n`;
      result += `1. Review uncovered lines in the reports\n`;
      result += `2. Write additional tests for uncovered code paths\n`;
      result += `3. Focus on edge cases and error handling\n`;

      return result;
    } catch (error) {
      throw new Error(`Failed to get coverage: ${error}`);
    }
  },
};

const detectChangedFilesDefinition: ToolDefinition = {
  name: "detect_changed_files",
  description:
    "Detect files that have changed since a given commit or time period. Uses git to identify modified Python or Java files. Useful for running only affected tests.",
  parameters: {
    type: "object",
    properties: {
      since: {
        type: "string",
        description:
          "Git reference to compare against (e.g., 'HEAD~1', 'main', '1 day ago'). Default: HEAD",
      },
      language: {
        type: "string",
        enum: ["python", "java", "all"],
        description: "Filter by language (default: all)",
      },
    },
  },
  function: async (input: DetectChangedFilesInput) => {
    try {
      const since = input.since || "HEAD";
      const language = input.language || "all";

      console.log(
        `\n${colors.blue}Detecting changed files since ${since}...${colors.reset}\n`
      );

      // Get changed files from git
      const gitCommand = `git diff --name-only ${since}`;
      const proc = spawn("bash", ["-c", gitCommand]);

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      await new Promise((resolve) => proc.on("close", resolve));

      if (stderr) {
        throw new Error(`Git error: ${stderr}`);
      }

      const allFiles = stdout
        .split("\n")
        .filter((f) => f.trim())
        .map((f) => f.trim());

      // Filter by language
      let filteredFiles = allFiles;
      if (language === "python") {
        filteredFiles = allFiles.filter((f) => f.endsWith(".py"));
      } else if (language === "java") {
        filteredFiles = allFiles.filter((f) => f.endsWith(".java"));
      } else {
        filteredFiles = allFiles.filter(
          (f) => f.endsWith(".py") || f.endsWith(".java")
        );
      }

      let result = `Changed Files Analysis\n`;
      result += `${"=".repeat(50)}\n\n`;
      result += `Since: ${since}\n`;
      result += `Language Filter: ${language}\n`;
      result += `Total Changed: ${allFiles.length} files\n`;
      result += `Filtered: ${filteredFiles.length} files\n\n`;

      if (filteredFiles.length === 0) {
        result += "No changed files found.\n";
        return result;
      }

      result += `Changed Files:\n`;
      filteredFiles.forEach((file, idx) => {
        result += `${idx + 1}. ${file}\n`;
      });

      // Map to test files
      result += `\n--- Potentially Affected Tests ---\n`;
      const testFiles = new Set<string>();

      filteredFiles.forEach((file) => {
        if (file.endsWith(".py") && !file.includes("test_")) {
          // For Python, look for test_*.py
          const dir = require("path").dirname(file);
          const basename = require("path").basename(file, ".py");
          testFiles.add(`${dir}/test_${basename}.py`);
        } else if (file.endsWith(".java") && !file.includes("Test.java")) {
          // For Java, look for *Test.java
          const withoutExt = file.replace(".java", "");
          testFiles.add(`${withoutExt}Test.java`);
        }
      });

      if (testFiles.size > 0) {
        result += `Suggested test files to run:\n`;
        Array.from(testFiles).forEach((test, idx) => {
          result += `${idx + 1}. ${test}\n`;
        });
      } else {
        result += "No obvious test file mappings found.\n";
      }

      result += `\nRecommended Action:\n`;
      result += `Run tests for these files to verify changes:\n`;
      result += `  run_tests with appropriate filters\n`;

      return result;
    } catch (error) {
      throw new Error(`Failed to detect changed files: ${error}`);
    }
  },
};

const generateTestsDefinition: ToolDefinition = {
  name: "generate_tests",
  description:
    "AI-powered test generation for a given file. Analyzes the code, identifies functions/methods without tests, and generates comprehensive test cases including edge cases.",
  parameters: {
    type: "object",
    properties: {
      file_path: {
        type: "string",
        description: "Path to the source file to generate tests for",
      },
      language: {
        type: "string",
        enum: ["python", "java"],
        description: "Programming language of the file",
      },
      coverage_data: {
        type: "string",
        description:
          "Optional: Coverage data to identify specific uncovered lines",
      },
    },
    required: ["file_path", "language"],
  },
  function: async (input: GenerateTestsInput) => {
    try {
      console.log(
        `\n${colors.green}Generating tests for ${input.file_path}...${colors.reset}\n`
      );

      // Read the source file
      let sourceCode = "";
      try {
        sourceCode = await require("fs/promises").readFile(
          input.file_path,
          "utf-8"
        );
      } catch (err) {
        throw new Error(`Could not read file: ${input.file_path}`);
      }

      let result = `Test Generation Analysis\n`;
      result += `${"=".repeat(50)}\n\n`;
      result += `File: ${input.file_path}\n`;
      result += `Language: ${input.language}\n\n`;

      // Analyze the code structure
      if (input.language === "python") {
        result += `--- Python Code Analysis ---\n\n`;

        // Extract function definitions
        const functionPattern = /def\s+(\w+)\s*\([^)]*\):/g;
        const functions: string[] = [];
        let match;

        while ((match = functionPattern.exec(sourceCode)) !== null) {
          functions.push(match[1]);
        }

        result += `Found ${functions.length} function(s):\n`;
        functions.forEach((fn, idx) => {
          result += `${idx + 1}. ${fn}()\n`;
        });

        result += `\n--- Test Generation Strategy ---\n\n`;
        result += `For each function, generate tests for:\n`;
        result += `1. Happy path (valid inputs, expected outputs)\n`;
        result += `2. Edge cases (empty, None, zero, negative values)\n`;
        result += `3. Error cases (invalid types, out of range)\n`;
        result += `4. Boundary conditions (min/max values)\n\n`;

        result += `--- Suggested Test File ---\n\n`;
        const testFileName = input.file_path.replace(
          ".py",
          "_generated_test.py"
        );
        result += `File: ${testFileName}\n\n`;

        result += `Structure:\n`;
        result += `\`\`\`python\n`;
        result += `import pytest\n`;
        result += `from ${require("path").basename(input.file_path, ".py")} import *\n\n`;

        functions.forEach((fn) => {
          result += `class Test${fn.charAt(0).toUpperCase() + fn.slice(1)}:\n`;
          result += `    """Tests for ${fn} function"""\n\n`;
          result += `    def test_${fn}_happy_path(self):\n`;
          result += `        """Test ${fn} with valid inputs"""\n`;
          result += `        # TODO: Implement test\n`;
          result += `        pass\n\n`;
          result += `    def test_${fn}_edge_cases(self):\n`;
          result += `        """Test ${fn} with edge cases"""\n`;
          result += `        # TODO: Test empty, None, zero\n`;
          result += `        pass\n\n`;
          result += `    def test_${fn}_error_handling(self):\n`;
          result += `        """Test ${fn} error handling"""\n`;
          result += `        # TODO: Test invalid inputs\n`;
          result += `        pass\n\n`;
        });

        result += `\`\`\`\n\n`;
      } else if (input.language === "java") {
        result += `--- Java Code Analysis ---\n\n`;

        // Extract class and method definitions
        const classPattern = /class\s+(\w+)/g;
        const methodPattern =
          /(?:public|private|protected)\s+\w+\s+(\w+)\s*\([^)]*\)/g;

        const classes: string[] = [];
        const methods: string[] = [];

        let match;
        while ((match = classPattern.exec(sourceCode)) !== null) {
          classes.push(match[1]);
        }
        while ((match = methodPattern.exec(sourceCode)) !== null) {
          methods.push(match[1]);
        }

        result += `Found ${classes.length} class(es) and ${methods.length} method(s)\n\n`;

        if (classes.length > 0) {
          result += `Classes:\n`;
          classes.forEach((cls, idx) => {
            result += `${idx + 1}. ${cls}\n`;
          });
        }

        result += `\nMethods:\n`;
        methods.forEach((method, idx) => {
          result += `${idx + 1}. ${method}()\n`;
        });

        result += `\n--- Test Generation Strategy ---\n\n`;
        result += `For each method, generate tests for:\n`;
        result += `1. Happy path with valid inputs\n`;
        result += `2. Edge cases (null, empty, boundary values)\n`;
        result += `3. Exception handling\n`;
        result += `4. State verification\n\n`;

        result += `--- Suggested Test File ---\n\n`;
        const className = classes[0] || "Unknown";
        const testFileName = input.file_path.replace(".java", "Test.java");
        result += `File: ${testFileName}\n\n`;

        result += `Structure:\n`;
        result += `\`\`\`java\n`;
        result += `import org.junit.jupiter.api.Test;\n`;
        result += `import org.junit.jupiter.api.BeforeEach;\n`;
        result += `import static org.junit.jupiter.api.Assertions.*;\n\n`;
        result += `public class ${className}Test {\n\n`;
        result += `    private ${className} instance;\n\n`;
        result += `    @BeforeEach\n`;
        result += `    public void setUp() {\n`;
        result += `        instance = new ${className}();\n`;
        result += `    }\n\n`;

        methods.forEach((method) => {
          result += `    @Test\n`;
          result += `    public void test${method.charAt(0).toUpperCase() + method.slice(1)}HappyPath() {\n`;
          result += `        // TODO: Implement test\n`;
          result += `    }\n\n`;
          result += `    @Test\n`;
          result += `    public void test${method.charAt(0).toUpperCase() + method.slice(1)}EdgeCases() {\n`;
          result += `        // TODO: Test null, empty, boundary values\n`;
          result += `    }\n\n`;
        });

        result += `}\n`;
        result += `\`\`\`\n\n`;
      }

      result += `\n--- Next Steps ---\n`;
      result += `1. Review the suggested test structure\n`;
      result += `2. Use write_file to create the test file\n`;
      result += `3. Fill in test implementations based on the code logic\n`;
      result += `4. Run the tests with run_tests\n`;
      result += `5. Check coverage with get_coverage\n`;

      return result;
    } catch (error) {
      throw new Error(`Failed to generate tests: ${error}`);
    }
  },
};

const analyzeCoverageGapsDefinition: ToolDefinition = {
  name: "analyze_coverage_gaps",
  description:
    "Analyze code coverage to identify critical gaps. Highlights uncovered functions, branches, and lines. Prioritizes gaps by importance (public APIs, complex logic, error handling).",
  parameters: {
    type: "object",
    properties: {
      language: {
        type: "string",
        enum: ["python", "java"],
        description: "Programming language to analyze",
      },
      min_coverage: {
        type: "number",
        description:
          "Minimum acceptable coverage percentage (default: 80). Files below this are flagged.",
      },
    },
    required: ["language"],
  },
  function: async (input: AnalyzeCoverageGapsInput) => {
    try {
      const minCoverage = input.min_coverage || 80;

      console.log(
        `\n${colors.yellow}Analyzing coverage gaps for ${input.language}...${colors.reset}\n`
      );

      let result = `Coverage Gap Analysis\n`;
      result += `${"=".repeat(50)}\n\n`;
      result += `Language: ${input.language}\n`;
      result += `Minimum Threshold: ${minCoverage}%\n\n`;

      if (input.language === "python") {
        // Check for coverage data
        const coverageFile = "tests/python/.coverage";
        if (!require("fs").existsSync(coverageFile)) {
          return (
            result +
            "No coverage data found. Run tests with coverage first:\n" +
            "  run_tests({ language: 'python', coverage: true })\n"
          );
        }

        // Run coverage report with missing lines
        const proc = spawn("bash", [
          "-c",
          "cd tests/python && python3 -m coverage report --show-missing",
        ]);

        let stdout = "";
        proc.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        await new Promise((resolve) => proc.on("close", resolve));

        result += `--- Coverage Report ---\n${stdout}\n\n`;

        // Parse for files below threshold
        const lines = stdout.split("\n");
        const lowCoverageFiles: Array<{
          file: string;
          coverage: number;
          missing: string;
        }> = [];

        lines.forEach((line) => {
          const match = line.match(/(\S+\.py)\s+\d+\s+\d+\s+(\d+)%\s+(.*)/);
          if (match) {
            const [, file, coverage, missing] = match;
            const cov = parseInt(coverage);
            if (cov < minCoverage) {
              lowCoverageFiles.push({ file, coverage: cov, missing });
            }
          }
        });

        if (lowCoverageFiles.length > 0) {
          result += `--- Files Below ${minCoverage}% Coverage ---\n\n`;
          lowCoverageFiles.forEach((item, idx) => {
            result += `${idx + 1}. ${item.file} (${item.coverage}%)\n`;
            result += `   Missing lines: ${item.missing}\n\n`;
          });

          result += `\n--- Recommended Actions ---\n`;
          lowCoverageFiles.forEach((item, idx) => {
            result += `${idx + 1}. ${item.file}:\n`;
            result += `   - Read the file to understand uncovered code\n`;
            result += `   - Use generate_tests to create tests for missing lines\n`;
            result += `   - Focus on: error handling, edge cases, branches\n\n`;
          });
        } else {
          result += `✅ All files meet ${minCoverage}% coverage threshold!\n`;
        }
      } else if (input.language === "java") {
        // Check for JaCoCo report
        const jacocoXml = "tests/java/target/site/jacoco/jacoco.xml";
        if (!require("fs").existsSync(jacocoXml)) {
          return (
            result +
            "No coverage data found. Run tests with coverage first:\n" +
            "  run_tests({ language: 'java', coverage: true })\n"
          );
        }

        // Parse JaCoCo XML
        const xmlData = require("fs").readFileSync(jacocoXml, "utf-8");

        // Extract package/class coverage
        const packagePattern =
          /<package name="([^"]+)"[\s\S]*?<counter type="LINE" missed="(\d+)" covered="(\d+)"/g;
        let match;
        const packages: Array<{
          name: string;
          coverage: number;
          missed: number;
          covered: number;
        }> = [];

        while ((match = packagePattern.exec(xmlData)) !== null) {
          const name = match[1];
          const missed = parseInt(match[2]);
          const covered = parseInt(match[3]);
          const total = missed + covered;
          const coverage = total > 0 ? ((covered / total) * 100).toFixed(2) : 0;

          if (parseFloat(coverage.toString()) < minCoverage) {
            packages.push({
              name,
              coverage: parseFloat(coverage.toString()),
              missed,
              covered,
            });
          }
        }

        if (packages.length > 0) {
          result += `--- Packages Below ${minCoverage}% Coverage ---\n\n`;
          packages.forEach((pkg, idx) => {
            result += `${idx + 1}. ${pkg.name} (${pkg.coverage}%)\n`;
            result += `   Missed: ${pkg.missed} lines, Covered: ${pkg.covered} lines\n\n`;
          });

          result += `\n--- Recommended Actions ---\n`;
          packages.forEach((pkg, idx) => {
            result += `${idx + 1}. Package: ${pkg.name}\n`;
            result += `   - Review JaCoCo HTML report for detailed line-by-line coverage\n`;
            result += `   - Use generate_tests to create missing tests\n`;
            result += `   - Focus on uncovered branches and error paths\n\n`;
          });
        } else {
          result += `✅ All packages meet ${minCoverage}% coverage threshold!\n`;
        }

        result += `\nDetailed Report: tests/java/target/site/jacoco/index.html\n`;
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to analyze coverage gaps: ${error}`);
    }
  },
};

const generateRegressionTestDefinition: ToolDefinition = {
  name: "generate_regression_test",
  description:
    "Generate a regression test for a bug that was just fixed. Takes the bug description and fixed file, creates a test that verifies the fix and prevents the bug from reoccurring.",
  parameters: {
    type: "object",
    properties: {
      bug_description: {
        type: "string",
        description:
          "Description of the bug that was fixed (what was broken, how it was fixed)",
      },
      fixed_file: {
        type: "string",
        description: "Path to the file that was fixed",
      },
      language: {
        type: "string",
        enum: ["python", "java"],
        description: "Programming language",
      },
    },
    required: ["bug_description", "fixed_file", "language"],
  },
  function: async (input: GenerateRegressionTestInput) => {
    try {
      console.log(
        `\n${colors.magenta}Generating regression test...${colors.reset}\n`
      );

      let result = `Regression Test Generation\n`;
      result += `${"=".repeat(50)}\n\n`;
      result += `Bug: ${input.bug_description}\n`;
      result += `Fixed File: ${input.fixed_file}\n`;
      result += `Language: ${input.language}\n\n`;

      result += `--- Regression Test Strategy ---\n\n`;
      result += `A regression test should:\n`;
      result += `1. Reproduce the exact bug scenario\n`;
      result += `2. Verify the fix works correctly\n`;
      result += `3. Use clear naming: test_regression_[bug_description]\n`;
      result += `4. Include a comment explaining the original bug\n`;
      result += `5. Test edge cases related to the bug\n\n`;

      if (input.language === "python") {
        const testFileName = input.fixed_file.replace(
          ".py",
          "_regression_test.py"
        );
        result += `--- Suggested Test ---\n\n`;
        result += `File: ${testFileName}\n\n`;
        result += `\`\`\`python\n`;
        result += `import pytest\n`;
        result += `from ${require("path").basename(input.fixed_file, ".py")} import *\n\n`;
        result += `def test_regression_${input.bug_description.toLowerCase().replace(/\s+/g, "_").slice(0, 40)}():\n`;
        result += `    """\n`;
        result += `    Regression test for bug:\n`;
        result += `    ${input.bug_description}\n`;
        result += `    \n`;
        result += `    This test ensures the bug does not reoccur.\n`;
        result += `    """\n`;
        result += `    # Setup: Create the exact scenario that triggered the bug\n`;
        result += `    # TODO: Implement setup\n\n`;
        result += `    # Action: Execute the code that was previously failing\n`;
        result += `    # TODO: Implement action\n\n`;
        result += `    # Assert: Verify the fix works\n`;
        result += `    # TODO: Add assertions\n`;
        result += `    pass\n`;
        result += `\`\`\`\n\n`;
      } else if (input.language === "java") {
        const testFileName = input.fixed_file.replace(".java", "Test.java");
        result += `--- Suggested Test ---\n\n`;
        result += `File: ${testFileName}\n\n`;
        result += `\`\`\`java\n`;
        result += `import org.junit.jupiter.api.Test;\n`;
        result += `import org.junit.jupiter.api.DisplayName;\n`;
        result += `import static org.junit.jupiter.api.Assertions.*;\n\n`;
        result += `@Test\n`;
        result += `@DisplayName("Regression: ${input.bug_description.slice(0, 60)}")\n`;
        result += `public void testRegression${input.bug_description.replace(/\s+/g, "_").slice(0, 40)}() {\n`;
        result += `    // Regression test for: ${input.bug_description}\n`;
        result += `    // This test ensures the bug does not reoccur.\n\n`;
        result += `    // Setup: Create scenario that triggered the bug\n`;
        result += `    // TODO: Implement setup\n\n`;
        result += `    // Action: Execute code that was previously failing\n`;
        result += `    // TODO: Implement action\n\n`;
        result += `    // Assert: Verify the fix works\n`;
        result += `    // TODO: Add assertions\n`;
        result += `}\n`;
        result += `\`\`\`\n\n`;
      }

      result += `--- Next Steps ---\n`;
      result += `1. Use write_file to create the regression test\n`;
      result += `2. Fill in the TODO sections with:\n`;
      result += `   - Setup code that reproduces the bug scenario\n`;
      result += `   - Action code that triggers the previously buggy behavior\n`;
      result += `   - Assertions that verify the fix\n`;
      result += `3. Run the test to ensure it passes\n`;
      result += `4. Mark the test with @pytest.mark.regression (Python) or @Tag("regression") (Java)\n`;

      return result;
    } catch (error) {
      throw new Error(`Failed to generate regression test: ${error}`);
    }
  },
};

// Main function
async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error(
      `${colors.red}Error: OPENROUTER_API_KEY environment variable is not set${colors.reset}`
    );
    console.error("Get your API key from: https://openrouter.ai/keys");
    console.error("\nSet it in your .env file:");
    console.error("OPENROUTER_API_KEY=sk-or-v1-your-api-key-here");
    process.exit(1);
  }


  const tools = [
    readFileDefinition,
    listFilesDefinition,
    writeFileDefinition,
    editFileDefinition,
    scaffoldProjectDefinition,
    patchFileDefinition,
    runCommandDefinition,
    runTestsDefinition,
    analyzeTestFailuresDefinition,
    getCoverageDefinition,
    detectChangedFilesDefinition,
    generateTestsDefinition,
    analyzeCoverageGapsDefinition,
    generateRegressionTestDefinition,
  ];

  const agent = new AIAgent(apiKey, tools);
  agentInstance = agent; // Set global reference for tool confirmations

  try {
    await agent.run();
  } catch (error) {
    console.error(`${colors.red}Fatal error: ${error}${colors.reset}`);
    agent.close();
    process.exit(1);
  }
}

// Main execution
main().catch(console.error);

export { AIAgent, ToolDefinition };
