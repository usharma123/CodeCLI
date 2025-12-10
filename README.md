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
- Prefer the built-in tools instead of ad-hoc commands:
  - `run_tests({ language: "python" | "java" | "all", mode: "smoke" | "sanity" | "full", coverage?: boolean, report?: boolean })`
  - `analyze_test_failures({ test_output, language })` for AI-assisted root-cause hints
  - `get_coverage({ language })` to parse coverage reports (coverage.py or JaCoCo)
- The tools wrap the unified runner, parse results, and surface report locations.

## Notes
- Token budget raised to 16384 for tool calls to allow full `write_file` payloads (prevents truncation).
- Safe-mode confirmations apply to file writes, patches, and shell commands.
- Known limitation: the agent can sometimes prefer overwriting an entire file instead of issuing a targeted edit/patch, which wastes tokens and can increase cost; guide the agent toward `edit_file`/`patch_file` for small changes.

## Automated Testing Framework (Phase 1)
- Unified runner: `bash scripts/test-runner.sh --language python|java|all --mode smoke|sanity|full [--coverage] [--report]`.
- Reporting: `bash scripts/generate-report.sh` outputs `TEST_REPORT.md` plus coverage links (JaCoCo/coverage.py).
- Status: Phase 1 complete—Python and Java suites pass with coverage enabled; see `TESTING_IMPLEMENTATION.md` for details and `TESTING_PHASE2.md` for the roadmap.

## Future Steps
- Add automated tests for tool flows and confirmation prompts.
- Extend the toolset (search/grep helpers, formatting, lint hooks).
- Support additional models and configurable model selection at runtime.
- Containerize/distribute (Docker image, binary bundle) for easier install.

