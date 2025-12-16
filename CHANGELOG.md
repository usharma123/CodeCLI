# Changelog

All notable changes to CodeCLI are documented in this file.

## [Latest Updates] - December 2024

### Added - Todo List Management & Intermediate Reasoning 🎯

#### Todo List System
- **New `todo_write` Tool**: Manage task progress with structured todo lists
  - Create initial todo lists for complex tasks (3+ steps)
  - Update todo status as work progresses
  - Enforces single in-progress task at a time
  - Each todo has: content (imperative), activeForm (present continuous), status
  - Automatic status updates emitted to UI

- **Todo List UI Component**: Visual task progress display (`TodoList.tsx`)
  - Color-coded status indicators (✓ completed, → in-progress, ○ pending)
  - Integrated with Ink terminal UI
  - Real-time updates as agent works

#### Intermediate Reasoning
- **Pre-Tool Reasoning**: Agent explains what it's about to do before executing tools
  - 1-sentence concise explanations
  - Styled cyan blockquote display
  - Helps users understand agent's approach

- **Mid-Execution Status**: Agent provides progress updates between tool calls
  - States what's next or if task is complete
  - Styled yellow blockquote display
  - Keeps users informed during long-running tasks

- **Reasoning Checkpoints**: Internal tracking of agent's decision-making process
  - Stores reasoning at analysis and execution phases
  - Timestamped for debugging and analysis
  - Accessible via agent instance

#### Configuration
- **New Agent Option**: `enableIntermediateReasoning` (default: true)
  - Toggle reasoning display on/off
  - Configurable via agent constructor
  - Minimal API overhead when enabled

#### System Prompt Updates
- Added todo list usage guidelines
- Example todo_write call structure
- Emphasizes single in-progress task constraint
- User-visible progress notes guidance

### Changed - Agent Architecture

#### State Management
- Added `currentTodos` state tracking
- Added `reasoningCheckpoints` array for decision history
- New public methods: `updateTodos()`, `getTodos()`
- Shared agent instance pattern for tool access

#### Tool Organization
- New module: `src/core/tools/todos.ts`
- Exported `todoTools` from main tools index
- Updated tool type definitions in `types.ts`

#### UI Integration
- New component: `src/ui/components/TodoList.tsx`
- Status emission for in-progress todos
- Real-time UI updates via event system

### Technical Details

#### New Files
- `src/core/tools/todos.ts` - Todo management tool implementation
- `src/ui/components/TodoList.tsx` - Todo list UI component
- `dist/core/tools/todos.js` - Compiled JavaScript
- `dist/ui/components/TodoList.js` - Compiled JavaScript

#### Modified Files
- `src/core/agent.ts` - Added reasoning, todo state, new methods
- `src/core/tools/index.ts` - Exported todoTools
- `src/core/types.ts` - Added TodoItem, TodoState, ReasoningCheckpoint types
- `src/index.ts` - Updated with new configuration options
- `src/ui/app.tsx` - Integrated TodoList component
- All corresponding `dist/` compiled files

#### Type Definitions
```typescript
interface TodoItem {
  content: string;
  activeForm: string;
  status: "pending" | "in_progress" | "completed";
  id?: string;
  createdAt?: number;
}

interface TodoState {
  todos: TodoItem[];
  lastUpdated: number;
}

interface ReasoningCheckpoint {
  phase: "analysis" | "execution";
  reasoning: string;
  timestamp: number;
}
```

---

## [Previous Updates] - December 2024

### Added - Spring Boot Code Review Improvements ✨

#### Phase 1: Critical Fixes (Completed)
Based on comprehensive code review feedback, implemented critical improvements to Spring Boot testing:

1. **Gradle Support** 🎯
   - Added `build-tool-detector.ts` utility for Maven/Gradle detection
   - Supports both `build.gradle` (Groovy) and `build.gradle.kts` (Kotlin DSL)
   - Detects Spring Boot Gradle plugin: `id 'org.springframework.boot'`
   - Parses Gradle dependencies with pattern matching

2. **Abstract Path Resolution** 🛤️
   - Created `path-resolver.ts` for build-tool and language-aware path resolution
   - Replaces hard-coded `.replace("/src/main/", "/src/test/")` logic
   - Supports multiple conventions:
     - Maven Java: `src/main/java` → `src/test/java`
     - Maven Kotlin: `src/main/kotlin` → `src/test/kotlin`
     - Gradle Java: `src/main/java` → `src/test/java`
     - Gradle Kotlin: `src/main/kotlin` → `src/test/kotlin`
   - Handles file extensions: `.java` → `Test.java`, `.kt` → `Test.kt`

3. **Enhanced Spring Boot Detection** 🔍
   - Updated `springboot-detector.ts` to work with both Maven and Gradle
   - Accepts `BuildConfig` parameter for flexible project detection
   - Improved dependency parsing for both build tools

4. **Verification Script** ✅
   - Added `verify-phase1.ts` to validate improvements
   - Tests Maven and Gradle Spring Boot projects
   - Verifies path resolution for both build tools
   - Automated testing for critical functionality

#### Test Projects
- **Gradle Example**: `tests/java/springboot-gradle/`
  - Simple Spring Boot REST controller
  - Demonstrates Gradle build tool support
  - Validates path resolution for Gradle projects

#### Documentation
- **Code Review Summary**: `docs/SPRINGBOOT_TESTING_REVIEW.md`
  - Comprehensive review findings
  - Phase 1-3 recommendations
  - Implementation roadmap

### Fixed - Spring Boot Testing Issues

#### Build Tool Support
- ✅ Fixed: Maven-only assumption - now supports Gradle
- ✅ Fixed: Hard-coded path logic - now uses abstract resolver
- ✅ Fixed: Missing Gradle dependency parsing

#### Path Resolution
- ✅ Fixed: Brittle project layout assumptions
- ✅ Fixed: Invalid target paths for non-standard layouts
- ✅ Fixed: No support for Kotlin source directories

#### Detection Accuracy
- ✅ Fixed: Narrow detection coverage (Maven-only)
- ✅ Fixed: Missing Gradle Spring Boot projects

### Changed - Code Quality Improvements

#### Refactored Utilities
- Extracted build tool detection into dedicated module
- Extracted path resolution into dedicated module
- Improved separation of concerns
- Added in-memory caching for build configurations

#### Updated Dependencies
- Spring Boot Currency Converter example updated
- Application properties refined
- POM dependencies optimized

### Known Limitations (Future Work)

#### Phase 2: Feature Enhancements (Planned)
- Kotlin language support (templates, syntax)
- Reactive stack support (WebFlux, WebTestClient)
- NoSQL repository templates (MongoDB, Redis)
- Messaging integration tests (Kafka, RabbitMQ)

#### Phase 3: Quality Improvements (Planned)
- Multi-module Maven support
- Security test templates
- Smart test configuration detection
- Testcontainers recommendations

---

## [Recent Updates] - December 2024

### Added - Spring Boot Testing Support 🎉

#### Features
- **Automatic Spring Boot Detection**: Identifies Spring Boot projects via `pom.xml` and annotations
- **Component-Aware Test Generation**: Generates appropriate tests based on component type
  - `@RestController` → `@WebMvcTest` with MockMvc
  - `@Service` → Mockito unit tests
  - `@Repository` → `@DataJpaTest` with H2
- **Test Slicing**: Fast, focused tests using Spring Boot test annotations
- **Mode-Based Testing**: 
  - `smoke` → Unit tests (no Spring context)
  - `sanity` → Slice tests (partial context)
  - `full` → Integration tests (full context)
- **JaCoCo Integration**: Seamless coverage reporting

#### Example Projects
- **Currency Converter**: 30 tests (Controller: 9, Service: 9, Model: 6, Integration: 6)
- **User Management**: 18 tests (Controller: 6, Service: 6, Repository: 3, Integration: 3)

#### Documentation
- Added comprehensive guide: `docs/SPRINGBOOT_TESTING.md`
- Includes test types, best practices, troubleshooting

### Added - Phase 3 & 4 Testing Tools

#### Phase 3: Advanced Testing
1. **`generate_integration_test`** - Multi-component integration testing
   - Analyzes component dependencies
   - Creates tests with mocks/stubs
   - Supports Java, Python, JavaScript

2. **`generate_e2e_test`** - End-to-end user journey testing
   - Supports Playwright, Selenium, Cypress, Puppeteer
   - Generates page object patterns
   - Simulates real user interactions

3. **`generate_api_test`** - Comprehensive API testing
   - Endpoint testing (GET, POST, PUT, DELETE)
   - Schema validation
   - Contract testing
   - Authentication testing

#### Phase 4: PRD-Driven & Performance Testing
1. **`parse_prd`** - Extract testable requirements from PRDs
   - Supports markdown, text, PDF
   - Converts to structured test cases
   - Identifies acceptance criteria

2. **`generate_tests_from_prd`** - Convert PRD to executable tests
   - Generates unit, integration, system, UAT tests
   - Maps requirements to test methods
   - Includes setup/teardown logic

3. **`generate_performance_test`** - Load and performance testing
   - Supports k6, JMeter, Locust, Artillery
   - Load, stress, spike, endurance test types
   - Configurable load patterns

### Improved - Documentation Organization

#### Moved to `docs/` Directory
- `CLAUDE.md` → `docs/CLAUDE.md`
- `TESTING_IMPLEMENTATION.md` → `docs/TESTING_IMPLEMENTATION.md`
- `TESTING_PHASE2.md` → `docs/TESTING_PHASE2.md`
- `plan.md` → `docs/plan.md`
- Added `docs/SPRINGBOOT_TESTING.md`
- Added `docs/FEATURES.md`
- Added `docs/SETUP.md`
- Added `docs/QUICKSTART.md`
- Added `docs/OPENROUTER.md`

### Improved - Test Coverage

#### Test Statistics
- **Python**: 35/35 tests passing
- **Java**: 42/42 tests passing (Currency: 30, Sudoku: 12)
- **Spring Boot**: 48/48 tests passing (Currency: 30, User: 18)
- **Total**: 125+ tests passing

### Improved - Code Quality

#### Code Review Fixes
- Addressed issues from code review (#1)
- Follow-up fixes documented (#2)
- Removed obsolete files (CODE_REVIEW.md, CODE_REVIEW_STATUS.md)

#### Build Artifacts
- Updated `.gitignore` to exclude build artifacts
- Removed compiled `.class` files from tracking
- Removed `.coverage` file from tracking

### Changed - README.md

#### Major Updates
1. **Testing Framework Section**
   - Updated from "Phase 1 & 2" to "All Phases Complete"
   - Added quick reference table for all 16 tools
   - Added 8 comprehensive workflows

2. **Spring Boot Section**
   - New dedicated section with features and quick start
   - Links to comprehensive guide

3. **Test Results**
   - Updated test counts (77 → 125+)
   - Added Spring Boot test results
   - Added coverage report locations

4. **Future Plans**
   - Moved completed phases to "Completed Features" section
   - Renumbered remaining phases (5-11)
   - Clear distinction between done and planned

5. **Documentation Section**
   - Added links to all docs in `docs/` directory
   - Organized by topic

6. **Project Structure**
   - Added new tool files (advanced-testing.ts, prd-testing.ts, springboot-templates.ts)
   - Added Spring Boot test projects
   - Added docs directory structure

## Summary of Latest Changes (December 2024)

### Files Added (Latest)
- `src/utils/build-tool-detector.ts` - Maven/Gradle detection utility
- `src/utils/path-resolver.ts` - Build-tool and language-aware path resolution
- `verify-phase1.ts` - Verification script for Phase 1 improvements
- `tests/java/springboot-gradle/` - Gradle Spring Boot example project
- `docs/SPRINGBOOT_TESTING_REVIEW.md` - Comprehensive code review findings

### Files Modified (Latest)
- `src/utils/springboot-detector.ts` - Enhanced to support both Maven and Gradle
- `src/core/tools/generation.ts` - Uses new path resolver instead of hard-coded logic
- `src/core/types.ts` - Added BuildTool and BuildConfig types
- `tests/java/spring-currencyconverter/` - Updated dependencies and configuration
- `.gitignore` - Improved to exclude Gradle build artifacts

### Key Improvements (Latest)
- ✅ Gradle build tool support (Groovy and Kotlin DSL)
- ✅ Abstract path resolution (no more hard-coded paths)
- ✅ Enhanced Spring Boot detection (Maven + Gradle)
- ✅ Verification testing for critical functionality
- ✅ Better separation of concerns (dedicated utility modules)

---

## Summary of Changes

### Files Added (Recent)
- `tests/java/spring-currencyconverter/` - Complete Spring Boot currency converter with 30 tests
- `tests/java/springboot/` - Complete Spring Boot user management with 18 tests
- `src/core/tools/advanced-testing.ts` - Phase 3 testing tools
- `src/core/tools/prd-testing.ts` - Phase 4 testing tools
- `src/core/tools/springboot-templates.ts` - Spring Boot support
- `src/utils/springboot-detector.ts` - Spring Boot detection utility
- `docs/SPRINGBOOT_TESTING.md` - Comprehensive Spring Boot testing guide
- `CHANGELOG.md` - This file

### Files Modified (Recent)
- `README.md` - Major updates to reflect all new features
- `src/core/tools/index.ts` - Added new tool modules
- `src/core/types.ts` - Added new tool types
- `.gitignore` - Improved build artifact exclusions

### Files Removed (Recent)
- `CODE_REVIEW.md` - Moved to PR comments
- `CODE_REVIEW_STATUS.md` - No longer needed
- Various `.class` files - Build artifacts
- `.coverage` - Build artifact

## Tool Count Evolution

- **Phase 1**: 3 tools (run_tests, analyze_test_failures, get_coverage)
- **Phase 2**: +4 tools = 7 total (detect_changed_files, generate_tests, analyze_coverage_gaps, generate_regression_test)
- **Phase 3**: +3 tools = 10 total (generate_integration_test, generate_e2e_test, generate_api_test)
- **Phase 4**: +3 tools = 13 total (parse_prd, generate_tests_from_prd, generate_performance_test)
- **Current**: 13 testing tools + Spring Boot support

## Next Steps

See the "Future Plans" section in README.md for upcoming features in Phases 5-11.
