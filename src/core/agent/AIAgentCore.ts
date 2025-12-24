/**
 * AIAgentCore - Main orchestrator for the AI coding agent
 *
 * Single Responsibility: Orchestrate the conversation flow between user, LLM, and tools
 */

import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { colors } from "../../utils/colors.js";
import { renderMarkdownToAnsi } from "../../utils/markdown.js";
import { emitStatus } from "../status.js";

import { CompletionService } from "./CompletionService.js";
import { MessageHistoryManager } from "./MessageHistoryManager.js";
import { ToolExecutor } from "./ToolExecutor.js";
import { TodoStateManager } from "./TodoStateManager.js";
import { PlanStateManager } from "./PlanStateManager.js";

import type {
  ToolDefinition,
  TodoItem,
  TodoState,
  Plan,
  PlanState,
  AgentOptions,
  ChatMessage,
} from "./types.js";

// System prompt for the AI agent
const SYSTEM_PROMPT = `You are an AI coding assistant with direct access to the file system and terminal. When the user asks you to create, read, edit, list files, or run commands, you MUST use the available tools to do it directly - do NOT give instructions for the user to do it manually.

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
- generate_mermaid_diagram: Scan a codebase and output a Mermaid flowchart of high-level module flow
- todo_write: Manage todo lists for multi-step tasks (create, update, track progress)
- plan_write: Create implementation plans for user approval (use with /plan command)

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

Plan Mode Usage (with /plan command):
- When user invokes /plan, explore the codebase first to understand context
- Use plan_write to create a structured implementation plan
- The plan will be shown to the user for approval
- User can approve, reject, or request modifications
- On approval, plan sections are converted to todos automatically

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
5. When fixing bugs, use generate_regression_test to prevent regressions`;

export class AIAgentCore {
  // Dependencies
  private completionService: CompletionService;
  private messageHistory: MessageHistoryManager;
  private toolExecutor: ToolExecutor;
  private todoManager: TodoStateManager;
  private planManager: PlanStateManager;

  // Public for backward compatibility (tools access rl for confirmations)
  public rl: readline.Interface | null = null;

  // Configuration
  public verboseTools: boolean = false;
  public maxToolOutputChars: number = 6000;
  public streamCommandOutput: boolean = false;
  public streamAssistantResponses: boolean = false;

  private readonly model: string = "minimax/minimax-m2.1";

  constructor(
    apiKey: string,
    tools: ToolDefinition[],
    createReadline: boolean = true,
    options: AgentOptions = {}
  ) {
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

    // Initialize completion service
    this.completionService = new CompletionService({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      model: this.model,
      timeout: 120000,
      streamAssistantResponses: this.streamAssistantResponses,
    });

    // Initialize message history with system prompt
    this.messageHistory = new MessageHistoryManager(this.completionService.getClient());
    this.messageHistory.setSystemPrompt(SYSTEM_PROMPT);

    // Initialize tool executor
    this.toolExecutor = new ToolExecutor({
      tools,
      verboseTools: this.verboseTools,
      maxToolOutputChars: this.maxToolOutputChars,
    });

    // Initialize state managers
    this.todoManager = new TodoStateManager();
    this.planManager = new PlanStateManager();

    // Only create readline interface if in TTY mode
    if (createReadline && process.stdin.isTTY) {
      this.rl = readline.createInterface({ input, output });
    }

    // Validate tool schemas on startup
    this.toolExecutor.validateToolSchemas();
  }

  /**
   * Interactive REPL loop
   */
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
    console.log(`${colors.gray}Safe mode enabled (ctrl+c to quit)${colors.reset}`);
    console.log(`${colors.gray}File changes require your approval before being applied${colors.reset}`);
    console.log(`${colors.gray}Using ${this.model} via OpenRouter${colors.reset}\n`);

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

        this.completionService.resetRetryCount();

        this.messageHistory.addMessage({
          role: "user",
          content: userInput,
        });

        await this.processMessage();
      } catch (error) {
        console.error(`${colors.red}Error in main loop: ${error}${colors.reset}`);
        this.handleMainLoopError();
      }
    }
  }

  /**
   * Process user input from external UI (Ink)
   */
  async processUserInput(userInput: string): Promise<void> {
    if (!userInput.trim()) return;

    this.completionService.resetRetryCount();

    this.messageHistory.addMessage({
      role: "user",
      content: userInput,
    });

    await this.processMessage();
  }

  /**
   * Process the current message and get AI response
   */
  private async processMessage(): Promise<void> {
    try {
      await this.messageHistory.trimIfNeeded();

      emitStatus({ phase: "thinking", message: "Thinking…" });

      const { message, elapsedSeconds, streamedContent, reasoningDetails } =
        await this.completionService.createCompletion({
          model: this.model,
          messages: this.messageHistory.getMessages() as any,
          tools: this.toolExecutor.getOpenAITools(),
          tool_choice: "auto",
          temperature: 0.3,
          max_tokens: 16384,
          reasoning: { max_tokens: 2000 },
        });

      // Display reasoning if available
      this.displayReasoning(reasoningDetails);

      const elapsed = elapsedSeconds.toFixed(1);
      if (!this.streamAssistantResponses) {
        console.log(`${colors.green}●${colors.reset} ${colors.gray}Response (${elapsed}s)${colors.reset}`);
      }

      // If tools are about to be called
      if (message.tool_calls && message.tool_calls.length > 0) {
        this.messageHistory.addMessage(message);
        emitStatus({ phase: "running_tools", message: "Running tools…" });
        await this.handleToolCalls(message.tool_calls);
        return;
      }

      // Check if model should have called tools but didn't
      if (!message.tool_calls && message.content) {
        const mentionsTools = message.content.match(/\b(read_file|write_file|edit_file|list_files|patch_file)\b/i);

        if (mentionsTools) {
          await this.retryWithToolEnforcement(streamedContent);
          return;
        }
      }

      // Add assistant message to history
      this.messageHistory.addMessage(message);

      // Handle text response
      if (message.content) {
        if (this.streamAssistantResponses) {
          this.toolExecutor.getOutputFormatter().maybePrintFormattedAfterStream(streamedContent);
        } else {
          console.log(`\n${renderMarkdownToAnsi(message.content)}\n`);
        }
        emitStatus({ phase: "idle", message: "" });
      }
    } catch (error: any) {
      await this.handleProcessMessageError(error);
    }
  }

  /**
   * Handle tool calls from the AI
   */
  private async handleToolCalls(toolCalls: any[]): Promise<void> {
    const toolCallResults = await this.toolExecutor.executeToolCalls(toolCalls);

    // Add ALL tool results to messages
    for (const result of toolCallResults) {
      this.messageHistory.addMessage(result as ChatMessage);
    }

    try {
      // Get follow-up response after tool execution
      emitStatus({ phase: "thinking", message: "Thinking…" });

      const { message: followUpMessage, streamedContent, reasoningDetails } =
        await this.completionService.createCompletion({
          model: this.model,
          messages: this.messageHistory.getMessages() as any,
          tools: this.toolExecutor.getOpenAITools(),
          tool_choice: "auto",
          temperature: 0.3,
          max_tokens: 16384,
          reasoning: { max_tokens: 2000 },
        });

      // Display follow-up reasoning
      this.displayReasoning(reasoningDetails);

      this.messageHistory.addMessage(followUpMessage);

      // Check if the model wants to call more tools
      if (followUpMessage.tool_calls && followUpMessage.tool_calls.length > 0) {
        emitStatus({ phase: "running_tools", message: "Running tools…" });
        await this.handleToolCalls(followUpMessage.tool_calls);
      } else if (followUpMessage.content) {
        if (this.streamAssistantResponses) {
          this.toolExecutor.getOutputFormatter().maybePrintFormattedAfterStream(streamedContent);
        } else {
          console.log(`\n${renderMarkdownToAnsi(followUpMessage.content)}\n`);
        }
        emitStatus({ phase: "idle", message: "" });
      }
    } catch (followUpError: any) {
      this.handleFollowUpError(followUpError);
    }
  }

  /**
   * Retry with tool enforcement when model should have used tools
   */
  private async retryWithToolEnforcement(originalStreamed: string): Promise<void> {
    console.log(`  ${colors.gray}└ Retrying with tool enforcement...${colors.reset}`);
    emitStatus({ phase: "thinking", message: "Thinking (retry)…" });

    const { message: fallbackMessage, streamedContent, reasoningDetails } =
      await this.completionService.createCompletion({
        model: this.model,
        messages: this.messageHistory.getMessages() as any,
        tools: this.toolExecutor.getOpenAITools(),
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 16384,
        reasoning: { max_tokens: 2000 },
      });

    this.displayReasoning(reasoningDetails);
    this.messageHistory.addMessage(fallbackMessage);

    if (fallbackMessage.tool_calls && fallbackMessage.tool_calls.length > 0) {
      emitStatus({ phase: "running_tools", message: "Running tools…" });
      await this.handleToolCalls(fallbackMessage.tool_calls);
    } else if (fallbackMessage.content) {
      if (this.streamAssistantResponses) {
        this.toolExecutor.getOutputFormatter().maybePrintFormattedAfterStream(streamedContent);
      } else {
        console.log(`\n${renderMarkdownToAnsi(fallbackMessage.content)}\n`);
      }
    }
  }

  /**
   * Display reasoning details from the model
   */
  private displayReasoning(reasoningDetails?: any[]): void {
    if (!reasoningDetails || reasoningDetails.length === 0) return;

    for (const detail of reasoningDetails) {
      if (detail.type === "reasoning.text" && detail.text) {
        const renderedReasoning = renderMarkdownToAnsi(detail.text.trim());
        const reasoningLines = renderedReasoning.split('\n');
        console.log(`\n${colors.cyan}┌─ Reasoning${colors.reset}`);
        reasoningLines.forEach((line: string) => {
          console.log(`${colors.cyan}│${colors.reset} ${line}`);
        });
        console.log(`${colors.cyan}└─${colors.reset}\n`);
      } else if (detail.type === "reasoning.summary" && detail.summary) {
        console.log(`${colors.gray}Reasoning: ${detail.summary}${colors.reset}`);
      }
    }
  }

  /**
   * Handle errors in the main loop
   */
  private handleMainLoopError(): void {
    const messages = this.messageHistory.getMessages();
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && lastMessage.tool_calls) {
        console.log(`${colors.yellow}Recovering from tool call error...${colors.reset}`);
        this.messageHistory.removeLastMessage();
        this.messageHistory.addMessage({
          role: "assistant",
          content: "I encountered an error processing that request. Could you please rephrase what you need?",
        });
      }
    }
  }

  /**
   * Handle errors during message processing
   */
  private async handleProcessMessageError(error: any): Promise<void> {
    // Identify schema validation errors (don't retry)
    const isSchemaError = error?.status === 400 &&
      (error?.message?.toLowerCase().includes('schema') ||
       error?.message?.toLowerCase().includes('additionalproperties') ||
       error?.message?.toLowerCase().includes('invalid parameters'));

    if (isSchemaError) {
      console.error(`${colors.red}Schema Validation Error - Code Fix Required${colors.reset}`);
      console.error(`The API rejected tool definitions. Check that all tools have:`);
      console.error(`  1. additionalProperties: false`);
      console.error(`  2. Valid parameter types`);
      console.error(`  3. Required fields defined in properties`);
      throw error;
    }

    // Retry on rate limits and server errors
    if (this.completionService.shouldRetry(error)) {
      const { attempt, delay } = this.completionService.incrementRetry();
      const { max } = this.completionService.getRetryInfo();
      const statusMsg = error.status === 429 ? "Rate limited" : "Server error";
      console.log(`  ${colors.gray}└ ${colors.yellow}${statusMsg}, retrying (${attempt}/${max})...${colors.reset}`);

      await new Promise(resolve => setTimeout(resolve, delay));
      await this.processMessage();
    } else {
      throw error;
    }
  }

  /**
   * Handle errors after tool execution follow-up
   */
  private handleFollowUpError(error: any): void {
    const errorMsg = error?.message || String(error);
    const statusCode = error?.status || 'unknown';
    console.log(`${colors.yellow}Warning: Follow-up response failed (status: ${statusCode})${colors.reset}`);
    console.log(`${colors.gray}Tools were executed successfully, but the model could not generate a summary.${colors.reset}`);

    if (error?.status && error.status >= 500) {
      console.log(`${colors.gray}Server error: ${errorMsg}${colors.reset}`);
    } else if (error?.status === 429) {
      console.log(`${colors.gray}Rate limit exceeded. Consider waiting before the next request.${colors.reset}`);
    } else {
      console.log(`${colors.gray}Error: ${errorMsg}${colors.reset}`);
    }
  }

  /**
   * Close the agent
   */
  close(): void {
    if (this.rl) {
      this.rl.close();
    }
  }

  // ============ Public API for backward compatibility ============

  /**
   * Update todos from the TodoWrite tool
   */
  public updateTodos(todos: TodoItem[]): void {
    this.todoManager.updateTodos(todos);
  }

  /**
   * Get current todos for UI display
   */
  public getTodos(): TodoState {
    return this.todoManager.getState();
  }

  /**
   * Get current model for UI display
   */
  public getModel(): string {
    return this.model;
  }

  /**
   * Update plan from the PlanWrite tool
   */
  public updatePlan(plan: Plan): void {
    this.planManager.updatePlan(plan);
  }

  /**
   * Get current plan state
   */
  public getPlanState(): PlanState {
    return this.planManager.getState();
  }

  /**
   * Approve the current plan
   */
  public async approvePlan(): Promise<void> {
    const todos = this.planManager.approve();
    if (todos.length > 0) {
      this.todoManager.updateTodos(todos);
    }

    // Add approval message to conversation
    this.messageHistory.addMessage({
      role: "user",
      content: `Plan approved. Proceed with implementation. The plan has been converted to ${todos.length} todo items. Start with the first task.`
    });

    // Continue processing
    await this.processMessage();
  }

  /**
   * Reject the current plan
   */
  public rejectPlan(): void {
    this.planManager.reject();

    // Add rejection message to conversation
    this.messageHistory.addMessage({
      role: "user",
      content: "Plan rejected. Please ask what I would like to do instead."
    });
  }

  /**
   * Request modification to the plan
   */
  public async modifyPlan(instructions: string): Promise<void> {
    this.planManager.requestModification(instructions);

    // Add modification request to conversation
    this.messageHistory.addMessage({
      role: "user",
      content: `Please modify the plan based on these instructions: ${instructions}\n\nCreate a new plan using the plan_write tool.`
    });

    // Continue processing
    await this.processMessage();
  }

  /**
   * Clear the current plan
   */
  public clearPlan(): void {
    this.planManager.clearPlan();
  }
}
