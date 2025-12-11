# Repository Guidelines

## Project Structure & Module Organization
- `src/`: TypeScript source.
  - `src/core/`: agent runtime, tool definitions, command execution, and shared types.
  - `src/ui/`: Ink/React terminal UI; components live in `src/ui/components/`.
  - `src/utils/`: small helpers and detectors (e.g., Spring Boot/build-tool detection).
- `dist/`: compiled JavaScript output from `tsc` (do not edit by hand).
- `scripts/`: Bash utilities, including the unified test runner.
- `tests/`: multi-language test suites and fixture projects.
  - `tests/python/`: PyTest tests for agent behavior.
  - `tests/java/`: JUnit 5 sample apps and test fixtures (Maven/Gradle).
  - `tests/nextjs-chatbot/`: template fixture used by scaffolding/tools.
- `docs/`: feature guides and implementation notes.

## Build, Test, and Development Commands
- `bun install`: install dependencies.
- `bun run dev`: run the CLI from `src/` using Bun (hot iteration).
- `bun run build`: compile TypeScript to `dist/`.
- `bun start`: run the agent entrypoint.
- `bash scripts/test-runner.sh --mode smoke|sanity|full --language python|java --coverage`: run tests across languages with optional coverage.
  - Python only: `cd tests/python && pytest`.
  - Java only: `cd tests/java && mvn test` (requires Maven).

## Coding Style & Naming Conventions
- TypeScript ESM (`"type": "module"`) with `strict` compiler settings.
- Prefer 2‑space indentation, semicolons, double quotes, and clear camelCase names.
- Source files in `src/` use kebab‑case (`path-resolver.ts`); React components use PascalCase (`Confirm.tsx`).
- Keep import paths using `.js` extensions to match ESM build output.

## Testing Guidelines
- Python uses PyTest; markers are defined in `tests/python/pytest.ini` (`smoke`, `sanity`, `regression`, `slow`, etc.). Name tests `test_*.py` or `*_test.py`.
- Java uses JUnit 5. Name tests `*Test.java` and tag with `@Tag("smoke"|"sanity"|...)` so `scripts/test-runner.sh` can filter modes.
- Add or update tests for behavior changes in `src/core`, `src/utils`, or scaffolding tools.

## Commit & Pull Request Guidelines
- Commit history favors short imperative summaries (e.g., “added …”, “refactored …”, “updated …”). Keep commits focused; avoid “wip”.
- PRs should include a clear description, test evidence (command + brief results), and updates to `CHANGELOG.md` or `docs/` for user‑visible changes.

## Configuration & Security
- Local secrets live in `.env` (git‑ignored). Set `OPENROUTER_API_KEY=...` and never commit keys or generated reports.

