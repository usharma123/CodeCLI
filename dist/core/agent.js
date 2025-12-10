import OpenAI from "openai";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { colors } from "../utils/colors.js";
// Format tool name for display (e.g., "read_file" -> "Read")
const formatToolName = (name) => {
    const nameMap = {
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
const formatToolArgs = (name, args) => {
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
const formatResultSummary = (name, result) => {
    switch (name) {
        case "read_file": {
            const lines = result.split("\n").length;
            return `Read ${colors.bold}${lines}${colors.reset}${colors.gray} lines`;
        }
        case "list_files": {
            try {
                const files = JSON.parse(result);
                return `Listed ${colors.bold}${files.length}${colors.reset}${colors.gray} paths`;
            }
            catch {
                return "Listed files";
            }
        }
        case "write_file":
            return result.includes("created") ? "File created" : result.includes("overwritten") ? "File overwritten" : result;
        case "edit_file":
            return result.includes("updated") ? "Changes applied" : result;
        case "run_command": {
            if (result.includes("SUCCESS"))
                return `${colors.green}Completed successfully${colors.reset}`;
            if (result.includes("FAILED"))
                return `${colors.red}Failed${colors.reset}`;
            if (result.includes("TIMEOUT"))
                return `${colors.yellow}Timed out${colors.reset}`;
            if (result.includes("cancelled"))
                return `${colors.yellow}Cancelled${colors.reset}`;
            return "Completed";
        }
        case "run_tests": {
            if (result.includes("Status: PASSED"))
                return `${colors.green}All tests passed${colors.reset}`;
            if (result.includes("Status: FAILED"))
                return `${colors.red}Some tests failed${colors.reset}`;
            return "Tests completed";
        }
        case "analyze_test_failures":
            return "Analysis complete";
        case "get_coverage": {
            const match = result.match(/(\d+\.\d+)%/);
            if (match)
                return `Coverage: ${colors.bold}${match[1]}%${colors.reset}${colors.gray}`;
            return "Coverage report ready";
        }
        case "detect_changed_files": {
            const match = result.match(/Filtered: (\d+) files/);
            if (match)
                return `Found ${colors.bold}${match[1]}${colors.reset}${colors.gray} changed files`;
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
    client;
    rl; // Public so tools can access for confirmations
    tools;
    messages = [];
    retryCount = 0;
    maxRetries = 3;
    // Track repeated validation failures to prevent retry storms
    validationFailureCounts = new Map();
    constructor(apiKey, tools) {
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
    async run() {
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
        console.log(`${colors.gray}Using Claude Sonnet 4.5 via OpenRouter${colors.reset}\n`);
        process.on("SIGINT", () => {
            console.log("\n\nGoodbye!");
            this.rl.close();
            process.exit(0);
        });
        while (true) {
            try {
                const userInput = await this.rl.question(`\n${colors.blue}>${colors.reset} `);
                if (!userInput)
                    continue;
                // Reset retry count on new user input
                this.retryCount = 0;
                // Add user message to history
                this.messages.push({
                    role: "user",
                    content: userInput,
                });
                await this.processMessage();
            }
            catch (error) {
                console.error(`${colors.red}Error in main loop: ${error}${colors.reset}`);
                // Try to recover by removing problematic messages
                if (this.messages.length > 0) {
                    const lastMessage = this.messages[this.messages.length - 1];
                    if (lastMessage.role === "assistant" && lastMessage.tool_calls) {
                        console.log(`${colors.yellow}Recovering from tool call error...${colors.reset}`);
                        this.messages.pop(); // Remove the problematic assistant message
                        // Add a simple text response instead
                        this.messages.push({
                            role: "assistant",
                            content: "I encountered an error processing that request. Could you please rephrase what you need?",
                        });
                    }
                }
            }
        }
    }
    async processMessage() {
        try {
            // Prepare tools for OpenAI format
            const openAITools = this.tools.map((tool) => ({
                type: "function",
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
                        temperature: 0.3, // Sonnet works well with lower temp
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
                    }
                    else if (fallbackMessage.content) {
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
            }
            else if (message.content) {
                // Regular text response
                console.log(`\n${message.content}\n`);
            }
        }
        catch (error) {
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
            }
            else {
                throw error;
            }
        }
    }
    async handleToolCalls(toolCalls) {
        const toolCallResults = [];
        for (const toolCall of toolCalls) {
            const functionName = toolCall?.function?.name ?? "unknown";
            let functionArgs;
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
                        role: "tool",
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
            }
            catch (parseError) {
                const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
                console.log(`  ${colors.gray}└ ${colors.red}Parse error: ${errorMsg}${colors.reset}`);
                console.log(`${colors.gray}Raw arguments: ${toolCall.function.arguments}${colors.reset}\n`);
                // Send detailed error back to the model so it can fix itself
                toolCallResults.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
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
                const hasContentProp = functionArgs &&
                    Object.prototype.hasOwnProperty.call(functionArgs, "content");
                const contentIsString = hasContentProp && typeof functionArgs.content === "string";
                const pathIsString = functionArgs && typeof functionArgs.path === "string";
                if (!pathIsString || !hasContentProp || !contentIsString) {
                    const hint = 'write_file needs both "path" and "content" strings, e.g. {"path":"tests/python/test_agent.py","content":"...file contents..."}';
                    const signatureKey = `${functionName}:${JSON.stringify(functionArgs ?? {})}`;
                    const attempt = (this.validationFailureCounts.get(signatureKey) ?? 0) + 1;
                    this.validationFailureCounts.set(signatureKey, attempt);
                    console.log(`  ${colors.gray}└ ${colors.red}Missing required path/content${colors.reset}\n`);
                    const retryNote = attempt > 1
                        ? `Repeated invalid write_file call (#${attempt}). Do not retry until you include a "content" string with the full file text.`
                        : "";
                    toolCallResults.push({
                        tool_call_id: toolCall.id,
                        role: "tool",
                        content: `Tool Validation Error: ${hint}\nAttempt: ${attempt}${retryNote ? `\n${retryNote}` : ""}\n\nReceived: ${JSON.stringify(functionArgs, null, 2)}`,
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
                        role: "tool",
                        content: result,
                    });
                }
                catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    console.log(`  ${colors.gray}└ ${colors.red}Error: ${errorMsg}${colors.reset}\n`);
                    // Send detailed error back to the model so it can fix itself
                    toolCallResults.push({
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
                    });
                }
            }
            else {
                console.log(`  ${colors.gray}└ ${colors.red}Unknown tool${colors.reset}\n`);
                toolCallResults.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
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
                type: "function",
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
            }
            else if (followUpMessage.content) {
                // Task is complete, show final response
                console.log(`\n${followUpMessage.content}\n`);
            }
        }
        catch (followUpError) {
            // Silent fail - tools were executed
        }
    }
    close() {
        this.rl.close();
    }
    // Public method for processing user input from external UI (Ink)
    async processUserInput(userInput) {
        if (!userInput.trim())
            return;
        // Reset retry count on new user input
        this.retryCount = 0;
        // Add user message to history
        this.messages.push({
            role: "user",
            content: userInput,
        });
        await this.processMessage();
    }
}
export { AIAgent };
