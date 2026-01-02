# Bootstrap

AI-powered CLI agent focused on Java and Python testing workflows.

Bootstrap is a fork of [OpenCode](https://github.com/sst/opencode) (MIT License), customized for test-driven development workflows.

## Features

- **Java Testing**: Maven/Gradle test execution, JUnit 5 support, Spring Boot detection
- **Python Testing**: PyTest integration, coverage reporting with pytest-cov
- **Smart Test Discovery**: Automatically finds test files by convention
- **TUI Interface**: Full terminal UI for interactive development
- **Multi-Provider Support**: OpenRouter, Anthropic, OpenAI, Google, and more
- **TypeScript Runtime**: Built with Bun and SolidJS for performant CLI experience

## Project Structure

```
bootstrap-solidjs/
├── src/                  # TypeScript source
│   ├── core/            # Agent runtime, tool definitions, command execution
│   ├── ui/              # Ink/React terminal UI components
│   └── utils/           # Helpers and detectors
├── dist/                # Compiled JavaScript output (do not edit)
├── scripts/             # Bash utilities and test runner
├── tests/               # Multi-language test suites
│   ├── python/          # PyTest tests for agent behavior
│   ├── java/            # JUnit 5 sample apps and fixtures
│   └── nextjs-chatbot/  # Template fixture
├── docs/                # Feature guides and implementation notes
└── bin/                 # CLI executable entrypoint
```

## Quick Start

1. Get an API key from [OpenRouter](https://openrouter.ai/keys)

2. Set the environment variable:
```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

3. Install and run:
```bash
cd bootstrap-solidjs
bun install
bun run dev
```

## Development Commands

| Command | Description |
|---------|-------------|
| `bun install` | Install dependencies |
| `bun run dev` | Run CLI from source with hot iteration |
| `bun run build` | Compile TypeScript to `dist/` |
| `bun run typecheck` | Run TypeScript type checking |
| `bun test` | Run all tests |
| `bash scripts/test-runner.sh --mode smoke\|sanity\|full --language python\|java --coverage` | Run tests across languages with coverage |

### Language-Specific Testing

```bash
# Python tests
cd tests/python && pytest

# Java tests (requires Maven)
cd tests/java && mvn test
```

## Usage

```bash
# Start the interactive TUI
bun run dev

# Run with a specific model
bun run dev -m openrouter/anthropic/claude-sonnet-4

# Non-interactive mode - execute a single task
bun run dev run "Write a test for the UserService class"

# List available models from a provider
bun run dev models openrouter
```

## Configuration

Create a `bootstrap.json` in your project root or `~/.config/bootstrap/bootstrap.json` for global settings.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "openrouter/anthropic/claude-sonnet-4"
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API key (recommended) |
| `ANTHROPIC_API_KEY` | Direct Anthropic API key |
| `OPENAI_API_KEY` | Direct OpenAI API key |

## Coding Style

- **Runtime**: Bun with TypeScript ESM modules
- **Imports**: Use relative imports for local modules, named imports preferred
- **Types**: Zod schemas for validation, TypeScript interfaces for structure
- **Naming**: camelCase for variables/functions, PascalCase for classes/namespaces
- **Error handling**: Use Result patterns, avoid throwing exceptions in tools
- **File structure**: Namespace-based organization (e.g., `Tool.define()`, `Session.create()`)
- **Indentation**: 2 spaces, semicolons, double quotes

## Testing Guidelines

### Python Testing

- Uses PyTest as the primary test framework
- Markers defined in `tests/python/pytest.ini`: `smoke`, `sanity`, `regression`, `slow`
- Test files named `test_*.py` or `*_test.py`
- Coverage reporting with `pytest --cov`

### Java Testing

- Uses JUnit 5 as the primary test framework
- Test classes named `*Test.java` or `*Tests.java`
- Tag tests with `@Tag("smoke"|"sanity"|...)` for filtering
- Maven/Gradle build detection for test execution

### Test Discovery

Automatically finds test files by convention:
- Java: `*Test.java`, `*Tests.java` in `src/test/java`
- Python: `test_*.py`, `*_test.py` in `tests/` or project root

## Architecture

- **Tools**: Implement `Tool.Info` interface with `execute()` method
- **Context**: Pass `sessionID` in tool context, use `App.provide()` for dependency injection
- **Validation**: All inputs validated with Zod schemas
- **Logging**: Use `Log.create({ service: "name" })` pattern
- **Storage**: Use `Storage` namespace for persistence

## License

MIT License - Based on OpenCode by SST
