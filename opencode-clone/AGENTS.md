# Bootstrap Agent Guidelines

Bootstrap is an AI-powered CLI agent focused on Java and Python testing workflows.

## Build/Test Commands

- **Install**: `bun install`
- **Run**: `bun run dev`
- **Typecheck**: `bun run typecheck`
- **Test**: `bun test` (runs all tests)
- **Single test**: `bun test test/tool/tool.test.ts` (specific test file)

## Code Style

- **Runtime**: Bun with TypeScript ESM modules
- **Imports**: Use relative imports for local modules, named imports preferred
- **Types**: Zod schemas for validation, TypeScript interfaces for structure
- **Naming**: camelCase for variables/functions, PascalCase for classes/namespaces
- **Error handling**: Use Result patterns, avoid throwing exceptions in tools
- **File structure**: Namespace-based organization (e.g., `Tool.define()`, `Session.create()`)

## Architecture

- **Tools**: Implement `Tool.Info` interface with `execute()` method
- **Context**: Pass `sessionID` in tool context, use `App.provide()` for DI
- **Validation**: All inputs validated with Zod schemas
- **Logging**: Use `Log.create({ service: "name" })` pattern
- **Storage**: Use `Storage` namespace for persistence

## Testing Focus

Bootstrap is specialized for test-driven development:

### Java Testing
- **Maven**: Detects `pom.xml`, runs tests via `mvn test`
- **Gradle**: Detects `build.gradle`/`build.gradle.kts`, runs via `./gradlew test`
- **JUnit 5**: Primary test framework support
- **Spring Boot**: Auto-detects Spring Boot applications

### Python Testing
- **PyTest**: Primary test framework
- **Coverage**: Supports `pytest --cov` for coverage reporting
- **Virtual environments**: Respects `.venv`, `venv`, `env` directories

### Test Discovery
- Automatically finds test files by convention:
  - Java: `*Test.java`, `*Tests.java` in `src/test/java`
  - Python: `test_*.py`, `*_test.py` in `tests/` or project root
