# AI Coding Agent

## What It Does
- CLI coding agent that reads/writes files directly using tools (read, write, edit, patch, scaffold, list, run_command).
- Runs in “safe mode”: previews and asks for confirmation before writes/patches/commands.
- Uses OpenRouter with Claude Sonnet 4.5 (low-temp, deterministic) and retries with validation on malformed tool args.
- Includes scaffolding templates (API, chatbot, static, React) to bootstrap new projects quickly.
- Can execute shell commands (e.g., `pytest`, `npm test`) via `run_command`, streaming output and honoring timeouts.

## Tech Stack
- Runtime: Bun
- Language: TypeScript
- Model Gateway: OpenRouter
- Default Model: Claude Sonnet 4.5
- Env/config: dotenv-loaded `.env`

## Setup
1) Install Bun (https://bun.sh).  
2) Create `.env` in the project root with:
```
OPENROUTER_API_KEY=sk-or-v1-...
```
3) Install dependencies:
```
bun install
```

## Usage
- Start the agent (dev): `bun run dev`  
- Start the agent (prod/start): `bun start`

On launch, the agent:
- Prints an ASCII banner and safe-mode notice.
- Loads tools for file ops, scaffolding, and `run_command`.
- Uses interactive CLI prompts; exit with `ctrl-c`.
- Shows previews and requires `y/yes` before writes/patches/commands.
- Handles malformed tool arguments with retries, validation, and truncation detection for large `write_file` payloads.

## Running Tests via the Agent
- Use `run_command` to execute tests (confirmation required):
  - Python: create venv (`python3 -m venv venv`), install deps (`venv/bin/pip install pytest`), run tests (`venv/bin/pytest tests/`).
  - Node: install deps (`npm install` or `bun install`), run tests (`npm test` or `bun test`).
- The agent streams stdout/stderr and returns exit code; rerun after fixes with `run_command`.

## Notes
- Token budget raised to 16384 for tool calls to allow full `write_file` payloads (prevents truncation).
- Safe-mode confirmations apply to file writes, patches, and shell commands.

## Future Steps
- Add automated tests for tool flows and confirmation prompts.
- Extend the toolset (search/grep helpers, formatting, lint hooks).
- Support additional models and configurable model selection at runtime.
- Containerize/distribute (Docker image, binary bundle) for easier install.

