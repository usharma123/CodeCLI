# AI Coding Agent

## What It Does
- CLI coding agent that reads/writes files directly using tool calls (read, write, edit, patch, scaffold, list).
- Runs in “safe mode”: shows previews and asks for confirmation before writing or patching files.
- Uses OpenRouter with Claude Sonnet 4.5 for reliable tool calling and low-temperature, deterministic behavior.
- Retries with validation on malformed tool arguments and falls back gracefully.
- Includes scaffolding templates (API, chatbot, static, React) to bootstrap new projects quickly.

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
- Loads tools for file operations and scaffolding.
- Uses interactive CLI prompts; you can exit with `ctrl-c`.
- Shows previews of changes and requires `y/yes` confirmation before applying writes/patches.
- Handles malformed tool arguments with retries and validation.

## Future Steps (detailed next tasks)
- Add automated tests (unit/integration) for tool flows and confirmation prompts.
- Improve error handling/logging and surface clearer diagnostics for tool failures.
- Extend the toolset (e.g., search/grep helpers, formatting, lint hooks).
- Support additional models and configurable model selection at runtime.
- Containerize/distribute (Docker image, binary bundle) for easier installation.

