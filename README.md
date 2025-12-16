# AI Coding Agent

## What It Does
- **CLI coding agent** that reads/writes files directly using tools (read, write, edit, patch, scaffold, list, run_command).
- **Safe mode**: Previews and asks for confirmation before writes/patches/commands.
- **Terminal Markdown rendering**: Assistant summaries render Markdown (headings, lists, code, emphasis) with ANSI styling and file‑path highlighting.
- Uses **OpenRouter** with **Claude Sonnet 4.5** (low-temp, deterministic) and retries with validation on malformed tool args.
- Includes **scaffolding templates** (API, chatbot, static, React) to bootstrap new projects quickly.
- Can execute shell commands (e.g., `pytest`, `npm test`) via `run_command`, streaming output and honoring timeouts.
- **AI-powered testing framework** with 16 specialized tools covering unit, integration, E2E, API, performance, and PRD-driven testing.
- **Spring Boot testing support** with automatic component detection and intelligent test generation.

## Recent Updates 🎉

### Todo List Management & Intermediate Reasoning 🎯 (December 2024)
- ✅ **Todo List System** - New `todo_write` tool for managing task progress
  - Create and update todo lists for complex tasks (3+ steps)
  - Visual progress display with color-coded status indicators (✓ → ○)
  - Real-time UI updates as agent works
  - Enforces single in-progress task constraint
  - Integrated with Ink terminal UI via TodoList component
- ✅ **Intermediate Reasoning** - Agent explains its approach before executing tools
  - Pre-tool reasoning: 1-sentence explanations of what's about to happen (cyan blockquote)
  - Mid-execution status: Progress updates between tool calls (yellow blockquote)
  - Reasoning checkpoints: Internal tracking of decision-making process with timestamps
  - Configurable via `enableIntermediateReasoning` option
- ✅ **Enhanced UI** - Ink-based React components for terminal interface
  - TodoList component for task tracking
  - InputBox component for user input
  - ToolOutputDisplay for formatted results
  - Confirm component for safe-mode confirmations
  - **Improved keyboard handling**: Robust Ctrl+C/Ctrl+O detection with Unicode escape sequences
  - **Fixed Ctrl+O toggle**: Properly expands/collapses truncated output
- ✅ **Configuration** - `enableIntermediateReasoning` option (default: true)
- ✅ **Output Display** - `todo_write` now included in default tool output (visible in normal mode)

### Spring Boot Testing Enhancement - Phase 1 Complete! (December 11, 2025)
- ✅ **Gradle Support Added** - Full support for Gradle projects alongside Maven
  - Detects `build.gradle` (Groovy) and `build.gradle.kts` (Kotlin DSL)
  - Parses Spring Boot Gradle plugin and dependencies
- ✅ **Fixed Brittle Path Assumptions** - Robust path resolution for multi-module projects
  - New `path-resolver.ts` utility for build-tool and language-aware paths
  - Supports Maven/Gradle with Java/Kotlin source directories
- ✅ **Expanded Repository Detection** - 9 repository types (JPA, Mongo, Redis, Reactive, JDBC, etc.)
- ✅ **Build Tool Abstraction** - Automatic Maven/Gradle detection with caching
  - New `build-tool-detector.ts` utility
  - In-memory caching for performance
- ✅ **Reactive Project Detection** - WebFlux and R2DBC support
- ✅ **Language-Aware Resolution** - Kotlin preparation (Java + Kotlin path handling)
  - Handles `.java` → `Test.java` and `.kt` → `Test.kt`
- 🔄 **Next: Phase 2 - Kotlin Templates** (2-3 days)

### Spring Boot Testing (Complete)
- ✅ Automatic Spring Boot project detection
- ✅ Component-aware test generation (@Controller, @Service, @Repository)
- ✅ Test slicing with @WebMvcTest, @DataJpaTest for fast tests
- ✅ Mode-based testing (smoke/sanity/full)
- ✅ 48 Spring Boot tests passing across 2 example projects

### Phase 3 & 4 Testing Tools (Complete!)
- ✅ **Integration Testing**: `generate_integration_test` for multi-component testing
- ✅ **E2E Testing**: `generate_e2e_test` with Playwright/Selenium/Cypress support
- ✅ **API Testing**: `generate_api_test` with schema validation and contract testing
- ✅ **PRD Testing**: `parse_prd` and `generate_tests_from_prd` for requirements-driven testing
- ✅ **Performance Testing**: `generate_performance_test` with k6/JMeter/Locust support

### Documentation Improvements
- ✅ Comprehensive Spring Boot testing guide ([docs/SPRINGBOOT_TESTING.md](docs/SPRINGBOOT_TESTING.md))
- ✅ Organized documentation in `docs/` directory
- ✅ Updated test counts: 125+ tests passing
- ✅ Complete documentation suite:
  - `SETUP.md` - Installation and configuration
  - `QUICKSTART.md` - Quick start guide
  - `FEATURES.md` - Feature overview
  - `TESTING_IMPLEMENTATION.md` - Testing framework details
  - `TESTING_PHASE2.md` - Advanced testing features
  - `SPRINGBOOT_TESTING.md` - Spring Boot testing guide
  - `SPRINGBOOT_TESTING_REVIEW.md` - Code review and improvements
  - `OPENROUTER.md` - OpenRouter integration guide
  - `CLAUDE.md` - Claude model configuration

## Tech Stack
- **Runtime**: Bun
- **Language**: TypeScript
- **UI Framework**: Ink (React for CLIs) with custom components
- **Model Gateway**: OpenRouter
- **Default Model**: Claude Sonnet 4.5 (anthropic/claude-sonnet-4.5)
- **Env/config**: dotenv-loaded `.env`
- **Testing**: PyTest (Python), JUnit 5 + Maven/Gradle (Java)
- **Coverage**: coverage.py (Python), JaCoCo (Java)
- **Build Tools**: Automatic Maven/Gradle detection with caching

## Architecture

### UI Components (Ink/React)
The agent uses **Ink** (React for CLIs) to provide a rich terminal interface:

- **`App.tsx`**: Main application component with input handling and confirmation dialogs
- **`TodoList.tsx`**: Visual task progress display with color-coded status
- **`InputBox.tsx`**: User input component with prompt styling
- **`ToolOutputDisplay.tsx`**: Formatted display of tool execution results
- **`Confirm.tsx`**: Safe-mode confirmation dialogs for destructive operations

### Utilities
- **`build-tool-detector.ts`**: Automatic Maven/Gradle detection with dependency parsing
- **`path-resolver.ts`**: Build-tool and language-aware path resolution for tests
- **`springboot-detector.ts`**: Spring Boot project detection and component type analysis
- **`markdown.ts`**: ANSI-styled Markdown rendering for terminal output
- **`colors.ts`**: Terminal color constants and styling utilities

### Agent Core
- **Message History Management**: Keeps last 40 messages to stay within token limits (max ~12,000 tokens)
- **Retry Logic**: Handles malformed tool arguments with validation and retries (max 3 attempts)
- **Validation Failure Tracking**: Prevents retry storms with per-tool failure counting
- **Token Estimation**: Monitors message history to avoid context overflow
- **Reasoning Checkpoints**: Tracks decision-making process with timestamps
- **Safe Mode**: All destructive operations require explicit confirmation
- **Error Recovery**: Graceful handling of API timeouts, network errors, and tool failures
- **Truncation Detection**: Detects and handles large file writes that may be truncated

### Safety Features
- **Confirmation Dialogs**: All writes, edits, patches, and commands require `y/yes` confirmation
- **Preview Display**: Shows diffs for edits, content for writes before execution
- **Timeout Protection**: Commands timeout after configurable duration (default 60s, max 300s)
- **Validation**: Tool arguments validated before execution with detailed error messages
- **Rollback Guidance**: Provides undo instructions for destructive operations

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

### Test Environment Setup
The agent automatically sets up test environments when running tests:

**Python:**
- Creates virtual environment if not exists: `python3 -m venv venv`
- Installs dependencies: `venv/bin/pip install -r tests/python/requirements-test.txt`
- Runs tests: `venv/bin/pytest tests/`

**Java (Maven):**
- Detects `pom.xml` and uses Maven
- Compiles: `mvn compile test-compile`
- Runs tests: `mvn test`
- Coverage: `mvn jacoco:report`

**Java (Gradle):**
- Detects `build.gradle` or `build.gradle.kts`
- Compiles: `gradle compileJava compileTestJava`
- Runs tests: `gradle test`
- Coverage: `gradle jacocoTestReport`

### Scripts
- **`scripts/test-runner.sh`**: Unified test execution script
  - Supports `--mode` (smoke/sanity/full), `--language` (python/java/all), `--coverage`
  - Handles environment setup, dependency installation, and test execution
  - Generates JSON reports for structured output parsing
- **`scripts/generate-report.sh`**: Coverage report generation

## Usage
- **Start the agent (dev)**: `bun run dev`  
- **Start the agent (prod/start)**: `bun start`
- **Build TypeScript**: `bun run build`
- **Verbose mode**: `bun start --verbose-tools` or set `TOOLS_VERBOSE=1`

### Requirements
- **TTY (Interactive Terminal)**: This agent requires an interactive terminal and will not run in non-TTY environments (pipes, CI/CD without TTY allocation)
- **Bun Runtime**: Must have Bun installed (https://bun.sh)
- **OpenRouter API Key**: Required in `.env` file

On launch, the agent:
- Prints an ASCII banner and safe-mode notice
- Loads 16 specialized tools for file ops, scaffolding, testing, and command execution
- Uses Ink-based interactive UI with React components
- Shows previews and requires `y/yes` confirmation before writes/patches/commands
- Displays tool execution output (truncated by default, full with `--verbose-tools`)
- Handles malformed tool arguments with retries, validation, and truncation detection
- Supports intermediate reasoning to explain actions before execution

## Core Tools (16 Total)

### File Operations (5 tools)
- **`read_file`**: Read file contents (truncates at 10,000 chars)
- **`write_file`**: Create or overwrite files (shows preview, requires confirmation)
- **`edit_file`**: Replace specific text in files (shows diff-style preview, requires confirmation)
- **`patch_file`**: Apply unified diff patches (advanced - requires perfect unified diff format)
- **`list_files`**: List directory contents (max depth: 3, skips node_modules/.git/hidden files)

### Project Scaffolding (1 tool)
- **`scaffold_project`**: Bootstrap new projects with templates:
  - `api` - REST API server (Express/Bun)
  - `chatbot` - AI chatbot interface (Next.js with optional API)
  - `static` - Static HTML site
  - `react` - React application (Vite with optional API)
  - Supports custom project names and target directories
  - Includes package.json, TypeScript config, and starter code

### Command Execution (1 tool)
- **`run_command`**: Execute shell commands with timeout and output capture
  - Default timeout: 60s (configurable up to 300s)
  - Streams output to terminal in real-time
  - Captures stdout, stderr, and exit codes
  - Supports working directory specification
  - Handles timeouts gracefully with SIGKILL

### Task Management (1 tool)
- **`todo_write`**: Manage task progress with structured todo lists
  - Create initial todo lists for complex tasks (3+ steps)
  - Update todo status as work progresses (pending → in_progress → completed)
  - Visual progress display with color-coded indicators (✓ completed, → in-progress, ○ pending)
  - Enforces single in-progress task at a time
  - Real-time UI updates via Ink TodoList component
  - Automatic status emission to terminal UI
  - Each todo requires: content (imperative), activeForm (present continuous), status

## Testing Framework (All Phases Complete ✅)

The agent includes a comprehensive AI-powered testing framework with **8 specialized testing tools** across 4 phases, plus Spring Boot auto-detection:

### Quick Reference: All Testing Tools

| Tool | Phase | Purpose | Key Use Case |
|------|-------|---------|--------------|
| `run_tests` | 1 | Execute tests with structured output | Run smoke/sanity/full test suites |
| `analyze_test_failures` | 1 | AI-powered failure analysis | Get fix suggestions for failing tests |
| `get_coverage` | 1 | Generate coverage reports | Track code coverage metrics |
| `detect_changed_files` | 2 | Find changed files via git | Run only affected tests |
| `generate_tests` | 2 | Auto-generate test scaffolds | Add tests for uncovered code |
| `analyze_coverage_gaps` | 2 | Identify low-coverage files | Find critical missing tests |
| `generate_regression_test` | 2 | Create tests for fixed bugs | Prevent bug regressions |
| `generate_integration_test` | 3 | Multi-component testing | Test component interactions |
| `generate_e2e_test` | 3 | End-to-end user journeys | Test complete user flows |
| `generate_api_test` | 3 | API endpoint testing | Validate REST/GraphQL APIs |
| `parse_prd` | 4 | Extract requirements from PRDs | Convert PRDs to test cases |
| `generate_tests_from_prd` | 4 | PRD to executable tests | Generate tests from requirements |
| `generate_performance_test` | 4 | Load/stress testing | Test system performance |

**Plus**: Spring Boot auto-detection with Maven/Gradle support and component-aware test generation!

### Configuration Options

The agent supports several configuration options via the `AgentOptions` interface:

```typescript
{
  verboseTools: boolean,              // Show full tool outputs (default: false)
  maxToolOutputChars: number,         // Max chars in tool output (default: 6000)
  streamCommandOutput: boolean,       // Stream command output (default: false)
  streamAssistantResponses: boolean,  // Stream AI responses (default: false)
  enableIntermediateReasoning: boolean // Show reasoning before actions (default: true)
}
```

**Command-line flags:**
- `--verbose-tools`: Enable verbose tool output
- Environment variable: `TOOLS_VERBOSE=1`

### Phase 1: Foundation Tools

#### 1. `run_tests` - Execute Tests with Structured Output
Run Python and/or Java tests with multiple modes and optional coverage.

**Usage:**
```typescript
run_tests({
  language: "python" | "java" | "all",  // default: "all"
  mode: "smoke" | "sanity" | "full",    // default: "full"
  coverage: true/false                   // default: false
})
```

**Features:**
- **Three test modes**:
  - `smoke`: Fast, critical tests only (fail-fast) - unit tests, no Spring context
  - `sanity`: Targeted tests after minor changes - slice tests with partial context
  - `full`: Complete test suite - integration tests with full context
- Structured output parsing with pass/fail counts
- Extracts failure details from JSON reports (pytest) and XML reports (JUnit)
- Shows test report locations
- Supports coverage generation (coverage.py for Python, JaCoCo for Java)
- Uses `scripts/test-runner.sh` for unified test execution
- 180-second timeout with graceful handling

#### 2. `analyze_test_failures` - AI-Powered Failure Analysis
Analyze test output to identify failures and suggest fixes.

**Usage:**
```typescript
analyze_test_failures({
  test_output: "...",
  language: "python" | "java"
})
```

**Features:**
- Parses stack traces and error messages
- Extracts failure locations (file:line)
- Identifies test names and error types
- Provides recommended actions with specific fix suggestions

#### 3. `get_coverage` - Coverage Analysis
Generate and analyze code coverage reports.

**Usage:**
```typescript
get_coverage({
  language: "python" | "java"
})
```

**Features:**
- Python: Reads coverage.py reports
- Java: Parses JaCoCo XML reports
- Shows coverage percentages (instruction, line, branch)
- Provides HTML report locations
- Suggests next steps for improving coverage

### Phase 2: AI-Powered Testing Tools

#### 4. `detect_changed_files` - Smart Test Selection
Detect which files have changed and identify affected tests.

**Usage:**
```typescript
detect_changed_files({
  since: "HEAD~1" | "main" | "1 day ago",  // default: "HEAD"
  language: "python" | "java" | "all"      // default: "all"
})
```

**Features:**
- Uses git to identify modified files
- Automatically maps source files to test files
- Suggests which tests to run
- Enables targeted testing for faster feedback

**Use Cases:**
- Fast development feedback (run only relevant tests)
- CI/CD optimization (selective test execution)
- Pull request validation (test only affected components)

#### 5. `generate_tests` - Automated Test Generation
Analyze source code and generate comprehensive test scaffolds.

**Usage:**
```typescript
generate_tests({
  file_path: "path/to/source.py",
  language: "python" | "java",
  coverage_data: "optional coverage info"  // optional
})
```

**Features:**
- Extracts all functions/methods from source code
- Generates test scaffolds with:
  - Happy path tests (valid inputs)
  - Edge case tests (empty, null, zero, boundary values)
  - Error handling tests (invalid inputs, exceptions)
- Follows language conventions (pytest, JUnit 5)
- Provides TODO comments for implementation guidance

**Use Cases:**
- Increase coverage quickly
- New feature development (TDD)
- Add tests to legacy code
- Help developers understand testing patterns

#### 6. `analyze_coverage_gaps` - Gap Identification
Identify files with low coverage and suggest improvements.

**Usage:**
```typescript
analyze_coverage_gaps({
  language: "python" | "java" | "all",
  min_coverage: 80  // default: 80%
})
```

**Features:**
- Parses coverage reports (coverage.py, JaCoCo)
- Identifies files below coverage threshold
- Shows specific missing line numbers
- Prioritizes gaps by importance
- Provides actionable recommendations

**Use Cases:**
- Quality gates (ensure minimum coverage before merging)
- Coverage improvement (identify and prioritize gaps)
- Code review (spot untested code paths)
- Risk assessment (find critical code without tests)

#### 7. `generate_regression_test` - Bug Prevention
Create tests for fixed bugs to prevent regressions.

**Usage:**
```typescript
generate_regression_test({
  bug_description: "uppercase_tool only processed first 2 words",
  fixed_file: "tests/python/agent.py",
  language: "python" | "java"
})
```

**Features:**
- Generates well-structured regression test scaffolds
- Includes clear naming: `test_regression_[bug_description]`
- Adds documentation explaining the original bug
- Provides setup/action/assert structure
- Follows test marking conventions (@pytest.mark.regression, @Tag("regression"))

**Use Cases:**
- Bug prevention (ensure fixed bugs don't come back)
- Regression suite building
- Bug documentation with executable tests
- Quality assurance (verify bug fixes work correctly)

## Testing Workflows

### Workflow 1: Smart Testing After Code Changes
```bash
# Detect what changed
> detect_changed_files since HEAD~1

# Run only affected tests (fast!)
> run_tests language=python (filtered to affected tests)

# If failures, analyze them
> analyze_test_failures

# Fix issues and verify
> run_tests language=python
```

**Benefits**: 10x faster feedback, efficient CI/CD, quick iteration cycles

### Workflow 2: Coverage-Driven Development
```bash
# Run tests with coverage
> run_tests language=python coverage=true

# Analyze gaps
> analyze_coverage_gaps language=python min_coverage=80

# Generate tests for gaps
> generate_tests file_path=helper.py language=python

# Verify coverage improved
> run_tests language=python coverage=true
> get_coverage language=python
```

**Benefits**: Systematic coverage improvement, automated test scaffolds, quality metrics tracking

### Workflow 3: Bug Fix with Regression Test
```bash
# Fix the bug
> (AI fixes the code)

# Generate regression test
> generate_regression_test
    bug_description="EUR to GBP conversion used wrong rate"
    fixed_file="CurrencyConverter.java"
    language=java

# Run test to verify fix
> run_tests language=java
```

**Benefits**: Automated protection against regressions, tests document known bugs, confidence in fixes

### Workflow 4: API Testing
```bash
# Generate comprehensive API tests
> generate_api_test
    endpoints=["/api/users", "/api/users/{id}", "/api/login"]
    language=python
    api_spec="openapi.yaml"

# Run API tests
> run_tests language=python

# Check coverage
> get_coverage language=python
```

**Benefits**: Complete API validation, schema compliance, contract testing, error handling verification

### Workflow 5: E2E Testing for Web Apps
```bash
# Generate end-to-end test
> generate_e2e_test
    user_journey="User logs in, searches for product, adds to cart, checks out"
    app_type=web
    framework=playwright

# Run E2E tests
> run_command command="npx playwright test"
```

**Benefits**: Real user flow validation, cross-browser testing, UI regression detection

### Workflow 6: PRD-Driven Testing
```bash
# Fix the bug
> (AI fixes the code)

# Generate regression test
> generate_regression_test
    bug_description="EUR to GBP conversion used wrong rate"
    fixed_file="CurrencyConverter.java"
    language=java

# Run test to verify fix
> run_tests language=java
```

```bash
# Parse PRD document
> parse_prd prd_file="docs/user-management-prd.md" output_format=json

# Generate tests from PRD
> generate_tests_from_prd
    test_cases_file="test-cases.json"
    language=java
    test_suite=integration

# Run generated tests
> run_tests language=java mode=full
```

**Benefits**: Requirements traceability, automated test planning, UAT test generation

### Workflow 7: Performance Testing
```bash
# Generate load test
> generate_performance_test
    target_url="https://api.example.com/users"
    test_type=load
    tool=k6

# Run performance test
> run_command command="k6 run load-test.js"
```

**Benefits**: Scalability validation, capacity planning, performance benchmarking

### Workflow 8: Spring Boot Testing
```bash
# Generate tests for Spring Boot controller
> generate_tests
    file_path="src/main/java/com/example/UserController.java"
    language=java

# Run smoke tests (fast unit tests)
> run_tests language=java mode=smoke

# Run sanity tests (slice tests)
> run_tests language=java mode=sanity

# Run full suite with coverage
> run_tests language=java mode=full coverage=true
```

**Benefits**: Fast feedback with test slicing, component-aware testing, Spring Boot best practices

### Phase 3: Advanced Testing Tools

#### 8. `generate_integration_test` - Component Integration Testing
Generate tests that verify interactions between multiple components.

**Usage:**
```typescript
generate_integration_test({
  components: ["UserController.java", "UserService.java", "UserRepository.java"],
  language: "java" | "python" | "javascript",
  test_scenario: "User registration flow with validation and persistence"
})
```

**Features:**
- Analyzes dependencies between components
- Creates tests with proper mocks/stubs
- Tests component interactions and data flow
- Follows integration testing best practices

**Use Cases:**
- Multi-layer application testing (controller → service → repository)
- API integration with external services
- Microservice communication testing
- Database integration verification

#### 9. `generate_e2e_test` - End-to-End Testing
Generate complete user journey tests for web applications.

**Usage:**
```typescript
generate_e2e_test({
  user_journey: "User logs in, adds item to cart, and completes checkout",
  app_type: "web" | "api" | "cli",
  framework: "playwright" | "selenium" | "cypress" | "puppeteer"  // optional
})
```

**Features:**
- Simulates real user interactions
- Supports multiple E2E frameworks
- Generates page object patterns
- Includes assertions and waits

**Use Cases:**
- Critical user flow validation
- Cross-browser testing
- UI regression testing
- Acceptance testing

#### 10. `generate_api_test` - API Testing Suite
Generate comprehensive API test suites with schema validation.

**Usage:**
```typescript
generate_api_test({
  endpoints: ["/api/users", "/api/users/{id}", "/api/login"],
  language: "javascript" | "python" | "java",
  api_spec: "path/to/openapi.yaml"  // optional
})
```

**Features:**
- Endpoint testing (GET, POST, PUT, DELETE)
- Schema validation
- Contract testing
- Authentication testing
- Error response validation

**Use Cases:**
- REST API testing
- GraphQL API testing
- API contract verification
- Backend service testing

### Phase 4: PRD-Driven Testing & Performance

#### 11. `parse_prd` - Extract Testable Requirements
Parse Product Requirements Documents to extract structured test cases.

**Usage:**
```typescript
parse_prd({
  prd_file: "docs/product-requirements.md",
  output_format: "markdown" | "json"  // default: "markdown"
})
```

**Features:**
- Supports markdown, text, and PDF files
- Extracts functional and non-functional requirements
- Converts to structured test cases
- Identifies acceptance criteria

**Use Cases:**
- Requirements-based testing
- Test planning from PRDs
- Traceability matrix creation
- QA test case generation

#### 12. `generate_tests_from_prd` - PRD to Executable Tests
Convert PRD test cases into executable test code.

**Usage:**
```typescript
generate_tests_from_prd({
  test_cases_file: "test-cases.json",
  language: "python" | "java" | "javascript",
  test_suite: "unit" | "integration" | "system" | "uat"
})
```

**Features:**
- Converts structured test cases to code
- Generates appropriate test types
- Includes setup/teardown logic
- Maps requirements to test methods

**Use Cases:**
- Automated test generation from requirements
- UAT test creation
- System test generation
- Acceptance test automation

#### 13. `generate_performance_test` - Load & Performance Testing
Generate performance and load test scripts.

**Usage:**
```typescript
generate_performance_test({
  target_url: "https://api.example.com/users",
  test_type: "load" | "stress" | "spike" | "endurance",
  tool: "k6" | "jmeter" | "locust" | "artillery"  // optional
})
```

**Features:**
- Multiple test types (load, stress, spike, endurance)
- Configurable load patterns
- Supports popular performance tools
- Includes metrics and thresholds

**Use Cases:**
- API performance testing
- Load capacity planning
- Stress testing
- Scalability verification

## Spring Boot Testing Support (New! 🎉)

CodeCLI now includes comprehensive Spring Boot testing support with automatic component detection and intelligent test generation.

### Features

- **Auto-Detection**: Automatically identifies Spring Boot projects via `pom.xml` and annotations
- **Component-Aware**: Generates appropriate tests based on `@Controller`, `@Service`, `@Repository` annotations
- **Test Slicing**: Uses Spring Boot test slices (`@WebMvcTest`, `@DataJpaTest`) for fast, focused tests
- **Mode Mapping**: 
  - `smoke` → Unit tests with Mockito (no Spring context)
  - `sanity` → Slice tests (web/data layers with partial context)
  - `full` → Integration tests with full Spring context
- **Coverage Integration**: Works seamlessly with JaCoCo

### Quick Start

```bash
# Generate tests for a Spring Boot controller
generate_tests file_path=src/main/java/com/example/UserController.java language=java

# Run smoke tests (fast unit tests)
run_tests language=java mode=smoke

# Run all tests with coverage
run_tests language=java mode=full coverage=true
```

### Test Types Generated

1. **Service Tests** (`@ExtendWith(MockitoExtension.class)`) - Fast unit tests with mocked dependencies
2. **Controller Tests** (`@WebMvcTest`) - Web layer slice tests with MockMvc
3. **Repository Tests** (`@DataJpaTest`) - Data layer tests with H2 in-memory database
4. **Integration Tests** (`@SpringBootTest`) - Full application context tests

See [docs/SPRINGBOOT_TESTING.md](docs/SPRINGBOOT_TESTING.md) for complete guide.

## Manual Test Execution

You can also run tests manually using the unified test runner:

```bash
# Run all tests
bash scripts/test-runner.sh --mode full

# Run Python tests only
bash scripts/test-runner.sh --language python

# Run with coverage
bash scripts/test-runner.sh --coverage

# Run smoke tests (fast)
bash scripts/test-runner.sh --mode smoke

# Generate report
bash scripts/test-runner.sh --report
```

## Test Results

### Current Status
- ✅ **Python Tests**: 35/35 passing (test_agent.py)
- ✅ **Java Tests**: 42/42 passing (CurrencyConverterTest: 30, SudokuTest: 12)
- ✅ **Spring Boot Tests**: 
  - Currency Converter: 30/30 passing (Controller: 9, Service: 9, Model: 6, Integration: 6)
  - User Management: 18/18 passing (Controller: 6, Service: 6, Repository: 3, Integration: 3)
- ✅ **Total**: 125+ tests passing

### Coverage Reports
- **Python**: `tests/python/htmlcov/index.html`
- **Java**: `tests/java/target/site/jacoco/index.html`
- **Spring Boot Projects**:
  - Currency Converter: `tests/java/spring-currencyconverter/target/site/jacoco/index.html`
  - User Management: `tests/java/springboot/target/site/jacoco/index.html`

## Documentation

Comprehensive guides are available in the `docs/` directory:

- **[SPRINGBOOT_TESTING.md](docs/SPRINGBOOT_TESTING.md)** - Complete Spring Boot testing guide
- **[TESTING_IMPLEMENTATION.md](docs/TESTING_IMPLEMENTATION.md)** - Phase 1 testing implementation details
- **[TESTING_PHASE2.md](docs/TESTING_PHASE2.md)** - Phase 2 AI-powered testing features
- **[SETUP.md](docs/SETUP.md)** - Detailed setup instructions
- **[QUICKSTART.md](docs/QUICKSTART.md)** - Quick start guide
- **[FEATURES.md](docs/FEATURES.md)** - Feature documentation
- **[plan.md](docs/plan.md)** - Development roadmap

## Project Structure

```
CodeCLI/
├── src/
│   ├── index.ts                 # Main CLI entry point
│   ├── core/
│   │   ├── agent.ts            # AI agent implementation
│   │   ├── types.ts            # TypeScript type definitions
│   │   ├── confirm.ts          # User confirmation prompts
│   │   └── tools/
│   │       ├── index.ts        # Tool registry
│   │       ├── files.ts        # File operation tools
│   │       ├── scaffold.ts     # Project scaffolding
│   │       ├── commands.ts     # Command execution
│   │       ├── tests.ts        # Phase 1 testing tools
│   │       ├── generation.ts   # Phase 2 AI testing tools
│   │       ├── advanced-testing.ts  # Phase 3 testing tools
│   │       ├── prd-testing.ts  # Phase 4 PRD & performance testing
│   │       └── springboot-templates.ts  # Spring Boot support
│   └── utils/
│       ├── colors.ts           # Terminal color utilities
│       └── springboot-detector.ts  # Spring Boot detection
├── scripts/
│   ├── test-runner.sh          # Unified test runner
│   └── generate-report.sh      # Report generator
├── tests/
│   ├── python/
│   │   ├── pytest.ini          # PyTest configuration
│   │   ├── requirements-test.txt
│   │   ├── test_agent.py       # 35 tests
│   │   └── agent.py            # Implementation
│   └── java/
│       ├── pom.xml             # Maven configuration
│       ├── currency/           # Currency converter (30 tests)
│       └── sudoku/             # Sudoku solver (12 tests)
├── dist/                       # Compiled JavaScript
├── package.json
├── tsconfig.json
├── README.md                   # This file
├── TESTING_IMPLEMENTATION.md   # Phase 1 details
├── TESTING_PHASE2.md          # Phase 2 details
└── CLAUDE.md                  # Claude Code guidance
```

## Configuration

### API Configuration
- **Base URL**: `https://openrouter.ai/api/v1`
- **Model**: `anthropic/claude-sonnet-4.5`
- **Temperature**: 0.3 (consistent, deterministic)
- **Max Tokens**: 16384 (allows full file writes)

### Safe Mode
- All file writes/edits show preview before execution
- Previews limited to first 20 lines (write_file) or 10 lines (edit_file)
- User must type 'y' or 'yes' to confirm
- Operation cancelled if user declines

### File Size Limits
- `read_file` truncates at 10,000 characters
- `list_files` max depth: 3 levels
- Automatically skips: node_modules, .git, hidden files

## Key Features

### Error Recovery
- Automatic retry on 400 errors (up to 3 attempts)
- Removes problematic messages and adds clarification prompts
- Graceful degradation on tool call errors

### Message Flow
1. User input → added to message history
2. API call with tools enabled
3. If tool calls detected → execute with user confirmation
4. Tool results → added to history
5. Follow-up API call to generate natural language response

### Intelligent Failure Analysis
- Parses stack traces automatically
- Identifies root causes
- Suggests specific fixes with file locations
- Multi-language support (Python, Java)

## Notes

- Token budget raised to 16384 for tool calls to allow full `write_file` payloads (prevents truncation).
- Safe-mode confirmations apply to file writes, patches, and shell commands.
- Known limitation: the agent can sometimes prefer overwriting an entire file instead of issuing a targeted edit/patch, which wastes tokens and can increase cost; guide the agent toward `edit_file`/`patch_file` for small changes.
- The testing framework is production-ready with both Phase 1 (foundation) and Phase 2 (AI-powered) complete.

## Getting Started

1. **Install Bun**: https://bun.sh
2. **Set up API key**: Create `.env` with your OpenRouter API key
3. **Install dependencies**: `bun install`
4. **Run the agent**: `bun start`
5. **Try testing features**: Ask the agent to run tests, analyze failures, or generate new tests!

Example prompts:
- "Run all tests and analyze any failures"
- "Generate test coverage reports for Python"
- "What files changed since yesterday? Run their tests."
- "Generate tests for the helper.py file"
- "Find files with coverage below 80%"
- "Create a regression test for the bug I just fixed"

The AI will use the appropriate tools automatically to test, analyze, and improve your code! 🎉

## Completed Features

### ✅ Phase 1: Foundation Testing Tools (Complete)
- **run_tests**: Execute tests with structured output (smoke/sanity/full modes)
- **analyze_test_failures**: AI-powered failure analysis with fix suggestions
- **get_coverage**: Coverage report generation and analysis

### ✅ Phase 2: AI-Powered Testing (Complete)
- **detect_changed_files**: Smart test selection based on git changes
- **generate_tests**: Automated test generation for uncovered code
- **analyze_coverage_gaps**: Identify files below coverage threshold
- **generate_regression_test**: Create tests for fixed bugs

### ✅ Phase 3: Advanced Testing & Quality Assurance (Complete)
- **generate_integration_test**: Multi-component integration testing
- **generate_e2e_test**: End-to-end user journey tests (Playwright, Selenium, Cypress)
- **generate_api_test**: Comprehensive API testing with schema validation

### ✅ Phase 4: PRD-Driven Testing & Performance (Complete)
- **parse_prd**: Extract testable requirements from PRD documents
- **generate_tests_from_prd**: Convert PRD requirements to executable tests
- **generate_performance_test**: Load, stress, spike, and endurance testing (k6, JMeter, Locust)

### ✅ Spring Boot Testing Support (Complete)
- Auto-detection of Spring Boot projects
- Component-aware test generation (@Controller, @Service, @Repository)
- Test slicing with @WebMvcTest, @DataJpaTest
- Mode-based testing (smoke/sanity/full)
- JaCoCo coverage integration

## Examples

### File Operations
```bash
# Create a new file
User: "Create an index.html file with a simple page"
Agent: Uses write_file tool → Shows preview → Asks for confirmation → Creates file

# Update existing file
User: "Update the README to add a new section about testing"
Agent: Uses edit_file tool → Shows diff → Asks for confirmation → Applies changes

# Read file contents
User: "Show me the contents of package.json"
Agent: Uses read_file tool → Displays file contents (truncated if > 10,000 chars)

# List directory
User: "What files are in the src directory?"
Agent: Uses list_files tool → Shows directory tree (max depth 3)
```

### Testing Workflow
```bash
# Run tests and fix failures
User: "Run the Python tests and fix any failures"
Agent workflow:
1. Uses run_tests(language="python", mode="full")
2. If failures occur, uses analyze_test_failures for detailed analysis
3. Uses read_file to examine failing test and implementation
4. Uses edit_file to fix the issues
5. Re-runs tests to verify fixes

# Generate tests for uncovered code
User: "Generate tests for the UserService class"
Agent: Uses generate_tests(file_path="UserService.java", language="java")
       → Analyzes code → Generates test scaffolds → Creates test file

# Check coverage gaps
User: "What files need more test coverage?"
Agent: Uses analyze_coverage_gaps(language="all", min_coverage=80)
       → Identifies low-coverage files → Suggests specific test cases
```

### Spring Boot Testing
```bash
# Test Spring Boot application
User: "Test my Spring Boot application"
Agent workflow:
1. Detects Spring Boot project (checks pom.xml/build.gradle)
2. Identifies build tool (Maven or Gradle)
3. Detects component types (@Controller, @Service, @Repository)
4. Generates appropriate tests (@WebMvcTest, @DataJpaTest, etc.)
5. Runs tests with proper test slicing
6. Generates coverage report with JaCoCo

# Run smoke tests only
User: "Run smoke tests for the Spring Boot app"
Agent: Uses run_tests(language="java", mode="smoke")
       → Runs unit tests only (no Spring context, fastest)
```

### Project Scaffolding
```bash
# Create new chatbot project
User: "Create a new Next.js chatbot project called 'my-bot'"
Agent: Uses scaffold_project(template="chatbot", name="my-bot")
       → Creates project structure → Installs dependencies → Ready to run

# Create API with React frontend
User: "Scaffold a React app with an API backend"
Agent: Uses scaffold_project(template="react", name="my-app", include_api=true)
       → Creates React frontend + Express API → Configured for development
```

### Advanced Testing
```bash
# Integration testing
User: "Create integration tests for UserController and UserService"
Agent: Uses generate_integration_test(
         components=["UserController.java", "UserService.java"],
         language="java",
         test_scenario="User registration flow"
       )

# E2E testing
User: "Generate E2E tests for the login flow using Playwright"
Agent: Uses generate_e2e_test(
         user_journey="User logs in, views dashboard, logs out",
         app_type="web",
         framework="playwright"
       )

# Performance testing
User: "Create a load test for the /api/users endpoint"
Agent: Uses generate_performance_test(
         target_url="http://localhost:8080/api/users",
         test_type="load",
         tool="k6"
       )
```

## Troubleshooting

### Common Issues

#### 1. "OPENROUTER_API_KEY environment variable is not set"
**Solution:**
```bash
# Create .env file in project root
echo "OPENROUTER_API_KEY=sk-or-v1-your-key-here" > .env

# Get your API key from: https://openrouter.ai/keys
```

#### 2. "Non-interactive mode is not supported"
**Problem:** Agent requires a TTY (interactive terminal)

**Solution:**
```bash
# ✅ Correct: Run directly in terminal
bun start

# ❌ Wrong: Piping input
echo "create file" | bun start

# ✅ For CI/CD: Use TTY allocation
docker run -it your-image bun start
```

#### 3. Test timeout errors
**Problem:** Tests exceed 180-second timeout

**Solution:**
```bash
# Pre-install dependencies to avoid timeout during test run
# Python:
venv/bin/pip install -r tests/python/requirements-test.txt

# Java (Maven):
mvn -f tests/java/pom.xml test-compile

# Java (Gradle):
gradle -p tests/java compileTestJava
```

#### 4. "Could not resolve test file path"
**Problem:** Path resolution fails for non-standard project layouts

**Solution:**
- Ensure source files are in standard locations:
  - Maven: `src/main/java` or `src/main/kotlin`
  - Gradle: `src/main/java` or `src/main/kotlin`
- Check that build tool is detected correctly (pom.xml or build.gradle exists)

#### 5. Spring Boot tests not detected
**Problem:** Spring Boot project not recognized

**Solution:**
```bash
# Ensure pom.xml contains Spring Boot dependency:
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter</artifactId>
</dependency>

# Or for Gradle (build.gradle):
plugins {
    id 'org.springframework.boot' version '3.x.x'
}
```

#### 6. Coverage reports not generated
**Problem:** Coverage data missing

**Solution:**
```bash
# Python: Ensure coverage.py is installed
venv/bin/pip install coverage pytest-cov

# Java (Maven): Add JaCoCo plugin to pom.xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
</plugin>

# Java (Gradle): Add JaCoCo plugin to build.gradle
plugins {
    id 'jacoco'
}
```

### Debug Mode

Enable verbose output to see full tool execution details:

```bash
# Command-line flag
bun start --verbose-tools

# Environment variable
TOOLS_VERBOSE=1 bun start
```

### Getting Help

1. **Check Documentation**: See `docs/` directory for detailed guides
2. **Review Examples**: Check `tests/` directory for working examples
3. **Enable Reasoning**: Set `enableIntermediateReasoning=true` to see agent's thought process
4. **Check Logs**: Review terminal output for error messages and stack traces

## Future Plans

### Phase 5: Multi-Language Expansion
- **JavaScript/TypeScript Support**: Jest, Vitest, Mocha integration
- **Go Testing**: Native Go test framework support
- **Rust Testing**: Cargo test integration with coverage
- **C#/.NET Support**: xUnit, NUnit, MSTest frameworks
- **Ruby Support**: RSpec and Minitest integration
- **PHP Support**: PHPUnit integration

### Phase 6: CI/CD Integration
- **GitHub Actions Integration**: Auto-generate workflow files
- **GitLab CI Support**: Pipeline configuration generation
- **Jenkins Integration**: Jenkinsfile generation and optimization
- **Test Result Publishing**: Automatic test report uploads
- **Coverage Badges**: Generate and update coverage badges
- **PR Comments**: Automated test results in pull request comments
- **Slack/Discord Notifications**: Test failure alerts

### Phase 7: AI-Powered Code Analysis
- **Code Review Assistant**: Automated code review with suggestions
- **Security Vulnerability Scanning**: Detect common security issues
- **Performance Analysis**: Identify performance bottlenecks
- **Code Smell Detection**: Find anti-patterns and suggest refactoring
- **Dependency Analysis**: Detect outdated or vulnerable dependencies
- **Documentation Generation**: Auto-generate API docs from code

### Phase 8: Enhanced Developer Experience
- **Interactive Test Debugging**: Step-through test failures with AI guidance
- **Test Data Generation**: Smart test fixture and mock data creation
- **Snapshot Testing**: Automatic snapshot creation and comparison
- **Visual Test Reports**: Rich HTML/PDF test reports with charts
- **Test Metrics Dashboard**: Track test health over time
- **IDE Integration**: VSCode/IntelliJ plugins for in-editor testing

### Phase 9: Collaboration & Team Features
- **Team Test Analytics**: Aggregate test metrics across team members
- **Test Ownership Tracking**: Identify test maintainers
- **Test Documentation Hub**: Centralized test documentation
- **Shared Test Libraries**: Reusable test utilities across projects
- **Test Review Workflows**: Peer review for test quality
- **Knowledge Base**: AI-powered test pattern recommendations

### Phase 10: Advanced Scaffolding
- **Microservices Templates**: Multi-service project scaffolds
- **Database Integration**: Pre-configured DB setups (PostgreSQL, MongoDB, Redis)
- **Authentication Scaffolds**: OAuth, JWT, session-based auth templates
- **GraphQL Templates**: Apollo Server, GraphQL Yoga scaffolds
- **Mobile App Templates**: React Native, Flutter scaffolds
- **Desktop App Templates**: Electron, Tauri scaffolds
- **Monorepo Support**: Nx, Turborepo, Lerna configurations

### Phase 11: Intelligent Automation
- **Auto-Fix Suggestions**: One-click fixes for common test failures
- **Predictive Test Selection**: ML-based test prioritization
- **Adaptive Test Generation**: Learn from existing tests to improve generation
- **Smart Test Maintenance**: Auto-update tests when code changes
- **Continuous Learning**: Improve AI suggestions based on user feedback
- **Custom Tool Creation**: Allow users to define custom testing tools

### Long-Term Vision
- **Multi-Agent Collaboration**: Multiple AI agents working together on complex tasks
- **Natural Language Testing**: Write tests in plain English, AI converts to code
- **Self-Healing Tests**: Automatically fix broken tests when code changes
- **Cross-Project Learning**: Share testing knowledge across multiple projects
- **Test Marketplace**: Community-contributed test templates and tools
- **Enterprise Features**: SSO, audit logs, compliance reporting, team management

### Community & Open Source
- **Plugin System**: Allow community-built extensions
- **Template Marketplace**: Share and discover project templates
- **Tool Contributions**: Community-contributed testing tools
- **Documentation Improvements**: Comprehensive guides and tutorials
- **Example Projects**: Reference implementations for best practices
- **Community Support**: Discord server, GitHub discussions, Stack Overflow tag

---

## License
MIT
