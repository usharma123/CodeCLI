import OpenAI from "openai";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { ToolDefinition } from "./types.js";
import { colors } from "../utils/colors.js";
import { renderMarkdownToAnsi } from "../utils/markdown.js";
import { emitStatus } from "./status.js";
import { emitToolOutput } from "./output.js";

interface AgentOptions {
  verboseTools?: boolean;
  maxToolOutputChars?: number;
  streamCommandOutput?: boolean;
  streamAssistantResponses?: boolean;
  enableIntermediateReasoning?: boolean;
}

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
    todo_write: "TodoWrite",
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
    case "todo_write": {
      const todoCount = args.todos?.length || 0;
      const inProgress = args.todos?.find((t: any) => t.status === "in_progress");
      return inProgress
        ? `${todoCount} todos (current: ${inProgress.content})`
        : `${todoCount} todos`;
    }
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
    case "todo_write": {
      // Parse the result to count todos by status
      const lines = result.split("\n");
      const pendingCount = lines.filter(l => l.startsWith("○")).length;
      const inProgressCount = lines.filter(l => l.startsWith("→")).length;
      const completedCount = lines.filter(l => l.startsWith("✓")).length;
      const total = pendingCount + inProgressCount + completedCount;

      const parts = [];
      if (completedCount > 0) parts.push(`${colors.green}${completedCount} completed${colors.reset}${colors.gray}`);
      if (inProgressCount > 0) parts.push(`${colors.yellow}${inProgressCount} in progress${colors.reset}${colors.gray}`);
      if (pendingCount > 0) parts.push(`${pendingCount} pending`);

      return `${total} todos (${parts.join(", ")})`;
    }
    default:
      return result.length > 50 ? result.substring(0, 47) + "..." : result;
  }
};

// AI Coding Agent Class
class AIAgent {
  private client: OpenAI;
  public rl: readline.Interface | null = null; // Public so tools can access for confirmations
  private tools: ToolDefinition[];
  private messages: any[] = [];
  private retryCount: number = 0;
  private maxRetries: number = 3;
  public verboseTools: boolean = false;
  public maxToolOutputChars: number = 6000;
  // Streaming can conflict with Ink rendering; default to off.
  public streamCommandOutput: boolean = false;
  public streamAssistantResponses: boolean = false;
  // Track repeated validation failures to prevent retry storms
  private validationFailureCounts: Map<string, number> = new Map();
  private maxMessagesInHistory: number = 40; // Keep last 40 messages (20 exchanges) plus system prompt
  private maxTokenEstimate: number = 12000; // Leave buffer below 16384 max_tokens
  // Todo list and reasoning state
  private currentTodos: import("./types.js").TodoState = { todos: [], lastUpdated: 0 };
  private reasoningCheckpoints: import("./types.js").ReasoningCheckpoint[] = [];
  private enableIntermediateReasoning: boolean = true;

  constructor(
    apiKey: string,
    tools: ToolDefinition[],
    createReadline: boolean = true,
    options: AgentOptions = {}
  ) {
    // Configure OpenAI client to use OpenRouter's API
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://github.com/yourusername/ai-coding-agent",
        "X-Title": "AI Coding Agent",
      },
      timeout: 120000, // 2 minute timeout for API calls
    });

    this.tools = tools;

    // Only create readline interface if in TTY mode
    if (createReadline && process.stdin.isTTY) {
      this.rl = readline.createInterface({ input, output });
    }

    // Apply runtime options
    if (typeof options.verboseTools === "boolean") {
      this.verboseTools = options.verboseTools;
    }
    if (typeof options.maxToolOutputChars === "number") {
      this.maxToolOutputChars = options.maxToolOutputChars;
    }
    if (typeof options.streamCommandOutput === "boolean") {
      this.streamCommandOutput = options.streamCommandOutput;
    }
    if (typeof options.streamAssistantResponses === "boolean") {
      this.streamAssistantResponses = options.streamAssistantResponses;
    }
    if (typeof options.enableIntermediateReasoning === "boolean") {
      this.enableIntermediateReasoning = options.enableIntermediateReasoning;
    }

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
- todo_write: Manage todo lists for multi-step tasks (create, update, track progress)

Tool selection guide:
- For NEW files: Use write_file
- For EDITING files: Use edit_file (find the exact text to replace)
- For COMPLEX multi-hunk patches: Use patch_file (only if you can generate perfect unified diff format)
- For RUNNING tests: Use run_command with pytest, npm test, etc.
- For BUILDING/LINTING: Use run_command

Heavy Operations (⚡):
Some tools are marked with ⚡ indicating they are context-intensive operations:
- explore_codebase: Large-scale file exploration (use for 5+ files, complex patterns)
- analyze_code_implementation: Deep architectural analysis across multiple files
- bulk_file_operations: Batch operations on many files (5+ files)

When to use heavy operations:
- ⚡ explore_codebase: When you need to understand unfamiliar parts of a large codebase
- ⚡ analyze_code_implementation: When you need architectural insights across many files
- ⚡ bulk_file_operations: When reading/searching 5+ files at once

When NOT to use heavy operations:
- Single file? Use read_file, NOT explore_codebase or bulk_file_operations
- 2-3 files? Read them directly with read_file, NOT bulk operations
- Quick search? Use grep or glob, NOT explore_codebase
- Simple code? Read it directly, NOT analyze_code_implementation

These heavy tools consume significant context and should only be used when the scope genuinely requires them.

Todo List Usage:
- When starting a task with 3+ steps, call todo_write to create a plan
- Update todos as you progress through work
- Only ONE todo should be "in_progress" at a time
- Mark todos "completed" immediately after finishing each task
- Add new todos if you discover additional work needed

Example todo_write call:
{
  "todos": [
    {
      "content": "Create user model",
      "activeForm": "Creating user model",
      "status": "completed"
    },
    {
      "content": "Implement auth endpoints",
      "activeForm": "Implementing auth endpoints",
      "status": "in_progress"
    },
    {
      "content": "Add login form",
      "activeForm": "Adding login form",
      "status": "pending"
    }
  ]
}

User-visible progress notes:
- When you are NOT about to call tools, start your response with 1–3 short bullets describing what you did for the user (high-level, no internal reasoning).

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

  // Estimate token count (rough approximation: 1 token ≈ 4 characters)
  private estimateTokens(messages: any[]): number {
    let totalChars = 0;
    for (const msg of messages) {
      if (msg.content) {
        totalChars += msg.content.length;
      }
      if (msg.tool_calls) {
        totalChars += JSON.stringify(msg.tool_calls).length;
      }
    }
    return Math.ceil(totalChars / 4);
  }

  // Manage context window to prevent exceeding token limits
  private trimContextWindow(): void {
    if (this.messages.length <= 1) return; // Keep at least system prompt

    // Check if we need to trim by message count
    if (this.messages.length > this.maxMessagesInHistory + 1) {
      // Keep system prompt (first message) and last N messages
      const systemPrompt = this.messages[0];
      const recentMessages = this.messages.slice(-(this.maxMessagesInHistory));
      this.messages = [systemPrompt, ...recentMessages];
      console.log(`${colors.gray}  (Trimmed conversation history to last ${this.maxMessagesInHistory} messages)${colors.reset}`);
    }

    // Check if we need to trim by token count
    const estimatedTokens = this.estimateTokens(this.messages);
    if (estimatedTokens > this.maxTokenEstimate) {
      // More aggressive trimming - keep system prompt and last 20 messages
      const systemPrompt = this.messages[0];
      const recentMessages = this.messages.slice(-20);
      this.messages = [systemPrompt, ...recentMessages];
      console.log(`${colors.gray}  (Trimmed conversation history due to token limit)${colors.reset}`);
    }

    // Clean up validation failure counts to prevent memory leak
    // Keep only the last 20 entries (most recent failures)
    if (this.validationFailureCounts.size > 20) {
      const entries = Array.from(this.validationFailureCounts.entries());
      this.validationFailureCounts.clear();
      // Keep the last 20 entries
      entries.slice(-20).forEach(([key, value]) => {
        this.validationFailureCounts.set(key, value);
      });
    }
  }

  async run(): Promise<void> {
    if (!this.rl) {
      throw new Error("Cannot run in non-interactive mode. Readline interface not initialized.");
    }

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
      if (this.rl) {
        this.rl.close();
      }
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
      // Trim context window before making API call
      this.trimContextWindow();

      // Prepare tools for OpenAI format
      const openAITools = this.tools.map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));

      emitStatus({ phase: "thinking", message: "Thinking…" });
      const { message, elapsedSeconds, streamedContent } =
        await this.createCompletion({
          model: "anthropic/claude-sonnet-4.5",
          messages: this.messages,
          tools: openAITools,
          tool_choice: "auto",
          temperature: 0.3,
          max_tokens: 16384,
        });

      const elapsed = elapsedSeconds.toFixed(1);
      if (!this.streamAssistantResponses) {
        console.log(
          `${colors.green}●${colors.reset} ${colors.gray}Response (${elapsed}s)${colors.reset}`
        );
      }

      // Add intermediate reasoning if tools are about to be called
      if (message.tool_calls && message.tool_calls.length > 0 && this.enableIntermediateReasoning) {
        this.messages.push(message); // Original assistant message with tool calls

        const reasoningPrompt = {
          role: "user",
          content: `In 1 sentence, explain what you're about to do and why. Be direct and concise - no formatting, bullets, or redundant phrases like "What I learned" or "What's next".`
        };
        this.messages.push(reasoningPrompt);

        emitStatus({ phase: "thinking", message: "Planning approach…" });

        try {
          const { message: reasoningMsg } = await this.createCompletion({
            model: "anthropic/claude-sonnet-4.5",
            messages: this.messages,
            tools: [], // No tools for reasoning phase
            temperature: 0.3,
            max_tokens: 150
          });

          if (reasoningMsg.content) {
            // Display reasoning with styled blockquote and proper markdown rendering
            const renderedContent = renderMarkdownToAnsi(reasoningMsg.content.trim());
            const reasoningLines = renderedContent.split('\n');
            console.log(`\n${colors.cyan}┌─ Reasoning${colors.reset}`);
            reasoningLines.forEach((line: string) => {
              console.log(`${colors.cyan}│${colors.reset} ${line}`);
            });
            console.log(`${colors.cyan}└─${colors.reset}\n`);

            this.reasoningCheckpoints.push({
              phase: "analysis",
              reasoning: reasoningMsg.content,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.log(`${colors.gray}(Skipping reasoning due to API error)${colors.reset}`);
        }

        // Remove reasoning prompt from history
        this.messages.pop();

        // Continue with tool execution
        emitStatus({ phase: "running_tools", message: "Running tools…" });
        await this.handleToolCalls(message.tool_calls);
        return;
      }

      // Safety net: Check if model should have called tools but didn't
      // (This is rare with Claude Sonnet 4.5 but kept as a precaution)
      if (!message.tool_calls && message.content) {
        const mentionsTools = message.content.match(/\b(read_file|write_file|edit_file|list_files|patch_file)\b/i);

        if (mentionsTools) {
          console.log(
            `  ${colors.gray}└ Retrying with tool enforcement...${colors.reset}`
          );
          emitStatus({ phase: "thinking", message: "Thinking (retry)…" });
          const { message: fallbackMessage, streamedContent: fallbackStreamed } =
            await this.createCompletion({
              model: "anthropic/claude-sonnet-4.5",
              messages: this.messages,
              tools: openAITools,
              tool_choice: "auto",
              temperature: 0.3,
              max_tokens: 16384,
            });

          this.messages.push(fallbackMessage);

          // Continue with fallback response
          if (fallbackMessage.tool_calls && fallbackMessage.tool_calls.length > 0) {
            emitStatus({ phase: "running_tools", message: "Running tools…" });
            await this.handleToolCalls(fallbackMessage.tool_calls);
            return;
          } else if (fallbackMessage.content) {
            if (this.streamAssistantResponses) {
              this.maybePrintFormattedAfterStream(fallbackStreamed);
            } else {
              console.log(`\n${renderMarkdownToAnsi(fallbackMessage.content)}\n`);
            }
            return;
          }
        }
      }

      // Add assistant message to history
      this.messages.push(message);

      // Handle proper tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        emitStatus({ phase: "running_tools", message: "Running tools…" });
        await this.handleToolCalls(message.tool_calls);
      } else if (message.content) {
        // Regular text response
        if (this.streamAssistantResponses) {
          this.maybePrintFormattedAfterStream(streamedContent);
        } else {
          console.log(`\n${renderMarkdownToAnsi(message.content)}\n`);
        }
        emitStatus({ phase: "idle", message: "" });
      }
    } catch (error: any) {
      // Retry on rate limits (429) and server errors (500, 502, 503, 504)
      const retryableStatuses = [429, 500, 502, 503, 504];
      const shouldRetry = error?.status && retryableStatuses.includes(error.status) && this.retryCount < this.maxRetries;

      if (shouldRetry) {
        this.retryCount++;
        const statusMsg = error.status === 429 ? "Rate limited" : "Server error";
        console.log(`  ${colors.gray}└ ${colors.yellow}${statusMsg}, retrying (${this.retryCount}/${this.maxRetries})...${colors.reset}`);

        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, this.retryCount - 1), 10000); // Max 10 seconds
        await new Promise(resolve => setTimeout(resolve, waitTime));

        // Retry without modifying messages
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
          this.printToolOutput(functionName, functionArgs, result);

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

    // Add mid-execution reasoning if enabled
    if (this.enableIntermediateReasoning && toolCallResults.length > 0) {
      const reasoningPrompt = {
        role: "user",
        content: `In 1 brief sentence, state what you'll do next ONLY if it's a new/different step. If you're continuing the same task or done, just say "Continuing..." or "Task complete." No formatting or labels.`
      };

      this.messages.push(reasoningPrompt);

      try {
        const { message: midReasoning } = await this.createCompletion({
          model: "anthropic/claude-sonnet-4.5",
          messages: this.messages,
          tools: [],
          temperature: 0.3,
          max_tokens: 150
        });

        if (midReasoning.content) {
          const renderedContent = renderMarkdownToAnsi(midReasoning.content.trim());
          const statusLines = renderedContent.split('\n');
          console.log(`\n${colors.yellow}┌─ Status${colors.reset}`);
          statusLines.forEach((line: string) => {
            console.log(`${colors.yellow}│${colors.reset} ${line}`);
          });
          console.log(`${colors.yellow}└─${colors.reset}\n`);

          this.reasoningCheckpoints.push({
            phase: "execution",
            reasoning: midReasoning.content,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.log(`${colors.gray}(Skipping status update due to API error)${colors.reset}`);
      }

      this.messages.pop();
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
      emitStatus({ phase: "summarizing", message: "Summarizing…" });
      const { message: followUpMessage, streamedContent } =
        await this.createCompletion({
          model: "anthropic/claude-sonnet-4.5",
          messages: this.messages,
          tools: openAITools,
          tool_choice: "auto",
          temperature: 0.3,
          max_tokens: 16384,
        });
      this.messages.push(followUpMessage);

      // Check if the model wants to call more tools
      if (followUpMessage.tool_calls && followUpMessage.tool_calls.length > 0) {
        // Continue the tool calling loop
        emitStatus({ phase: "running_tools", message: "Running tools…" });
        await this.handleToolCalls(followUpMessage.tool_calls);
      } else if (followUpMessage.content) {
        // Task is complete, show final response
        if (this.streamAssistantResponses) {
          this.maybePrintFormattedAfterStream(streamedContent);
        } else {
          console.log(`\n${renderMarkdownToAnsi(followUpMessage.content)}\n`);
        }
        emitStatus({ phase: "idle", message: "" });
      }
    } catch (followUpError: any) {
      // Log the error but don't fail the entire operation since tools were already executed
      const errorMsg = followUpError?.message || String(followUpError);
      const statusCode = followUpError?.status || 'unknown';
      console.log(`${colors.yellow}Warning: Follow-up response failed (status: ${statusCode})${colors.reset}`);
      console.log(`${colors.gray}Tools were executed successfully, but the model could not generate a summary.${colors.reset}`);

      // Log detailed error for debugging
      if (followUpError?.status && followUpError.status >= 500) {
        console.log(`${colors.gray}Server error: ${errorMsg}${colors.reset}`);
      } else if (followUpError?.status === 429) {
        console.log(`${colors.gray}Rate limit exceeded. Consider waiting before the next request.${colors.reset}`);
      } else {
        console.log(`${colors.gray}Error: ${errorMsg}${colors.reset}`);
      }
    }
  }

  close(): void {
    if (this.rl) {
      this.rl.close();
    }
  }

  // Public method for processing user input from external UI (Ink)
  async processUserInput(userInput: string): Promise<void> {
    if (!userInput.trim()) return;

    // Reset retry count on new user input
    this.retryCount = 0;

    // Add user message to history
    this.messages.push({
      role: "user",
      content: userInput,
    });

    await this.processMessage();
  }

  // Public method to update todos from the TodoWrite tool
  public updateTodos(todos: import("./types.js").TodoItem[]): void {
    this.currentTodos = {
      todos: todos.map((t, i) => ({
        ...t,
        id: t.id || `todo_${Date.now()}_${i}`,
        createdAt: t.createdAt || Date.now()
      })),
      lastUpdated: Date.now()
    };

    // Emit status update for in-progress todo
    const inProgress = todos.find(t => t.status === "in_progress");
    if (inProgress) {
      emitStatus({
        phase: "running_tools",
        message: inProgress.activeForm
      });
    }
  }

  // Public method to get current todos for UI display
  public getTodos(): import("./types.js").TodoState {
    return this.currentTodos;
  }

  private async createCompletion(request: any): Promise<{
    message: any;
    elapsedSeconds: number;
    streamedContent: string;
  }> {
    const start = Date.now();

    if (!this.streamAssistantResponses) {
      const completion = await this.client.chat.completions.create(request);
      const message = completion.choices[0].message;
      const content = message.content ?? "";
      return {
        message,
        elapsedSeconds: (Date.now() - start) / 1000,
        streamedContent: content,
      };
    }

    const stream = await this.client.chat.completions.create({
      ...request,
      stream: true,
    });

    let content = "";
    const toolCallsByIndex: any[] = [];

    for await (const chunk of stream as any) {
      const delta = chunk.choices?.[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        content += delta.content;
        process.stdout.write(delta.content);
      }

      if (delta.tool_calls) {
        for (const call of delta.tool_calls) {
          const index = call.index ?? 0;
          if (!toolCallsByIndex[index]) {
            toolCallsByIndex[index] = {
              id: call.id,
              type: call.type ?? "function",
              function: { name: "", arguments: "" },
            };
          }
          if (call.id) toolCallsByIndex[index].id = call.id;
          if (call.function?.name) {
            toolCallsByIndex[index].function.name = call.function.name;
          }
          if (call.function?.arguments) {
            toolCallsByIndex[index].function.arguments += call.function.arguments;
          }
        }
      }
    }

    process.stdout.write("\n");

    const message: any = { role: "assistant" };
    if (content) message.content = content;
    const toolCalls = toolCallsByIndex.filter(Boolean);
    if (toolCalls.length > 0) {
      message.tool_calls = toolCalls;
    }

    return {
      message,
      elapsedSeconds: (Date.now() - start) / 1000,
      streamedContent: content,
    };
  }

  private maybePrintFormattedAfterStream(content: string): void {
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

  private printToolOutput(functionName: string, args: any, result: string): void {
    const defaultOutputTools = new Set([
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
      "generate_performance_test",
      "parse_prd",
      "generate_tests_from_prd",
      "scaffold_project",
      "todo_write",
    ]);

    if (!this.verboseTools && !defaultOutputTools.has(functionName)) {
      return;
    }

    let outputText = result || "";
    const fullResult = outputText; // Store full result before truncation

    if (!this.verboseTools) {
      // Avoid duplicating already-streamed outputs from long-running tools.
      if (functionName === "run_command" || functionName === "run_tests") {
        const splitIndex = outputText.search(/^\s*--- (STDOUT|OUTPUT|ERRORS) ---/m);
        if (splitIndex !== -1) {
          outputText = outputText.slice(0, splitIndex).trimEnd();
        }
      }

      outputText = this.truncateText(outputText, this.maxToolOutputChars);
    }

    if (!outputText.trim()) return;

    // Emit tool output event for expandable display
    const isTruncated = outputText !== fullResult;
    emitToolOutput({
      toolName: functionName,
      args: args,
      result: fullResult,
      displayedResult: outputText,
      isTruncated: isTruncated,
      timestamp: Date.now()
    });

    const rendered =
      outputText.length < 30000
        ? renderMarkdownToAnsi(outputText)
        : outputText;

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

  private truncateText(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    return (
      text.substring(0, maxChars) +
      `\n... (truncated, ${text.length - maxChars} chars more)`
    );
  }
}

export { AIAgent };
