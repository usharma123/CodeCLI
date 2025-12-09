import OpenAI from "openai";
import * as fs from "fs/promises";
import * as path from "path";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { spawn } from "child_process";
import dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();
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

Test-Driven Development workflow:
1. Set up environment (venv for Python, npm install for Node)
2. Write tests using write_file
3. Run tests using run_command
4. If tests fail, read the output, fix the code using edit_file
5. Run tests again until they pass

Example:
User: "Create an index.html file with a simple page"
You should: Use write_file tool to create the file immediately
You should NOT: Say "Copy this code into a file named index.html"

User: "Run the Python tests and fix any failures"
You should: First ensure venv exists and pytest is installed, then run_command with "venv/bin/pytest tests/", fix failures with edit_file
You should NOT: Tell the user to set up the environment themselves`,
        });
    }
    async run() {
        // ASCII Art for AI Coding Agent - Cyan color
        console.log("\u001b[96m");
        console.log(`
   █████╗ ██╗     █████╗  ██████╗ ███████╗███╗   ██╗████████╗
  ██╔══██╗██║    ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
  ███████║██║    ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║
  ██╔══██║██║    ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║
  ██║  ██║██║    ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║
  ╚═╝  ╚═╝╚═╝    ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝

            🛡️  SAFE MODE: Preview & Confirm Changes  🛡️
`);
        console.log("\u001b[0m");
        console.log("Chat with your AI-powered coding agent (use 'ctrl-c' to quit)");
        console.log(`${colors.green}✓ File changes require your approval before being applied${colors.reset}`);
        console.log(`${colors.yellow}✓ Using Claude Sonnet 4.5 for reliable tool calling${colors.reset}\n`);
        process.on("SIGINT", () => {
            console.log("\n\nGoodbye!");
            this.rl.close();
            process.exit(0);
        });
        while (true) {
            try {
                const userInput = await this.rl.question("\u001b[94mYou\u001b[0m: ");
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
            console.log(`${colors.cyan}🤔 AI Agent is thinking...${colors.reset}`);
            // Call OpenRouter API with Claude Sonnet 4.5 model
            const completion = await this.client.chat.completions.create({
                model: "anthropic/claude-sonnet-4.5", // Using Claude Sonnet 4.5 for reliable tool calling
                messages: this.messages,
                tools: openAITools,
                tool_choice: "auto",
                temperature: 0.3, // Lower temperature for consistent tool calling
                max_tokens: 16384, // Large enough for write_file with full content
            });
            const message = completion.choices[0].message;
            console.log(`${colors.green}✓ Got response from Claude Sonnet 4.5${colors.reset}\n`);
            // Safety net: Check if model should have called tools but didn't
            // (This is rare with Claude Sonnet 4.5 but kept as a precaution)
            if (!message.tool_calls && message.content) {
                const mentionsTools = message.content.match(/\b(read_file|write_file|edit_file|list_files|patch_file)\b/i);
                if (mentionsTools) {
                    console.log(`${colors.yellow}⚠️  Model mentioned tools but didn't invoke them, retrying...${colors.reset}`);
                    console.log(`${colors.cyan}🤔 Fallback model is thinking...${colors.reset}`);
                    // Retry the same request with Sonnet as fallback
                    const fallbackCompletion = await this.client.chat.completions.create({
                        model: "anthropic/claude-4.5-sonnet",
                        messages: this.messages,
                        tools: openAITools,
                        tool_choice: "auto",
                        temperature: 0.3, // Sonnet works well with lower temp
                        max_tokens: 16384,
                    });
                    const fallbackMessage = fallbackCompletion.choices[0].message;
                    console.log(`${colors.green}✓ Got response from Claude Sonnet${colors.reset}\n`);
                    this.messages.push(fallbackMessage);
                    // Continue with fallback response
                    if (fallbackMessage.tool_calls && fallbackMessage.tool_calls.length > 0) {
                        await this.handleToolCalls(fallbackMessage.tool_calls);
                        return;
                    }
                    else if (fallbackMessage.content) {
                        console.log(`\u001b[96mAI Agent\u001b[0m: ${fallbackMessage.content}\n`);
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
                console.log(`\u001b[96mAI Agent\u001b[0m: ${message.content}\n`);
            }
        }
        catch (error) {
            if (error?.status === 400 && this.retryCount < this.maxRetries) {
                console.log(`${colors.yellow}API error, attempting recovery (${this.retryCount + 1}/${this.maxRetries})...${colors.reset}`);
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
        console.log(`${colors.bold}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.bold}${colors.cyan}🔧 Tool Calls (${toolCalls.length})${colors.reset}`);
        console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
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
                            console.log(`${colors.yellow}⚠️  Fixing unterminated string in arguments${colors.reset}`);
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
                            console.log(`${colors.yellow}⚠️  Adding ${finalOpenBraces - finalCloseBraces} missing closing brace(s)${colors.reset}`);
                        }
                        rawArgs = rawArgs + '}'.repeat(finalOpenBraces - finalCloseBraces);
                    }
                    if (openBrackets > closeBrackets) {
                        if (!wasTruncated) {
                            console.log(`${colors.yellow}⚠️  Adding ${openBrackets - closeBrackets} missing closing bracket(s)${colors.reset}`);
                        }
                        rawArgs = rawArgs + ']'.repeat(openBrackets - closeBrackets);
                    }
                    // Remove any trailing commas again after fixes
                    rawArgs = rawArgs.replace(/,(\s*[}\]])/g, '$1');
                    // Log truncation detection for write_file
                    if (wasTruncated) {
                        console.log(`${colors.red}⚠️  TRUNCATION DETECTED: ${truncationInfo}${colors.reset}`);
                    }
                }
                functionArgs = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;
                // If truncation was detected for write_file, skip execution and report
                if (wasTruncated && functionName === "write_file") {
                    console.log(`${colors.red}❌ write_file skipped due to truncated response${colors.reset}\n`);
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
                console.log(`${colors.red}❌ Failed to parse tool call: ${errorMsg}${colors.reset}`);
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
            // Show detailed tool call info
            console.log(`${colors.magenta}${colors.bold}Tool: ${functionName}${colors.reset}`);
            console.log(`${colors.gray}Arguments:${colors.reset}`);
            console.log(`${colors.gray}${JSON.stringify(functionArgs, null, 2)}${colors.reset}\n`);
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
                    console.log(`${colors.red}❌ write_file call skipped: missing required path/content${colors.reset}\n`);
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
                    console.log(`${colors.cyan}⏳ Executing ${functionName}...${colors.reset}`);
                    const result = await tool.function(functionArgs);
                    console.log(`${colors.green}✓ ${functionName} completed${colors.reset}`);
                    console.log(`${colors.gray}Result preview: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}${colors.reset}\n`);
                    toolCallResults.push({
                        tool_call_id: toolCall.id,
                        role: "tool",
                        content: result,
                    });
                }
                catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    console.log(`${colors.red}❌ ${functionName} failed: ${errorMsg}${colors.reset}\n`);
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
                console.log(`${colors.red}❌ Unknown tool: ${functionName}${colors.reset}`);
                console.log(`${colors.gray}Available tools: ${this.tools.map((t) => t.name).join(", ")}${colors.reset}\n`);
                toolCallResults.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    content: `Error: Unknown tool '${functionName}'. Available tools: ${this.tools
                        .map((t) => t.name)
                        .join(", ")}`,
                });
            }
        }
        console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
        // Add ALL tool results to messages
        for (const result of toolCallResults) {
            this.messages.push(result);
        }
        console.log(`${colors.cyan}🤔 Getting follow-up response...${colors.reset}`);
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
                console.log(`\u001b[96mAI Agent\u001b[0m: ${followUpMessage.content}\n`);
            }
        }
        catch (followUpError) {
            console.log(`${colors.yellow}Follow-up response failed, but tools were executed successfully${colors.reset}\n`);
        }
    }
    close() {
        this.rl.close();
    }
}
// Store reference to the agent instance for tool confirmations
let agentInstance = null;
const getConfirmInterface = () => {
    if (!agentInstance) {
        throw new Error("Agent not initialized");
    }
    return agentInstance.rl;
};
// Tool Implementations
const readFileDefinition = {
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
    function: async (input) => {
        try {
            console.log(`${colors.blue}📖 Reading: ${input.path}${colors.reset}`);
            const content = await fs.readFile(input.path, "utf-8");
            // Limit response size to avoid issues
            if (content.length > 10000) {
                return (content.substring(0, 10000) + "\n... (truncated, file too large)");
            }
            return content;
        }
        catch (error) {
            throw new Error(`Failed to read file: ${error}`);
        }
    },
};
const listFilesDefinition = {
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
    function: async (input) => {
        const dir = input.path || ".";
        try {
            console.log(`${colors.blue}📁 Listing files in: ${dir}${colors.reset}`);
            const files = [];
            async function walk(currentPath, basePath, depth = 0) {
                // Limit depth to avoid too many files
                if (depth > 3)
                    return;
                const entries = await fs.readdir(currentPath, { withFileTypes: true });
                for (const entry of entries) {
                    // Skip node_modules and .git directories
                    if (entry.name === "node_modules" ||
                        entry.name === ".git" ||
                        entry.name.startsWith(".")) {
                        continue;
                    }
                    const fullPath = path.join(currentPath, entry.name);
                    const relativePath = path.relative(basePath, fullPath);
                    if (entry.isDirectory()) {
                        files.push(relativePath + "/");
                        if (depth < 3) {
                            await walk(fullPath, basePath, depth + 1);
                        }
                    }
                    else {
                        files.push(relativePath);
                    }
                }
            }
            await walk(dir, dir);
            return JSON.stringify(files);
        }
        catch (error) {
            throw new Error(`Failed to list files: ${error}`);
        }
    },
};
const writeFileDefinition = {
    name: "write_file",
    description: "Create a new file or completely overwrite an existing file with the provided content.",
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
    function: async (input) => {
        if (!agentInstance) {
            throw new Error("Agent not initialized");
        }
        const rl = agentInstance.rl;
        try {
            // Validate input eagerly so the model gets actionable feedback
            if (!input.path || typeof input.path !== "string") {
                throw new Error("write_file requires a string 'path' (relative or absolute).");
            }
            const hasContentProp = input && Object.prototype.hasOwnProperty.call(input, "content");
            if (!hasContentProp) {
                throw new Error("write_file is missing the required 'content' string. Please call with both 'path' and the full file contents, e.g. {\"path\":\"tests/python/test_agent.py\",\"content\":\"...\"}.");
            }
            if (typeof input.content !== "string") {
                throw new Error("write_file 'content' must be a string (can be empty).");
            }
            // Check if file exists
            let fileExists = true;
            let currentContent = "";
            try {
                currentContent = await fs.readFile(input.path, "utf-8");
            }
            catch (error) {
                if (error.code === "ENOENT") {
                    fileExists = false;
                }
                else {
                    throw error;
                }
            }
            // Show preview
            console.log("\n" + colors.bold + colors.cyan + "═══ File Preview ═══" + colors.reset);
            console.log(`${colors.yellow}File: ${input.path}${colors.reset}`);
            if (fileExists) {
                console.log(`${colors.red}⚠️  This will OVERWRITE the existing file!${colors.reset}`);
            }
            // Show content preview (first 20 lines)
            const lines = input.content.split("\n");
            const previewLines = lines.slice(0, 20);
            console.log(`${colors.green}Content preview (first ${Math.min(20, lines.length)} lines):${colors.reset}`);
            console.log(colors.gray + previewLines.join("\n") + colors.reset);
            if (lines.length > 20) {
                console.log(colors.gray + `... (${lines.length - 20} more lines)` + colors.reset);
            }
            console.log("\n" + colors.cyan + "════════════════════" + colors.reset);
            // Ask for confirmation
            const question = fileExists
                ? `\n${colors.yellow}⚠️  Do you want to OVERWRITE ${input.path}? (y/n): ${colors.reset}`
                : `\n${colors.yellow}Do you want to create ${input.path}? (y/n): ${colors.reset}`;
            const answer = await rl.question(question);
            if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
                // Create directory if it doesn't exist
                const dir = path.dirname(input.path);
                if (dir !== ".") {
                    await fs.mkdir(dir, { recursive: true });
                }
                // Write the file
                await fs.writeFile(input.path, input.content, "utf-8");
                console.log(`${colors.green}✓ File ${fileExists ? "overwritten" : "created"} successfully!${colors.reset}\n`);
                return `File ${input.path} ${fileExists ? "overwritten" : "created"} successfully`;
            }
            else {
                console.log(`${colors.red}✗ Operation cancelled by user${colors.reset}\n`);
                return "Operation cancelled by user";
            }
        }
        catch (error) {
            console.log(`${colors.red}Error in write_file: ${error}${colors.reset}`);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Failed to write file: ${error}`);
        }
    },
};
const editFileDefinition = {
    name: "edit_file",
    description: "Edit a file by replacing specific text. Use this for partial file modifications.",
    parameters: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "The path to the file",
            },
            old_str: {
                type: "string",
                description: "Text to search for and replace. Use empty string to append to file.",
            },
            new_str: {
                type: "string",
                description: "Text to replace old_str with",
            },
        },
        required: ["path", "old_str", "new_str"],
    },
    function: async (input) => {
        if (!input.path || input.old_str === input.new_str) {
            throw new Error("Invalid input parameters");
        }
        if (!agentInstance) {
            throw new Error("Agent not initialized");
        }
        const rl = agentInstance.rl;
        try {
            let currentContent = "";
            let fileExists = true;
            try {
                currentContent = await fs.readFile(input.path, "utf-8");
            }
            catch (error) {
                if (error.code === "ENOENT") {
                    fileExists = false;
                    if (input.old_str !== "") {
                        throw new Error(`File ${input.path} does not exist. Use write_file to create new files.`);
                    }
                }
                else {
                    throw error;
                }
            }
            // Calculate new content
            let newContent;
            if (!fileExists) {
                newContent = input.new_str;
            }
            else {
                if (!currentContent.includes(input.old_str) && input.old_str !== "") {
                    throw new Error(`Text not found in file: "${input.old_str.substring(0, 50)}${input.old_str.length > 50 ? "..." : ""}"`);
                }
                newContent = currentContent.replace(input.old_str, input.new_str);
            }
            // Show preview
            console.log("\n" +
                colors.bold +
                colors.cyan +
                "═══ Change Preview ═══" +
                colors.reset);
            console.log(`${colors.yellow}File: ${input.path}${colors.reset}`);
            if (input.old_str && input.new_str) {
                const oldLines = input.old_str.split("\n");
                const newLines = input.new_str.split("\n");
                // Limit preview size
                const maxLines = 10;
                const oldPreview = oldLines.slice(0, maxLines);
                const newPreview = newLines.slice(0, maxLines);
                console.log(`${colors.red}--- Remove:${colors.reset}`);
                console.log(colors.red +
                    oldPreview.map((line) => "  " + line).join("\n") +
                    colors.reset);
                if (oldLines.length > maxLines) {
                    console.log(colors.red +
                        `  ... (${oldLines.length - maxLines} more lines)` +
                        colors.reset);
                }
                console.log(`${colors.green}+++ Add:${colors.reset}`);
                console.log(colors.green +
                    newPreview.map((line) => "  " + line).join("\n") +
                    colors.reset);
                if (newLines.length > maxLines) {
                    console.log(colors.green +
                        `  ... (${newLines.length - maxLines} more lines)` +
                        colors.reset);
                }
            }
            console.log("\n" + colors.cyan + "════════════════════" + colors.reset);
            // Ask for confirmation
            const question = `\n${colors.yellow}Do you want to apply these changes? (y/n): ${colors.reset}`;
            const answer = await rl.question(question);
            if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
                if (!fileExists) {
                    const dir = path.dirname(input.path);
                    if (dir !== ".") {
                        await fs.mkdir(dir, { recursive: true });
                    }
                }
                await fs.writeFile(input.path, newContent, "utf-8");
                console.log(`${colors.green}✓ Changes applied successfully!${colors.reset}\n`);
                return "File successfully updated";
            }
            else {
                console.log(`${colors.red}✗ Changes cancelled by user${colors.reset}\n`);
                return "Changes cancelled by user";
            }
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Failed to edit file: ${error}`);
        }
    },
};
const sanitizeName = (name) => {
    const safe = name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
    return safe || "app";
};
const getApiTemplate = (base, name) => {
    return [
        {
            path: `${base}/package.json`,
            content: JSON.stringify({
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
            }, null, 2),
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
const getChatbotTemplate = (base, name, model) => {
    const appName = name || "chatbot-api";
    const defaultModel = model || "anthropic/claude-3.5-sonnet";
    return [
        {
            path: `${base}/package.json`,
            content: JSON.stringify({
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
            }, null, 2),
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
const getStaticTemplate = (base, name) => [
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
const getReactTemplate = (base, name, includeApi) => {
    const files = [
        {
            path: `${base}/package.json`,
            content: JSON.stringify({
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
            }, null, 2),
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
        files.push(...getApiTemplate(`${base}/api`, `${name || "api"}-api`).map((file) => ({
            ...file,
            // Avoid nested package name collisions
            path: file.path,
        })));
    }
    return files;
};
const buildTemplateFiles = (input) => {
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
const scaffoldProjectDefinition = {
    name: "scaffold_project",
    description: "Scaffold a project using Bun. Supported templates: api, chatbot, static, react (include_api optional).",
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
                description: "Model identifier for chatbot template (e.g., anthropic/claude-3.5-sonnet)",
            },
            include_api: {
                type: "boolean",
                description: "For react template, also scaffold an API folder",
            },
        },
        required: ["template"],
    },
    function: async (input) => {
        const { baseDir, files, description } = buildTemplateFiles(input);
        const rl = getConfirmInterface();
        console.log(`${colors.cyan}Scaffold: ${description}${colors.reset} -> ${baseDir}`);
        console.log(`${colors.gray}Files to create:${colors.reset}\n${files
            .map((f) => ` - ${f.path}`)
            .join("\n")}\n`);
        const answer = await rl.question(`${colors.yellow}Proceed to scaffold into ${baseDir}? (y/n): ${colors.reset}`);
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
const patchFileDefinition = {
    name: "patch_file",
    description: "Apply a unified diff patch to a file. Use this to make complex multi-line changes. The patch should be in unified diff format.",
    parameters: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "The path to the file to patch",
            },
            patch: {
                type: "string",
                description: "The unified diff patch to apply. Should start with @@ line numbers and contain - lines (remove) and + lines (add).",
            },
        },
        required: ["path", "patch"],
    },
    function: async (input) => {
        if (!input.path || !input.patch) {
            throw new Error("Invalid input parameters");
        }
        if (!agentInstance) {
            throw new Error("Agent not initialized");
        }
        const rl = agentInstance.rl;
        try {
            // Read current file content
            let currentContent;
            try {
                currentContent = await fs.readFile(input.path, "utf-8");
            }
            catch (error) {
                if (error.code === "ENOENT") {
                    throw new Error(`File ${input.path} does not exist. Use write_file to create new files.`);
                }
                throw error;
            }
            // Parse and apply the patch
            const lines = currentContent.split("\n");
            const patchLines = input.patch.split("\n");
            // Find the @@ hunk header
            let hunkHeader = patchLines.find((line) => line.startsWith("@@"));
            if (!hunkHeader) {
                throw new Error("Invalid patch format: no @@ hunk header found. Patch should be in unified diff format.\n\n" +
                    "Example format:\n" +
                    "@@ -10,3 +10,4 @@\n" +
                    " unchanged line\n" +
                    "-removed line\n" +
                    "+added line\n\n" +
                    "Suggestion: For simple changes, use edit_file instead.");
            }
            // Extract line numbers from @@ -start,count +start,count @@
            // More flexible regex to handle various formats
            const match = hunkHeader.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
            if (!match) {
                console.log(`${colors.red}Failed to parse hunk header: "${hunkHeader}"${colors.reset}`);
                console.log(`${colors.yellow}This usually means the patch format is incomplete or incorrect.${colors.reset}`);
                console.log(`${colors.cyan}Suggestion: Use edit_file for simple string replacements instead.${colors.reset}\n`);
                throw new Error(`Invalid hunk header format.\n\n` +
                    `Expected format: "@@ -startLine,count +startLine,count @@"\n` +
                    `Got: "${hunkHeader}"\n\n` +
                    `Example of valid patch:\n` +
                    `@@ -5,3 +5,3 @@\n` +
                    ` function test() {\n` +
                    `-  console.log("old");\n` +
                    `+  console.log("new");\n` +
                    ` }\n\n` +
                    `Tip: For simple changes, use edit_file instead of patch_file.`);
            }
            const startLine = parseInt(match[1]) - 1; // Convert to 0-based index
            // Apply the patch
            const newLines = [...lines];
            let currentLine = startLine;
            let patchIndex = patchLines.findIndex((line) => line.startsWith("@@")) + 1;
            const removedLines = [];
            const addedLines = [];
            while (patchIndex < patchLines.length) {
                const patchLine = patchLines[patchIndex];
                if (patchLine.startsWith("-")) {
                    // Remove line
                    const lineContent = patchLine.substring(1);
                    removedLines.push(lineContent);
                    if (newLines[currentLine] === lineContent) {
                        newLines.splice(currentLine, 1);
                    }
                    else {
                        console.log(`${colors.yellow}⚠️  Warning: Line mismatch at ${currentLine + 1}${colors.reset}`);
                        console.log(`${colors.gray}Expected: "${lineContent}"${colors.reset}`);
                        console.log(`${colors.gray}Found: "${newLines[currentLine]}"${colors.reset}`);
                    }
                }
                else if (patchLine.startsWith("+")) {
                    // Add line
                    const lineContent = patchLine.substring(1);
                    addedLines.push(lineContent);
                    newLines.splice(currentLine, 0, lineContent);
                    currentLine++;
                }
                else if (patchLine.startsWith(" ")) {
                    // Context line (unchanged)
                    currentLine++;
                }
                else if (patchLine.startsWith("@@")) {
                    // New hunk
                    break;
                }
                patchIndex++;
            }
            const newContent = newLines.join("\n");
            // Show preview
            console.log("\n" +
                colors.bold +
                colors.cyan +
                "═══ Patch Preview ═══" +
                colors.reset);
            console.log(`${colors.yellow}File: ${input.path}${colors.reset}`);
            console.log(`${colors.gray}Starting at line ${startLine + 1}${colors.reset}\n`);
            console.log(`${colors.red}--- Lines to remove (${removedLines.length}):${colors.reset}`);
            removedLines.slice(0, 10).forEach((line, i) => {
                console.log(colors.red + `  ${i + 1}. ${line}` + colors.reset);
            });
            if (removedLines.length > 10) {
                console.log(colors.red + `  ... (${removedLines.length - 10} more lines)` + colors.reset);
            }
            console.log(`\n${colors.green}+++ Lines to add (${addedLines.length}):${colors.reset}`);
            addedLines.slice(0, 10).forEach((line, i) => {
                console.log(colors.green + `  ${i + 1}. ${line}` + colors.reset);
            });
            if (addedLines.length > 10) {
                console.log(colors.green + `  ... (${addedLines.length - 10} more lines)` + colors.reset);
            }
            console.log("\n" + colors.cyan + "════════════════════" + colors.reset);
            // Ask for confirmation
            const question = `\n${colors.yellow}Do you want to apply this patch? (y/n): ${colors.reset}`;
            const answer = await rl.question(question);
            if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
                await fs.writeFile(input.path, newContent, "utf-8");
                console.log(`${colors.green}✓ Patch applied successfully!${colors.reset}\n`);
                return "Patch successfully applied to file";
            }
            else {
                console.log(`${colors.red}✗ Patch cancelled by user${colors.reset}\n`);
                return "Patch cancelled by user";
            }
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Failed to apply patch: ${error}`);
        }
    },
};
const runCommandDefinition = {
    name: "run_command",
    description: "Execute a shell command and return the output. Use this to run tests (pytest, npm test), linters, build commands, or other CLI tools. The command runs in a shell with the working directory defaulting to the project root.",
    parameters: {
        type: "object",
        properties: {
            command: {
                type: "string",
                description: "The shell command to execute (e.g., 'pytest tests/', 'npm test', 'python script.py')",
            },
            working_dir: {
                type: "string",
                description: "Optional working directory for the command. Defaults to current directory.",
            },
            timeout_seconds: {
                type: "number",
                description: "Optional timeout in seconds. Defaults to 60. Max 300 (5 minutes).",
            },
        },
        required: ["command"],
    },
    function: async (input) => {
        if (!input.command || typeof input.command !== "string") {
            throw new Error("Command must be a non-empty string");
        }
        if (!agentInstance) {
            throw new Error("Agent not initialized");
        }
        const rl = agentInstance.rl;
        // Validate and set timeout (default 60s, max 300s)
        const timeoutSeconds = Math.min(Math.max(input.timeout_seconds || 60, 1), 300);
        const timeoutMs = timeoutSeconds * 1000;
        // Set working directory
        const workingDir = input.working_dir || process.cwd();
        // Show command preview
        console.log("\n" + colors.bold + colors.cyan + "═══ Command Preview ═══" + colors.reset);
        console.log(`${colors.yellow}Command: ${input.command}${colors.reset}`);
        console.log(`${colors.gray}Working directory: ${workingDir}${colors.reset}`);
        console.log(`${colors.gray}Timeout: ${timeoutSeconds} seconds${colors.reset}`);
        console.log("\n" + colors.cyan + "════════════════════" + colors.reset);
        // Ask for confirmation
        const answer = await rl.question(`\n${colors.yellow}Do you want to run this command? (y/n): ${colors.reset}`);
        if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
            console.log(`${colors.red}✗ Command cancelled by user${colors.reset}\n`);
            return "Command cancelled by user";
        }
        console.log(`${colors.cyan}⏳ Running command...${colors.reset}\n`);
        return new Promise((resolve) => {
            let stdout = "";
            let stderr = "";
            let timedOut = false;
            // Use shell to run the command
            const child = spawn(input.command, [], {
                shell: true,
                cwd: workingDir,
                env: { ...process.env },
            });
            // Set timeout
            const timeoutId = setTimeout(() => {
                timedOut = true;
                child.kill("SIGTERM");
                // Force kill after 5 more seconds if still running
                setTimeout(() => child.kill("SIGKILL"), 5000);
            }, timeoutMs);
            child.stdout.on("data", (data) => {
                const text = data.toString();
                stdout += text;
                // Stream output to console in real-time
                process.stdout.write(colors.gray + text + colors.reset);
            });
            child.stderr.on("data", (data) => {
                const text = data.toString();
                stderr += text;
                // Stream stderr in yellow
                process.stdout.write(colors.yellow + text + colors.reset);
            });
            child.on("close", (code) => {
                clearTimeout(timeoutId);
                const exitCode = code ?? -1;
                const success = exitCode === 0;
                console.log("\n");
                if (timedOut) {
                    console.log(`${colors.red}⏱️  Command timed out after ${timeoutSeconds} seconds${colors.reset}\n`);
                }
                else if (success) {
                    console.log(`${colors.green}✓ Command completed with exit code ${exitCode}${colors.reset}\n`);
                }
                else {
                    console.log(`${colors.red}✗ Command failed with exit code ${exitCode}${colors.reset}\n`);
                }
                // Build result string for the model
                let result = `Command: ${input.command}\n`;
                result += `Exit code: ${exitCode}\n`;
                result += `Status: ${timedOut ? "TIMEOUT" : success ? "SUCCESS" : "FAILED"}\n`;
                if (stdout.trim()) {
                    // Limit output size to avoid token issues
                    const maxLength = 8000;
                    const truncatedStdout = stdout.length > maxLength
                        ? stdout.substring(0, maxLength) + "\n... (output truncated)"
                        : stdout;
                    result += `\n--- STDOUT ---\n${truncatedStdout}`;
                }
                if (stderr.trim()) {
                    const maxLength = 4000;
                    const truncatedStderr = stderr.length > maxLength
                        ? stderr.substring(0, maxLength) + "\n... (stderr truncated)"
                        : stderr;
                    result += `\n--- STDERR ---\n${truncatedStderr}`;
                }
                if (!stdout.trim() && !stderr.trim()) {
                    result += "\n(No output)";
                }
                resolve(result);
            });
            child.on("error", (error) => {
                clearTimeout(timeoutId);
                console.log(`${colors.red}✗ Command error: ${error.message}${colors.reset}\n`);
                resolve(`Command failed to start: ${error.message}`);
            });
        });
    },
};
// Main function
async function main() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error(`${colors.red}Error: OPENROUTER_API_KEY environment variable is not set${colors.reset}`);
        console.error("Get your API key from: https://openrouter.ai/keys");
        console.error("\nSet it in your .env file:");
        console.error("OPENROUTER_API_KEY=sk-or-v1-your-api-key-here");
        process.exit(1);
    }
    console.log(`${colors.green}Initializing AI Coding Agent...${colors.reset}`);
    console.log("Model: Claude Sonnet 4.5 (Anthropic's latest coding model)");
    console.log("API: OpenRouter (unified AI model gateway)");
    console.log(`${colors.yellow}Mode: Safe Mode with Error Recovery${colors.reset}\n`);
    const tools = [
        readFileDefinition,
        listFilesDefinition,
        writeFileDefinition,
        editFileDefinition,
        scaffoldProjectDefinition,
        patchFileDefinition,
        runCommandDefinition,
    ];
    const agent = new AIAgent(apiKey, tools);
    agentInstance = agent; // Set global reference for tool confirmations
    try {
        await agent.run();
    }
    catch (error) {
        console.error(`${colors.red}Fatal error: ${error}${colors.reset}`);
        agent.close();
        process.exit(1);
    }
}
// Main execution
main().catch(console.error);
export { AIAgent };
