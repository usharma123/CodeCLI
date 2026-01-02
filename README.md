# CodeCLI

An AI-powered coding assistant CLI built with TypeScript/Bun. Uses OpenRouter API with MiniMax M2.1 to help you write, test, and understand code through natural language commands.

## Features

### Core Capabilities
- **File Operations**: Read, write, edit files with safe-mode confirmations
- **Multi-Agent Architecture**: Main agent delegates to specialized sub-agents (FileSystemAgent, AnalysisAgent) for heavy operations
- **Agent System**: Create, manage, and use specialized AI agents for different tasks with custom prompts and permissions
- **Testing Framework**: AI-powered test generation, execution, and failure analysis for Python & Java
- **Project Scaffolding**: Bootstrap projects (API, chatbot, React, static sites)
- **Codebase Analysis**: Generate Mermaid flowcharts (PNG/SVG/ascii), explore codebases, analyze architecture
- **Spring Boot Support**: Auto-detection and component-aware test generation
- **PRD-to-Code Workflow**: Automatically parse Product Requirements Documents (PDF/MD/TXT) into actionable tasks and test suites
- **Terminal UI**: React/Ink-based interactive interface with task tracking
- **Cost-Optimized Model**: Uses MiniMax M2.1 with native reasoning for high performance at lower cost
- **Interactive Games**: Built-in Tic Tac Toe game (2-player or vs AI with 3 difficulty levels)

### Advanced Testing Tools
- **Integration Tests**: Generate integration tests that verify interactions between multiple components or modules with mocks/stubs
- **E2E Tests**: Generate end-to-end test scenarios simulating real user journeys for web/API/CLI applications
- **API Tests**: Comprehensive API test suites including endpoint testing, schema validation, and contract testing
- **Performance Tests**: Generate load, stress, spike, and endurance tests using k6, JMeter, Locust, or Artillery
- **Regression Tests**: Create tests for fixed bugs to prevent reoccurrences

### Session & Context Management
- **Session Persistence**: Auto-save conversations to `~/.codecli/sessions/` with session ID generation and resume capability
- **Context Compaction**: Automatic conversation summarization for long-running tasks to stay within token limits
- **Token Tracking**: Real-time token usage monitoring and cost estimation per session

### Logging & Event System
- **Severity Logging**: Structured logging with debug, info, success, warning, error, and critical levels with color-coded output
- **Agent Events**: Real-time event system for multi-agent coordination including status, task, communication, and metrics events

### Code Analysis & Utilities
- **Path Resolver**: Multi-module project support with intelligent test file path resolution
- **CLIgnore Support**: `.clignore` file patterns for filtering file operations (similar to .gitignore)
- **Diff Rendering**: Color-coded unified diffs with inline changes, line numbers, and compact mode options
- **Build Tool Detection**: Auto-detect Maven/Gradle and configure source/test directories accordingly
- **Spring Boot Detection**: Component-aware test generation for controllers, services, repositories, and configurations

## Quick Start

```bash
# Install dependencies
bun install

# Set up API key (MiniMax M2.1 via OpenRouter)
echo "OPENROUTER_API_KEY=sk-or-v1-your-key" > .env

# Run the agent
bun start
```

### Session Management
```bash
# Start new session (default)
bun start

# Resume previous session
bun start --resume

# Load specific session
bun start --session=<session-id>

# Disable session persistence
bun start --no-session
```

> **Note**: Default model is MiniMax M2.1 (~95% cheaper than Claude). Update `this.model` in `src/core/agent.ts` to switch models.

## Usage Examples

```
> Generate tests for UserService.java
> Analyze the architecture of this codebase
> Create a new Next.js chatbot project
> Run all tests and fix any failures
> Show me a flowchart of module dependencies
> Process my PRD and create implementation tasks
> Generate integration tests for UserService and AuthService
> Create a performance test for the /api/users endpoint
> Compare test runs and show coverage changes
```

## Model Pricing

The CLI tracks token usage and costs automatically. Default model pricing (MiniMax M2.1):

| Model | Input ($/1K tokens) | Output ($/1K tokens) |
|-------|---------------------|----------------------|
| minimax/minimax-m2.1 | $0.0001 | $0.00028 |
| anthropic/claude-sonnet-4.5 | $0.003 | $0.015 |

Token usage is displayed after each agent run in the terminal.

## Agent System

Bootstrap includes a powerful Agent System that allows you to create, manage, and use specialized AI agents for different tasks. This system is built on a namespace-based organization pattern with Zod schema validation.

### Built-in Agents

| Agent | Mode | Description |
|-------|------|-------------|
| **build** | Primary | Primary agent for build and compilation tasks |
| **plan** | Primary | Planning agent that writes plans to `.bootstrap/plan/*.md` |
| **general** | Subagent | General-purpose agent for research and multi-step tasks |
| **explore** | Subagent | Fast agent specialized for exploring codebases with configurable thoroughness levels |
| **compaction** | Primary | Internal agent for conversation context summarization |
| **title** | Primary | Internal agent for generating conversation titles |
| **summary** | Primary | Internal agent for generating conversation summaries |

### Creating Custom Agents

Create specialized agents using the `agent create` command:

```bash
# Interactive creation
bun start agent create

# Non-interactive creation
bun start agent create --path "./.bootstrap/agent" --description "Database expert agent" --mode "subagent" --tools "read,write,edit,grep"
```

### Agent Configuration

Agents are configured via markdown files in `.bootstrap/agent/` or `~/.config/bootstrap/agent/`:

```markdown
---
description: Expert agent for database operations and SQL queries
mode: subagent
tools:
  read: true
  write: true
  edit: true
  grep: true
  bash: true
---

# System Prompt
You are a database expert. Help users with:
- SQL query optimization
- Schema design and normalization
- Indexing strategies
- Query performance tuning
```

### Agent Features

- **Mode Support**: Agents can be configured as `primary`, `subagent`, or `all` (both)
- **Tool Access Control**: Fine-grained permission control for each tool
- **Custom Prompts**: Markdown-based agent prompts with YAML frontmatter
- **Model Selection**: Override default model per agent
- **Temperature/TopP**: Configure generation parameters
- **Color Coding**: Visual identification in terminal UI

### Using Agents

Agents can be invoked in three ways:

1. **As Primary Agent**: Default agent for the session
2. **As Subagent**: Delegated by other agents for specialized tasks
3. **Direct Invocation**: Call specific agents directly via commands

```bash
# Use a specific agent
> /agent explore "quick: Find all API endpoints in the codebase"

# Create and use a custom agent
> Create a database expert agent
> Use it to optimize my UserRepository queries
```

### Architecture

- **Main Agent**: Sequential AI agent with tool calling and intermediate reasoning
- **Sub-Agents**: Specialized agents for exploration and analysis (enable with `ENABLE_SUB_AGENTS=true`)
  - **FileSystemAgent**: Large-scale codebase exploration and bulk file operations
  - **AnalysisAgent**: Deep architectural analysis and PRD parsing
- **Agent System**: Create, manage, and use specialized AI agents with custom prompts and permissions
  - **Native Agents**: Built-in agents (build, plan, explore, general, compaction, title, summary)
  - **Custom Agents**: User-defined agents stored in `.bootstrap/agent/` or `~/.config/bootstrap/agent/`
  - **Agent Modes**: Primary, subagent, or all (both roles)
  - **Tool Permissions**: Fine-grained access control per agent
- **Tools**: 25+ tools organized into categories:
  - File operations (read_file, write_file, edit_file, list_files)
  - Commands (run_command, commands for shell execution)
  - Testing (run_tests, generate_tests, analyze_test_failures, get_coverage)
  - Scaffolding (scaffold_project for API/chatbot/React/static templates)
  - Advanced Testing (generate_integration_test, generate_e2e_test, generate_api_test, generate_performance_test)
  - Diagrams (generate_mermaid_diagram for architecture visualization)
  - PRD Workflow (extract_tasks_from_prd, parse_prd, process_prd_with_tasks)
  - Sub-Agents (explore_codebase, analyze_code_implementation, bulk_file_operations)
- **UI**: Ink/React components for terminal interface
- **Session Manager**: Conversation persistence with token tracking
- **Context Compaction**: Automatic summarization for long-running conversations

## Project Structure

```
CodeCLI/
├── src/
│   ├── index.ts                 # Main CLI entry point
│   ├── core/                    # Agent runtime & tools
│   │   ├── agent.ts            # AI agent implementation
│   │   ├── agent-system/       # Multi-agent infrastructure
│   │   │   ├── agent-base.ts   # Base agent class
│   │   │   ├── agent-manager.ts # Agent registry
│   │   │   ├── agent-pool.ts   # Concurrency control
│   │   │   ├── agent-context.ts # Shared state
│   │   │   ├── agent-events.ts  # Event system
│   │   │   └── agent-protocol.ts # Task/result structures
│   │   ├── agents/             # Specialized sub-agents
│   │   │   ├── filesystem.ts   # FileSystemAgent
│   │   │   └── analysis.ts     # AnalysisAgent
│   │   ├── tools/              # Tool definitions (25+ tools)
│   │   ├── session-manager.ts  # Session persistence
│   │   ├── token-tracker.ts    # Token usage tracking
│   │   ├── severity.ts         # Structured logging
│   │   └── context-compaction.ts # Context summarization
│   ├── utils/                  # Utilities
│   │   ├── colors.ts           # Terminal colors
│   │   ├── path-resolver.ts    # Test path resolution
│   │   ├── clignore.ts         # .clignore patterns
│   │   ├── diff-renderer.ts    # Diff visualization
│   │   ├── build-tool-detector.ts # Maven/Gradle detection
│   │   ├── springboot-detector.ts # Spring Boot detection
│   │   ├── diagram-renderer.ts # Mermaid rendering
│   │   └── markdown.ts         # Markdown utilities
│   └── ui/                     # Ink/React terminal UI
│       ├── app.tsx             # Main UI component
│       └── components/         # UI components
├── tests/                       # Multi-language test suites
│   ├── python/                 # Python tests
│   ├── java/                   # Java tests
│   │   ├── springboot/         # Spring Boot demo project
│   │   ├── spring-currencyconverter/ # Full integration demo
│   │   └── ...                 # Other demo projects
├── scripts/                     # Test runners & utilities
├── docs/                        # Feature guides
├── diagrams/                    # Generated Mermaid diagrams
└── tictactoe.html              # Interactive Tic Tac Toe game
```
## Agent Workflow

The AI Coding Agent processes requests in several coordinated steps to ensure accurate results and robust handling of complex coding tasks. Here’s an overview of its workflow:

1. **User Request**: The process begins when you enter a prompt (e.g., “Generate tests for UserService.java”).
2. **Context Management**: The agent trims history and context to fit within model limits, preserving important parts like system prompts and recent exchanges.
3. **Intent & Planning**: The agent asks the LLM to determine intent—does the request need tool use (code analysis, test generation, etc.) or can it be answered directly?
4. **Plan Explanation**: When a tool action is needed, the agent requests a concise plan from the LLM and updates you (the user) with a plain language summary.
5. **Tool Call Drafting**: The agent instructs the LLM to draft the required tool calls as structured JSON using the configured model.
6. **Repair & Validation**: The agent auto-fixes common LLM issues (like malformed or truncated JSON) and validates tool input for correctness and type safety.
7. **Tool Execution / Dispatch**:
   - **Local Tools**: Simple operations (`read_file`, `run_cmd`) are executed directly.
   - **Sub-Agents**: Complex, context-heavy requests (exploration, large-scale analysis) are delegated to dedicated sub-agents for more specialized processing.
8. **Result Collection & Iteration**: Results from tool execution are captured and added back to the context. The cycle may repeat as needed (e.g., additional data required, multi-step plans).
9. **Final Response**: Once all tasks are complete, the agent synthesizes and returns the final answer, ready for a new request.

**Status events** like `thinking`, `running_tools`, and `summarizing` are surfaced in the terminal UI to indicate progress.

### Visual Workflow

![Project Structure Diagram](image/FinalWorkflow.png)

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
- **AI**: OpenRouter API (MiniMax M2.1)
- **Testing**: PyTest (Python), JUnit 5 (Java)




## Recent Changes

### v2.2 - Advanced Testing & Session Management

#### Session Management & Persistence 💾
- **Session Manager**: Auto-save conversations to `~/.codecli/sessions/`
  - Session ID generation (timestamp-based)
  - Load specific sessions via `--session=<id>` flag
  - Resume recent sessions via `--resume` flag
  - Token tracking per session (estimated tokens and cost)
  - Session export summary

#### Advanced Testing Tools 🧪
- **Integration Tests**: Generate integration tests for multiple components with mocks/stubs
- **E2E Tests**: End-to-end test scenarios for web/API/CLI applications
- **API Tests**: Comprehensive API test suites with endpoint testing and schema validation
- **Performance Tests**: Load, stress, spike, and endurance tests using k6/JMeter/Locust
- **Regression Tests**: Create tests for fixed bugs to prevent reoccurrences

#### Developer Experience Improvements
- **CLIgnore Support**: `.clignore` file patterns (similar to .gitignore)
- **Diff Renderer**: Color-coded unified diffs with inline changes
- **Severity Logging**: Structured logging with debug/info/success/warning/error/critical levels
- **Context Compaction**: Automatic conversation summarization for long-running tasks

### v2.1 - Diagram Tool & Game Features
- **Enhanced Diagram Tool**: Added PNG/SVG image export support for Mermaid diagrams
  - Configurable output format (ascii/png/svg) and resolution (width/height)
  - Multiple theme options: default, dark, forest, neutral
  - Mermaid CLI integration via mmdc for high-quality rendering
  - Generated diagrams saved to `diagrams/` directory
- **Tic Tac Toe Game**: Added interactive browser-based game
  - Two modes: 2 Players and Player vs AI
  - Three difficulty levels: Easy, Medium, Hard
  - Dark/light theme toggle
  - Score tracking and confetti celebration animation
  - Responsive design for mobile devices

### v2.0 - Cost Optimization Update
- **Model Switch**: Default model changed from Claude Sonnet 4.5 to MiniMax M2.1
  - ~95% cost reduction on input tokens
  - ~98% cost reduction on output tokens
- **Simplified Reasoning**: Replaced custom multi-step reasoning flow with native reasoning via API
- **Updated Pricing**: Added MiniMax M2.1 token costs to tracker
