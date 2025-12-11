# Spring Boot Testing Guide

Complete guide to Spring Boot testing support in CodeCLI.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Test Types](#test-types)
4. [Test Generation](#test-generation)
5. [Running Tests](#running-tests)
6. [Coverage](#coverage)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

CodeCLI provides comprehensive Spring Boot testing support with automatic detection and component-aware test generation. The system automatically detects Spring Boot projects and generates appropriate tests based on component annotations.

### Key Features

- **Auto-Detection**: Automatically identifies Spring Boot projects
- **Component-Aware**: Generates appropriate tests for @Controller, @Service, @Repository
- **Test Slicing**: Uses Spring Boot test annotations for fast, focused tests
- **Mode-Based Testing**: Smoke/sanity/full modes map to different test types
- **Coverage Integration**: JaCoCo coverage works out of the box

### Architecture

Spring Boot testing builds on the existing Java testing infrastructure:
- Uses Maven + JUnit 5 + Mockito
- Leverages Spring Boot Test framework (@SpringBootTest, @WebMvcTest, @DataJpaTest)
- JaCoCo for code coverage
- H2 in-memory database for repository tests

## Getting Started

### Prerequisites

1. **Spring Boot project** with `pom.xml`
2. **Java 17+** installed
3. **Maven** installed
4. **Spring Boot dependencies** in pom.xml:

```xml
<dependencies>
    <!-- Spring Boot Starter Test -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>

    <!-- H2 Database for testing -->
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>runtime</scope>
    </dependency>
</dependencies>
```

### Quick Start

```bash
# Generate tests for a Spring Boot controller
generate_tests --file_path src/main/java/com/example/UserController.java --language java

# Run smoke tests (fast unit tests)
run_tests --language java --mode smoke

# Run all tests with coverage
run_tests --language java --mode full --coverage true
```

## Test Types

### 1. Service Tests (Unit Tests)

**When**: Testing `@Service` classes
**Speed**: Fastest (< 1 second)
**Mode**: `smoke`
**Annotation**: `@ExtendWith(MockitoExtension.class)`

**Example**:
```java
@ExtendWith(MockitoExtension.class)
@Tag("smoke")
class UserServiceTest {
    @Mock
    private UserRepository repository;

    @InjectMocks
    private UserService service;

    @Test
    void testFindAll() {
        when(repository.findAll()).thenReturn(mockData);
        List<User> result = service.findAll();
        assertEquals(2, result.size());
    }
}
```

**Characteristics**:
- No Spring context loaded
- Uses Mockito for dependencies
- Tests business logic in isolation
- Very fast execution

### 2. Controller Tests (Web Slice Tests)

**When**: Testing `@RestController` or `@Controller` classes
**Speed**: Fast (1-2 seconds)
**Mode**: `sanity`
**Annotation**: `@WebMvcTest(ControllerClass.class)`

**Example**:
```java
@WebMvcTest(UserController.class)
@Tag("sanity")
class UserControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService service;

    @Test
    void testGetAll() throws Exception {
        mockMvc.perform(get("/api/users"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$", hasSize(2)));
    }
}
```

**Characteristics**:
- Loads only MVC layer
- MockMvc for HTTP simulation
- @MockBean for service dependencies
- Tests REST endpoints without full server

### 3. Repository Tests (Data JPA Slice Tests)

**When**: Testing `@Repository` interfaces or `JpaRepository` extensions
**Speed**: Fast (1-2 seconds)
**Mode**: `sanity`
**Annotation**: `@DataJpaTest`

**Example**:
```java
@DataJpaTest
@Tag("sanity")
class UserRepositoryTest {
    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository repository;

    @Test
    void testFindByEmail() {
        User user = new User(null, "John", "john@example.com");
        entityManager.persistAndFlush(user);

        Optional<User> found = repository.findByEmail("john@example.com");
        assertTrue(found.isPresent());
    }
}
```

**Characteristics**:
- Auto-configures H2 in-memory database
- TestEntityManager for test data setup
- Tests custom queries and JPA operations
- Automatic transaction rollback

### 4. Integration Tests (Full Context)

**When**: Testing complete workflows across all layers
**Speed**: Slow (3-5 seconds startup)
**Mode**: `full`
**Annotation**: `@SpringBootTest(webEnvironment = RANDOM_PORT)`

**Example**:
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Tag("integration")
class UserIntegrationTest {
    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void testCrudWorkflow() {
        // Complete create/read/update/delete cycle
        ResponseEntity<User> response = restTemplate.postForEntity(
            "http://localhost:" + port + "/api/users",
            newUser,
            User.class
        );
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
    }
}
```

**Characteristics**:
- Loads full application context
- Starts embedded server
- TestRestTemplate for real HTTP requests
- Tests all layers working together

## Test Generation

### Automatic Component Detection

CodeCLI automatically detects Spring Boot components by annotations:

```bash
# Detects @RestController → Generates @WebMvcTest
generate_tests --file_path UserController.java --language java

# Detects @Service → Generates Mockito unit test
generate_tests --file_path UserService.java --language java

# Detects @Repository → Generates @DataJpaTest
generate_tests --file_path UserRepository.java --language java
```

### Generated Test Features

All generated tests include:
- ✅ Proper Spring Boot annotations
- ✅ Correct imports and setup
- ✅ TODO sections for implementation
- ✅ Tag annotations for mode-based execution
- ✅ Helpful comments explaining patterns
- ✅ Example test methods

### Example Output

```
--- Spring Boot Test Generation ---

Spring Boot project detected!
Component type: controller

Test file will be created at: src/test/java/com/example/UserControllerTest.java

Test Strategy: Uses @WebMvcTest for fast slice testing with MockMvc.
Mocks service dependencies. Perfect for testing HTTP endpoints in isolation.

Test Mode Mapping:
- smoke: Unit/service tests (fastest, no Spring context)
- sanity: Web/repository slice tests (medium, partial context)
- full: Integration tests (comprehensive, full context)

--- Generated Spring Boot Test ---

[Complete test class code here]
```

## Running Tests

### Mode-Based Execution

```bash
# Smoke tests: Fast unit tests only
run_tests --language java --mode smoke
# Runs: @Tag("smoke") tests
# Speed: < 5 seconds
# Coverage: Services, utilities, business logic

# Sanity tests: Slice tests (controllers + repositories)
run_tests --language java --mode sanity
# Runs: @Tag("smoke") + @Tag("sanity") tests
# Speed: < 30 seconds
# Coverage: Web layer, data layer, services

# Full tests: Everything including integration
run_tests --language java --mode full
# Runs: All tests
# Speed: < 2 minutes
# Coverage: Complete application including integration
```

### With Coverage

```bash
# Run tests with code coverage
run_tests --language java --mode full --coverage true

# View coverage report
open tests/java/target/site/jacoco/index.html
```

### Maven Commands

The test modes map to Maven commands:

```bash
# Smoke mode
mvn clean test -Dgroups=smoke

# Sanity mode
mvn clean test -Dgroups='smoke | sanity'

# Full mode
mvn clean test

# With coverage
mvn clean test jacoco:report
```

## Coverage

### JaCoCo Integration

Spring Boot tests work seamlessly with JaCoCo:

```xml
<!-- pom.xml -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
</plugin>
```

### Coverage Reports

```bash
# Get coverage report
get_coverage --language java

# Sample output:
Coverage Report (JAVA - Spring Boot Detected)
==================================================

Overall Coverage: 85.5% (1234/1443 lines)

By Component Type:
- Controllers:  78.2% (234/299 lines)
- Services:     92.1% (456/495 lines)
- Repositories: 100%  (89/89 lines)
- Utilities:    81.3% (455/560 lines)

HTML Report: tests/java/target/site/jacoco/index.html
```

### Coverage Best Practices

1. **Aim for 80%+ overall coverage**
2. **Service layer**: 90%+ (critical business logic)
3. **Controller layer**: 70-80% (focus on happy path + error cases)
4. **Repository layer**: 80%+ (test custom queries)
5. **Integration tests**: Cover critical workflows

## Best Practices

### 1. Use Appropriate Test Types

```java
// ❌ BAD: Using @SpringBootTest for service test (slow)
@SpringBootTest
class UserServiceTest { }

// ✅ GOOD: Using Mockito for service test (fast)
@ExtendWith(MockitoExtension.class)
class UserServiceTest { }
```

### 2. Tag Tests Correctly

```java
// Service tests → smoke
@Tag("smoke")
class UserServiceTest { }

// Controller/Repository tests → sanity
@Tag("sanity")
class UserControllerTest { }

// Integration tests → integration
@Tag("integration")
class UserIntegrationTest { }
```

### 3. Use Test Slicing

```java
// ✅ GOOD: Test only web layer
@WebMvcTest(UserController.class)
class UserControllerTest { }

// ❌ BAD: Loading full context for controller test
@SpringBootTest
class UserControllerTest { }
```

### 4. Leverage Test Configurations

```yaml
# src/test/resources/application-test.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
  jpa:
    hibernate:
      ddl-auto: create-drop
server:
  port: 0  # Random port for integration tests
```

### 5. Use Descriptive Test Names

```java
// ✅ GOOD
@Test
@DisplayName("GET /api/users should return list of users")
void testGetAllUsers() { }

// ❌ BAD
@Test
void test1() { }
```

### 6. Follow AAA Pattern

```java
@Test
void testCreate() {
    // Arrange: Set up test data
    User newUser = new User(null, "John", "john@example.com");
    when(repository.save(newUser)).thenReturn(savedUser);

    // Act: Execute the method
    User result = service.create(newUser);

    // Assert: Verify the outcome
    assertNotNull(result.getId());
    verify(repository).save(newUser);
}
```

## Troubleshooting

### Problem: Tests run slowly

**Solution**: Check test annotations

```java
// Make sure service tests use Mockito, not @SpringBootTest
@ExtendWith(MockitoExtension.class)  // ✅ Fast
@Tag("smoke")
class UserServiceTest { }

// Not this:
@SpringBootTest  // ❌ Slow
class UserServiceTest { }
```

### Problem: H2 database errors in repository tests

**Solution**: Add H2 dependency

```xml
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>runtime</scope>
</dependency>
```

### Problem: "No qualifying bean" errors

**Solution**: Use @MockBean for dependencies in slice tests

```java
@WebMvcTest(UserController.class)
class UserControllerTest {
    @MockBean  // ✅ Mock the service
    private UserService service;
}
```

### Problem: Integration tests fail with port conflicts

**Solution**: Use random port

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class UserIntegrationTest {
    @LocalServerPort  // Gets the random port
    private int port;
}
```

### Problem: Coverage not generated

**Solution**: Ensure JaCoCo plugin is configured and run with jacoco:report

```bash
mvn clean test jacoco:report
```

## Example Project

A complete Spring Boot example project is available at:
`tests/java/springboot/`

It includes:
- User CRUD REST API
- All component types (Controller, Service, Repository)
- Complete test suite (unit, slice, integration)
- Proper configuration files
- Maven setup with JaCoCo

## Reference

### Spring Boot Test Annotations

| Annotation | Purpose | Context Loaded | Speed |
|------------|---------|----------------|-------|
| `@ExtendWith(MockitoExtension.class)` | Unit tests | None | Fastest |
| `@WebMvcTest` | Controller tests | Web layer only | Fast |
| `@DataJpaTest` | Repository tests | JPA layer only | Fast |
| `@SpringBootTest` | Integration tests | Full context | Slow |

### Test Dependencies

```xml
<!-- Included in spring-boot-starter-test -->
- JUnit 5 (Jupiter)
- Mockito
- AssertJ
- Hamcrest
- Spring Test
- JSONPath
```

### Useful Resources

- [Spring Boot Testing Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing)
- [Testing the Web Layer](https://spring.io/guides/gs/testing-web/)
- [Testing with Mockito](https://site.mockito.org/)
- [JaCoCo Documentation](https://www.jacoco.org/jacoco/trunk/doc/)

## Summary

Spring Boot testing in CodeCLI provides:
- ✅ Automatic detection and component-aware generation
- ✅ Fast, focused tests with test slicing
- ✅ Mode-based execution (smoke/sanity/full)
- ✅ Seamless coverage integration
- ✅ Best practices built-in

Start testing your Spring Boot applications efficiently with CodeCLI!
