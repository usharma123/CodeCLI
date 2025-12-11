# AI Coding Agent

## What It Does
- **CLI coding agent** that reads/writes files directly using tools (read, write, edit, patch, scaffold, list, run_command).
- **Safe mode**: Previews and asks for confirmation before writes/patches/commands.
- Uses **OpenRouter** with **Claude Sonnet 4.5** (low-temp, deterministic) and retries with validation on malformed tool args.
- Includes **scaffolding templates** (API, chatbot, static, React) to bootstrap new projects quickly.
- Can execute shell commands (e.g., `pytest`, `npm test`) via `run_command`, streaming output and honoring timeouts.
- **AI-powered testing framework** with intelligent test execution, automated test generation, and coverage analysis.

## Tech Stack
- **Runtime**: Bun
- **Language**: TypeScript
- **Model Gateway**: OpenRouter
- **Default Model**: Claude Sonnet 4.5 (anthropic/claude-sonnet-4.5)
- **Env/config**: dotenv-loaded `.env`
- **Testing**: PyTest (Python), JUnit 5 + Maven (Java)
- **Coverage**: coverage.py (Python), JaCoCo (Java)

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
- **Start the agent (dev)**: `bun run dev`  
- **Start the agent (prod/start)**: `bun start`
- **Build TypeScript**: `bun run build`

On launch, the agent:
- Prints an ASCII banner and safe-mode notice.
- Loads tools for file ops, scaffolding, testing, and `run_command`.
- Uses interactive CLI prompts; exit with `ctrl-c`.
- Shows previews and requires `y/yes` before writes/patches/commands.
- Handles malformed tool arguments with retries, validation, and truncation detection for large `write_file` payloads.

## Core Tools

### File Operations
- **`read_file`**: Read file contents (truncates at 10,000 chars)
- **`write_file`**: Create or overwrite files (shows preview, requires confirmation)
- **`edit_file`**: Replace specific text in files (shows diff-style preview, requires confirmation)
- **`patch_file`**: Apply unified diff patches
- **`list_files`**: List directory contents (max depth: 3, skips node_modules/.git/hidden files)

### Project Scaffolding
- **`scaffold_project`**: Bootstrap new projects with templates:
  - `api` - REST API server
  - `chatbot` - AI chatbot interface
  - `static` - Static HTML site
  - `react` - React application (optional API)

### Command Execution
- **`run_command`**: Execute shell commands with timeout and output capture

## Testing Framework (Phase 1 & 2 Complete ✅)

The agent includes a comprehensive AI-powered testing framework with 7 specialized tools:

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
  - `smoke`: Fast, critical tests only (fail-fast)
  - `sanity`: Targeted tests after minor changes
  - `full`: Complete test suite
- Structured output parsing with pass/fail counts
- Extracts failure details from JSON reports
- Shows test report locations
- Supports coverage generation

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
- ✅ **Total**: 77 tests passing

### Coverage Reports
- **Python**: `tests/python/htmlcov/index.html`
- **Java**: `tests/java/target/site/jacoco/index.html`

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
│   │       └── generation.ts   # Phase 2 AI testing tools
│   └── utils/
│       └── colors.ts           # Terminal color utilities
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

## Future Steps

### Phase 3: Advanced Features (Planned)
- PRD-based test generation (PDF parsing)
- Integration testing with mocks/fixtures
- System/E2E testing
- Performance/load testing
- CI/CD integration examples
- Pattern recognition for common errors
- Historical failure analysis
- Coverage trend tracking

### Additional Improvements
- Add automated tests for tool flows and confirmation prompts
- Extend the toolset (search/grep helpers, formatting, lint hooks)
- Support additional models and configurable model selection at runtime
- Containerize/distribute (Docker image, binary bundle) for easier install

## Documentation

- **README.md** (this file): Overview and usage
- **TESTING_IMPLEMENTATION.md**: Phase 1 testing framework details
- **TESTING_PHASE2.md**: Phase 2 AI-powered testing features
- **CLAUDE.md**: Guidance for Claude Code when working with this repository

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

## Future Plans

### Phase 3: Advanced Testing & Quality Assurance
- **Mutation Testing**: Automatically inject bugs to verify test effectiveness
- **Flaky Test Detection**: Identify and analyze non-deterministic test failures
- **Test Performance Profiling**: Find slow tests and suggest optimizations
- **Visual Regression Testing**: Screenshot comparison for UI components
- **Contract Testing**: API contract validation between services
- **Property-Based Testing**: Generate random test inputs to find edge cases

### Phase 4: Multi-Language Expansion
- **JavaScript/TypeScript Support**: Jest, Vitest, Mocha integration
- **Go Testing**: Native Go test framework support
- **Rust Testing**: Cargo test integration with coverage
- **C#/.NET Support**: xUnit, NUnit, MSTest frameworks
- **Ruby Support**: RSpec and Minitest integration
- **PHP Support**: PHPUnit integration

### Phase 5: CI/CD Integration
- **GitHub Actions Integration**: Auto-generate workflow files
- **GitLab CI Support**: Pipeline configuration generation
- **Jenkins Integration**: Jenkinsfile generation and optimization
- **Test Result Publishing**: Automatic test report uploads
- **Coverage Badges**: Generate and update coverage badges
- **PR Comments**: Automated test results in pull request comments
- **Slack/Discord Notifications**: Test failure alerts

### Phase 6: AI-Powered Code Analysis
- **Code Review Assistant**: Automated code review with suggestions
- **Security Vulnerability Scanning**: Detect common security issues
- **Performance Analysis**: Identify performance bottlenecks
- **Code Smell Detection**: Find anti-patterns and suggest refactoring
- **Dependency Analysis**: Detect outdated or vulnerable dependencies
- **Documentation Generation**: Auto-generate API docs from code

### Phase 7: Enhanced Developer Experience
- **Interactive Test Debugging**: Step-through test failures with AI guidance
- **Test Data Generation**: Smart test fixture and mock data creation
- **Snapshot Testing**: Automatic snapshot creation and comparison
- **Visual Test Reports**: Rich HTML/PDF test reports with charts
- **Test Metrics Dashboard**: Track test health over time
- **IDE Integration**: VSCode/IntelliJ plugins for in-editor testing

### Phase 8: Collaboration & Team Features
- **Team Test Analytics**: Aggregate test metrics across team members
- **Test Ownership Tracking**: Identify test maintainers
- **Test Documentation Hub**: Centralized test documentation
- **Shared Test Libraries**: Reusable test utilities across projects
- **Test Review Workflows**: Peer review for test quality
- **Knowledge Base**: AI-powered test pattern recommendations

### Phase 9: Advanced Scaffolding
- **Microservices Templates**: Multi-service project scaffolds
- **Database Integration**: Pre-configured DB setups (PostgreSQL, MongoDB, Redis)
- **Authentication Scaffolds**: OAuth, JWT, session-based auth templates
- **GraphQL Templates**: Apollo Server, GraphQL Yoga scaffolds
- **Mobile App Templates**: React Native, Flutter scaffolds
- **Desktop App Templates**: Electron, Tauri scaffolds
- **Monorepo Support**: Nx, Turborepo, Lerna configurations

### Phase 10: Intelligent Automation
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
