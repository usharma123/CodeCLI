# Spring Boot Testing Review

This document captures a code-review-style assessment of the Spring Boot testing functionality in the CLI. It highlights coverage gaps and risky assumptions that could lead to incorrect detection or irrelevant test generation.

## Findings

### Detection coverage is too narrow
- The CLI only scans for `pom.xml` with specific Spring Boot starters. Gradle-based projects or Maven modules that use alternative starter sets will not be recognized as Spring Boot apps, so Spring-aware test generation will never be triggered.

### Project layout assumptions are brittle
- Test generation assumes a Maven-standard Java layout (maps `/src/main/` to `/src/test/` and expects `.java` sources). Projects written in Kotlin, using non-standard source roots, or organized as nested modules will resolve to invalid target paths and produce unusable tests.

### Repository detection misses common patterns
- Repository handling relies on renaming `Service` to `Repository` and checking for `extends JpaRepository`. Reactive repositories, custom naming schemes, or non-JPA data layers fall through to generic component templates, losing repository-specific guidance.

### Integration template is HTTP-centric
- The integration test template is hard-wired to `TestRestTemplate` and CRUD-style HTTP calls. Reactive stacks (e.g., `WebTestClient`) or applications that focus on messaging, batch jobs, or schedulers receive mismatched scaffolding and assertions.

### No Kotlin support
**Location**: `src/core/tools/generation.ts:138`
- Only handles `.java` file extensions and Java source roots
- Kotlin projects (`src/main/kotlin/`, `.kt` files) fail path resolution
- Templates lack Kotlin-specific test syntax (fun declarations, null safety, Kotlin assertion libraries)

### Missing reactive stack detection
**Location**: `src/utils/springboot-detector.ts` (missing functionality)
- No detection of `spring-boot-starter-webflux` or reactive dependencies
- Controller tests don't offer `@WebFluxTest` or `WebTestClient` alternatives
- Repository detection misses `ReactiveCrudRepository`, `ReactiveMongoRepository`, etc.

### No build tool abstraction
**Location**: `src/utils/springboot-detector.ts:19-46`
- Hard-coded to Maven conventions only
- Should detect build tool first, then query for source/test directory conventions
- Gradle projects with custom layouts (Groovy/Kotlin DSL) fail completely

### Limited annotation coverage
**Location**: `src/utils/springboot-detector.ts:96-132`
- Missing modern Spring annotations: `@ControllerAdvice`, `@RestControllerAdvice` (error handling), `@Async`, `@Scheduled` (async), `@KafkaListener`, `@RabbitListener` (messaging), `@Validated`, `@Valid` (validation)
- No reactive-specific annotations (`@EnableWebFlux`)
- Missing Spring Security annotations (`@WithMockUser`, `@PreAuthorize`)

### NoSQL repository limitations
**Location**: `src/core/tools/springboot-templates.ts:254-369`
- Repository template assumes JPA + H2 database only
- No support for NoSQL repositories: MongoDB (`@DataMongoTest`), Redis, Cassandra, Neo4j
- No JDBC template tests (`@JdbcTest`)
- Reactive repository tests missing `StepVerifier` and reactive assertions

### Test configuration assumptions
**Location**: `src/core/tools/springboot-templates.ts` (multiple locations)
- Hard-codes `@ActiveProfiles("test")` without checking if profile exists
- No validation of `application-test.yml/properties`
- Missing Testcontainers recommendations for real database testing
- No multi-environment profile guidance

### Security testing gaps
**Location**: `src/core/tools/springboot-templates.ts:502-508`
- Integration template has TODO for security testing with no implementation
- No `@WithMockUser` in controller test templates
- Missing OAuth2/JWT/Spring Security test examples
- No method security (`@PreAuthorize`) test guidance

### Multi-module Maven projects unsupported
**Location**: `src/utils/springboot-detector.ts`
- Only checks current directory for `pom.xml`
- Doesn't walk up tree to find parent POM or module structure
- Path resolution breaks for nested modules

## Recommendations

### Phase 1: Critical Fixes (High Priority)

#### 1.1 Add Gradle Support
**File**: `src/utils/springboot-detector.ts`
- Create `detectBuildTool()` to identify Maven vs Gradle
- Add `isGradleSpringBootProject()` to scan `build.gradle` and `build.gradle.kts`
- Check for Spring Boot Gradle plugin: `id 'org.springframework.boot'`
- Detect dependencies in Gradle format

#### 1.2 Abstract Path Resolution
**File**: `src/core/tools/generation.ts:136-138`
- Replace hard-coded `.replace("/src/main/", "/src/test/")` with `resolveTestPath(sourcePath, buildTool, language)`
- Support conventions:
  - Maven Java: `src/main/java` → `src/test/java`
  - Maven Kotlin: `src/main/kotlin` → `src/test/kotlin`
  - Gradle Java: `src/main/java` → `src/test/java`
  - Gradle Kotlin: `src/main/kotlin` → `src/test/kotlin`
  - Custom source roots from build file
- Handle file extensions: `.java` → `Test.java`, `.kt` → `Test.kt`

#### 1.3 Expand Repository Detection
**File**: `src/utils/springboot-detector.ts:69-76`
- Detect all Spring Data repository interfaces:
  - Blocking: `CrudRepository`, `PagingAndSortingRepository`, `JdbcRepository`
  - Reactive: `ReactiveCrudRepository`, `ReactiveSortingRepository`
  - NoSQL: `MongoRepository`, `ReactiveMongoRepository`, `RedisRepository`
- Detect custom base repository classes
- Use method naming heuristics: `findBy*`, `deleteBy*`, `countBy*`

#### 1.4 Add Kotlin Support
**Files**: `src/core/tools/generation.ts`, `src/core/tools/springboot-templates.ts`
- Detect language from file extension
- Create Kotlin-specific templates:
  - Use `@Test fun testName()` instead of `void testName()`
  - Add null safety operators (`!!`, `?.`)
  - Use Kotlin assertion libraries (AssertJ-Kotlin, Kotest suggestions)
- Update path logic for `src/main/kotlin/` and `src/test/kotlin/`

### Phase 2: Feature Enhancements (Medium Priority)

#### 2.1 Add Reactive Stack Support
**File**: `src/core/tools/springboot-templates.ts`
- Create `generateReactiveControllerTest()`:
  - Use `@WebFluxTest` instead of `@WebMvcTest`
  - Use `WebTestClient` instead of `MockMvc`
  - Add reactive assertions with `StepVerifier`
- Create `generateReactiveRepositoryTest()`:
  - Use `@DataMongoTest` or similar for reactive stores
  - Include `StepVerifier` examples for reactive streams
- Detect reactive by checking for `spring-boot-starter-webflux` in dependencies

#### 2.2 Add Integration Test Variants
**File**: `src/core/tools/springboot-templates.ts`
- Create variant templates:
  - `generateHttpIntegrationTest()` (existing TestRestTemplate logic)
  - `generateReactiveIntegrationTest()` (WebFlux with WebTestClient)
  - `generateMessagingIntegrationTest()` (Kafka/RabbitMQ with `@EmbeddedKafka`)
  - `generateBatchIntegrationTest()` (Spring Batch with `JobLauncherTestUtils`)
- Detect application type from dependencies and select appropriate template

#### 2.3 Expand Annotation Detection
**File**: `src/utils/springboot-detector.ts:96-132`
- Add error handling: `@ControllerAdvice`, `@RestControllerAdvice`, `@ExceptionHandler`
- Add async: `@Async`, `@Scheduled`, `@EnableAsync`, `@EnableScheduling`
- Add messaging: `@KafkaListener`, `@RabbitListener`, `@JmsListener`, `@SqsListener`
- Add validation: `@Validated`, `@Valid`, `@Constraint`
- Add security: `@EnableWebSecurity`, `@PreAuthorize`, `@Secured`, `@RolesAllowed`
- Add reactive: `@EnableWebFlux`, reactive annotations

#### 2.4 Add NoSQL Repository Templates
**File**: `src/core/tools/springboot-templates.ts`
- `generateMongoRepositoryTest()`: Use `@DataMongoTest`, embedded MongoDB
- `generateRedisRepositoryTest()`: Use `@DataRedisTest`, embedded Redis
- `generateJdbcRepositoryTest()`: Use `@JdbcTest` for JDBC templates
- Detect repository type from interface: `extends MongoRepository`, `extends RedisRepository`

### Phase 3: Quality Improvements (Low Priority)

#### 3.1 Smart Test Configuration Detection
**New file**: `src/utils/springboot-config-detector.ts`
- Scan for existing test profiles (`application-test.yml`, `application-test.properties`)
- Validate configuration files exist before referencing them
- Generate missing test configuration with sensible defaults
- Recommend Testcontainers for database integration tests (add comments in generated tests)

#### 3.2 Add Security Test Support
**File**: `src/core/tools/springboot-templates.ts`
- Add `@WithMockUser` to controller tests when security dependencies detected
- Create security test section in templates:
```java
// Security test example with @WithMockUser
@Test
@WithMockUser(roles = "USER")
void testSecuredEndpoint() { ... }
```
- Add OAuth2/JWT test utilities when relevant dependencies detected

#### 3.3 Improve Test Tags/Categories
**File**: `src/core/tools/generation.ts:157-160`
- Make test tags configurable via settings
- Document tag meanings clearly in generated comments
- Consider using JUnit 5 `@Tag` with Spring profiles for better integration
- Align with Spring Boot's slice test annotations as primary classification

#### 3.4 Multi-Module Maven Support
**File**: `src/utils/springboot-detector.ts`
- Walk up directory tree to find parent `pom.xml`
- Parse `<modules>` section to understand project structure
- Resolve paths relative to module root, not repository root
- Handle aggregator POMs vs parent POMs correctly

## Implementation Summary

### Files Requiring Changes

**Critical (Phase 1)**:
1. `src/utils/springboot-detector.ts` - Add Gradle detection, expand repository detection
2. `src/core/tools/generation.ts` - Replace hard-coded path logic with abstract resolver
3. `src/core/tools/springboot-templates.ts` - Add Kotlin templates
4. **New file**: `src/utils/build-tool-detector.ts` - Abstract build tool detection
5. **New file**: `src/utils/path-resolver.ts` - Build-tool and language-aware path resolution

**Medium Priority (Phase 2)**:
1. `src/core/tools/springboot-templates.ts` - Add reactive, NoSQL, and integration variants
2. `src/utils/springboot-detector.ts` - Expand annotation coverage

**Low Priority (Phase 3)**:
1. **New file**: `src/utils/springboot-config-detector.ts` - Test configuration validation
2. `src/core/tools/springboot-templates.ts` - Security test support
3. `src/core/tools/generation.ts` - Improve test tag system

### Impact Assessment

**Breaking Changes**: None (all fixes are additive or improve existing behavior)

**Backward Compatibility**:
- Existing Java + Maven projects continue to work unchanged
- New functionality enables previously unsupported project types

**Testing Required**:
- Java Maven projects (existing tests should pass)
- Java Gradle projects (new coverage)
- Kotlin Maven projects (new coverage)
- Kotlin Gradle projects (new coverage)
- Reactive projects (WebFlux)
- NoSQL repository projects (MongoDB, Redis)
- Multi-module Maven projects
- Projects with custom source roots

### Effort Estimation

- **Phase 1 (Critical)**: 3-5 days
  - Build tool detection: 1 day
  - Path resolution abstraction: 1 day
  - Repository expansion: 1 day
  - Kotlin support: 1-2 days

- **Phase 2 (Medium)**: 4-6 days
  - Reactive support: 2 days
  - Integration variants: 1-2 days
  - Annotation expansion: 0.5 day
  - NoSQL templates: 1-2 days

- **Phase 3 (Low)**: 2-3 days
  - Config detection: 1 day
  - Security tests: 0.5 day
  - Tag improvements: 0.5 day
  - Multi-module: 1 day

**Total**: 9-14 days for complete implementation
