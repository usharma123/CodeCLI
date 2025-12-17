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
