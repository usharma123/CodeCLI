# CodeCLI Repository Guidelines

## Project Structure & Module Organization
- `src/`: TypeScript ESM source code
  - `src/core/`: Agent runtime, tool definitions, command execution, and shared types
  - `src/ui/`: Ink/React terminal UI; components live in `src/ui/components/`
  - `src/utils/`: Small helpers and detectors (e.g., Spring Boot/build-tool detection)
- `dist/`: Compiled JavaScript output from `tsc` (do not edit by hand)
- `scripts/`: Bash utilities, including the unified test runner
- `tests/`: Multi-language test suites and fixture projects
  - `tests/python/`: PyTest tests for agent behavior
  - `tests/java/`: JUnit 5 sample apps and test fixtures (Maven/Gradle)
- `docs/`: Feature guides and implementation notes

## Build, Test, and Development Commands

### TypeScript/Bun Commands
- `bun install`: Install dependencies
- `bun run dev`: Run the CLI from `src/` using Bun (hot iteration)
- `bun run build`: Compile TypeScript to `dist/` using `tsc`
- `bun start`: Run the agent entrypoint from `dist/index.js`
- `bun test`: Run all Bun tests
- `bun test path/to/test.test.ts`: Run a single test file

### Python Tests
- `cd tests/python && pytest`: Run all Python tests
- `pytest -m smoke`: Run only smoke tests
- `pytest -m "smoke or sanity"`: Run smoke and sanity tests
- `pytest test_file.py::TestClass::test_method`: Run a single test

### Java Tests (Maven)
- `cd tests/java && mvn test`: Run all Maven tests
- `mvn test -Dtest=ClassName`: Run a single test class
- `mvn test -Dtest=ClassName#testMethod`: Run a single test method
- `mvn test -Dgroups=smoke`: Run tests tagged with `@Tag("smoke")`

### Unified Test Runner
- `bash scripts/test-runner.sh --mode smoke|sanity|full --language python|java|all --coverage`: Run tests across languages with optional coverage
  - `--mode smoke`: Quick smoke tests for critical functionality
  - `--mode sanity`: Sanity tests after minor changes
  - `--mode full`: Run all tests
  - `--coverage`: Generate coverage reports

## Code Style & Naming Conventions

### TypeScript Configuration
- Use TypeScript ESM (`"type": "module"` in package.json) with `strict` compiler settings
- Module resolution: `nodenext` with `module: nodenext`
- JSX: `react-jsx` for Ink/React components
- Target: `esnext`

### Naming Conventions
- **Files**: kebab-case for utility files (`path-resolver.ts`); PascalCase for React components (`Confirm.tsx`)
- **Variables/Functions**: camelCase with descriptive names
- **Interfaces/Types**: PascalCase with clear names (`ToolDefinition`, `RunCommandInput`)
- **Constants**: UPPER_SNAKE_CASE for true constants

### Imports & File Structure
- Use relative imports with `.js` extensions to match ESM build output
- Organize imports: external libraries first, then internal modules
- Example: `import React from "react"; import { Box, Text } from "ink"; import { BuildConfig } from "../core/types.js";`
- Re-export modules from `index.ts` files for backward compatibility
- Use JSDoc comments for public functions and types

### Formatting & Style
- Indentation: 2 spaces
- Semicolons: Required
- Quotes: Double quotes for strings
- Line endings: LF (Unix-style)
- Maximum line length: ~100 characters

### Error Handling
- Prefer Result patterns over exceptions in tools
- Use early returns with descriptive error messages
- Validate inputs and return structured error responses
- Log warnings with `console.warn()` for recoverable issues
- Throw exceptions only for truly exceptional conditions

### Types & Validation
- Use TypeScript interfaces for input/output types (`ToolDefinition`, `*Input`)
- Use discriminated unions for variant types (`SpringBootComponentType`, `BuildTool`)
- Enable strict mode: `strict: true` in tsconfig.json
- Avoid `any`; use `unknown` with type guards when needed

### React/Ink Components
- Use functional components with TypeScript interfaces for props
- Destructure props with default values
- Use `useState` for component state
- Use `useInput` for keyboard input handling in Ink
- Export components as named exports

## Testing Guidelines

### Bun Tests (TypeScript)
- Use `bun:test` framework with `describe`, `it`, `expect`, `beforeEach`, `mock`
- Test files: `*.test.ts` alongside source files or in `__tests__/` directory
- Use `mock()` from `bun:test` for function mocking
- Test error cases and edge conditions
- Group tests with `describe()` blocks

### PyTest Configuration (Python)
- Test discovery: `test_*.py`, `*_test.py` files with `Test*` classes and `test_*` functions
- Markers defined in `tests/python/pytest.ini`: `unit`, `integration`, `system`, `smoke`, `sanity`, `regression`, `slow`
- Use `@pytest.mark.*` decorators for test categorization
- Run tests with `pytest -m marker_name`

### JUnit 5 (Java)
- Test files: `*Test.java` classes
- Use `@Tag("smoke"|"sanity"|...)` for test categorization
- Place tests alongside source files in `src/test/java/`
- Follow naming: `ClassNameTest.java` for each class under test

### Coverage Requirements
- Aim for meaningful coverage, not just line count
- Write dedicated tests, don't rely on incidental coverage from integration tests
- Use `bun test --coverage` for TypeScript coverage
- Use `pytest --cov` for Python coverage

## Commit & Pull Request Guidelines
- Use short imperative commit messages ("added feature", "fixed bug")
- Keep commits focused; avoid combining unrelated changes
- PRs should include test evidence and updates to `CHANGELOG.md` for user-visible changes
- Run the test suite before committing

## Configuration & Security
- Local secrets in `.env` (git-ignored): `OPENROUTER_API_KEY=...`
- Never commit keys or generated reports
- Environment variables loaded with `dotenv`