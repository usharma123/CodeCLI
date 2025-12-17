# CodeCLI

An AI-powered coding assistant CLI built with TypeScript/Bun. Uses OpenRouter API with Claude Sonnet 4.5 to help you write, test, and understand code through natural language commands.

## Features

- **File Operations**: Read, write, edit files with safe-mode confirmations
- **Multi-Agent Architecture**: Main agent delegates to specialized sub-agents (FileSystemAgent, AnalysisAgent) for heavy operations
- **Testing Framework**: AI-powered test generation, execution, and failure analysis for Python & Java
- **Project Scaffolding**: Bootstrap projects (API, chatbot, React, static sites)
- **Codebase Analysis**: Generate Mermaid flowcharts, explore codebases, analyze architecture
- **Spring Boot Support**: Auto-detection and component-aware test generation
- **Terminal UI**: React/Ink-based interactive interface with task tracking

## Quick Start

```bash
# Install dependencies
bun install

# Set up API key
echo "OPENROUTER_API_KEY=sk-or-v1-your-key" > .env

# Run the agent
bun start
```

## Usage Examples

```
> Generate tests for UserService.java
> Analyze the architecture of this codebase
> Create a new Next.js chatbot project
> Run all tests and fix any failures
> Show me a flowchart of module dependencies
```

## Architecture

- **Main Agent**: Sequential AI agent with tool calling
- **Sub-Agents**: Specialized agents for exploration and analysis (enable with `ENABLE_SUB_AGENTS=true`)
- **Tools**: 20+ tools for files, commands, testing, scaffolding, diagrams
- **UI**: Ink/React components for terminal interface

## Project Structure

```
CodeCLI/
├── src/
│   ├── index.ts                 # Main CLI entry point
│   ├── core/                    # Agent runtime & tools
│   │   ├── agent.ts            # AI agent implementation
│   │   ├── agent-system/       # Multi-agent infrastructure
│   │   └── tools/              # Tool definitions
│   └── ui/                     # Ink/React terminal UI
├── tests/                       # Multi-language test suites
├── scripts/                     # Test runners & utilities
└── docs/                        # Feature guides

```
## Agent Workflow

The AI Coding Agent processes requests in several coordinated steps to ensure accurate results and robust handling of complex coding tasks. Here’s an overview of its workflow:

1. **User Request**: The process begins when you enter a prompt (e.g., “Generate tests for UserService.java”).
2. **Context Management**: The agent trims history and context to fit within model limits, preserving important parts like system prompts and recent exchanges.
3. **Intent & Planning**: The agent asks the LLM to determine intent—does the request need tool use (code analysis, test generation, etc.) or can it be answered directly?
4. **Plan Explanation**: When a tool action is needed, the agent requests a concise plan from the LLM and updates you (the user) with a plain language summary.
5. **Tool Call Drafting**: The agent instructs the LLM to draft the required tool calls as structured JSON.
6. **Repair & Validation**: The agent auto-fixes common LLM issues (like malformed or truncated JSON) and validates tool input for correctness and type safety.
7. **Tool Execution / Dispatch**:
   - **Local Tools**: Simple operations (`read_file`, `run_cmd`) are executed directly.
   - **Sub-Agents**: Complex, context-heavy requests (exploration, large-scale analysis) are delegated to dedicated sub-agents for more specialized processing.
8. **Result Collection & Iteration**: Results from tool execution are captured and added back to the context. The cycle may repeat as needed (e.g., additional data required, multi-step plans).
9. **Final Response**: Once all tasks are complete, the agent synthesizes and returns the final answer, ready for a new request.

**Status events** like `thinking`, `running_tools`, and `summarizing` are surfaced in the terminal UI to indicate progress.

### Visual Workflow

![Project Structure Diagram](image/Workflow.png)

## Documentation

- [Setup Guide](docs/SETUP.md)
- [Quick Start](docs/QUICKSTART.md)
- [Features](docs/FEATURES.md)
- [Testing Framework](docs/TESTING_IMPLEMENTATION.md)
- [Spring Boot Testing](docs/SPRINGBOOT_TESTING.md)

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript (ESM)
- **UI**: Ink (React for CLIs)
- **AI**: OpenRouter API (Claude Sonnet 4.5)
- **Testing**: PyTest (Python), JUnit 5 (Java)
