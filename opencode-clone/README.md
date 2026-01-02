# Bootstrap

AI-powered CLI agent focused on Java and Python testing.

Bootstrap is a fork of [OpenCode](https://github.com/sst/opencode) (MIT License), customized for test-driven development workflows.

## Features

- **Java Testing**: Maven/Gradle test execution, JUnit support, Spring Boot detection
- **Python Testing**: PyTest integration, coverage reporting
- **Smart Test Discovery**: Automatically finds and runs relevant tests
- **TUI Interface**: Full terminal UI for interactive development
- **Multi-Provider Support**: OpenRouter, Anthropic, OpenAI, Google, and more

## Quick Start

1. Get an API key from [OpenRouter](https://openrouter.ai/keys)

2. Set the environment variable:
```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

3. Install and run:
```bash
cd opencode-clone
bun install
bun run dev
```

## Usage

```bash
# Start the TUI
bun run dev

# Run with a specific model
bun run dev -m openrouter/anthropic/claude-sonnet-4

# Non-interactive mode
bun run dev run "Write a test for the UserService class"

# List available models
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

- `OPENROUTER_API_KEY` - OpenRouter API key (recommended)
- `ANTHROPIC_API_KEY` - Direct Anthropic API key
- `OPENAI_API_KEY` - Direct OpenAI API key

## License

MIT License - Based on OpenCode by SST
