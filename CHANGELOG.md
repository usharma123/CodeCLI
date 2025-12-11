# Changelog

All notable changes to CodeCLI are documented in this file.

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
