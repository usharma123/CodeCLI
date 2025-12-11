# Spring Currency Converter - Test Suite Documentation

## Overview

This document describes the comprehensive test suite for the Spring Boot Currency Converter application. The test suite includes 66 tests covering unit tests, integration tests, and application context tests.

## Project Structure

```
spring-currencyconverter/
├── src/
│   ├── main/
│   │   └── java/com/codecli/currency/
│   │       ├── CurrencyConverterApplication.java
│   │       ├── controller/
│   │       │   └── ConversionController.java
│   │       ├── model/
│   │       │   └── ConversionResponse.java
│   │       └── service/
│   │           └── ConversionService.java
│   └── test/
│       └── java/com/codecli/currency/
│           ├── CurrencyConverterApplicationTest.java
│           ├── controller/
│           │   ├── ConversionControllerTest.java
│           │   └── ConversionControllerIntegrationTest.java
│           ├── model/
│           │   └── ConversionResponseTest.java
│           └── service/
│               └── ConversionServiceTest.java
├── pom.xml
└── TEST_SUMMARY.md
```

## Test Files

### 1. ConversionServiceTest.java
**Location:** `src/test/java/com/codecli/currency/service/ConversionServiceTest.java`  
**Tests:** 29  
**Type:** Unit Tests

Tests the core business logic of currency conversion including:
- Currency conversions between all supported pairs
- Edge cases (zero, negative, null, large amounts)
- Case sensitivity handling
- Rate calculations
- Error handling for invalid inputs

### 2. ConversionControllerTest.java
**Location:** `src/test/java/com/codecli/currency/controller/ConversionControllerTest.java`  
**Tests:** 10  
**Type:** Unit Tests

Tests the controller layer with real service instances:
- Request parameter handling
- Response structure validation
- Currency code normalization
- Various amount scenarios

### 3. ConversionControllerIntegrationTest.java
**Location:** `src/test/java/com/codecli/currency/controller/ConversionControllerIntegrationTest.java`  
**Tests:** 17  
**Type:** Integration Tests

Tests the full HTTP request/response cycle using MockMvc:
- API endpoint testing
- JSON response validation
- HTTP status code verification
- Error response handling
- Missing parameter validation

### 4. CurrencyConverterApplicationTest.java
**Location:** `src/test/java/com/codecli/currency/CurrencyConverterApplicationTest.java`  
**Tests:** 3  
**Type:** Spring Boot Integration Tests

Tests the Spring Boot application context:
- Application context loading
- Bean creation and wiring
- Component scanning

### 5. ConversionResponseTest.java
**Location:** `src/test/java/com/codecli/currency/model/ConversionResponseTest.java`  
**Tests:** 7  
**Type:** Unit Tests

Tests the ConversionResponse record:
- Record creation
- Equality and hashCode
- toString representation
- Null and edge case handling

## Running the Tests

### Run All Tests
```bash
mvn clean test
```

### Run Specific Test Class
```bash
mvn test -Dtest=ConversionServiceTest
mvn test -Dtest=ConversionControllerIntegrationTest
```

### Run with Coverage
```bash
mvn clean test jacoco:report
```

### Run in Verbose Mode
```bash
mvn test -X
```

## Test Results Summary

```
[INFO] Tests run: 66, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

### Breakdown:
- **ConversionServiceTest:** 29 tests ✅
- **ConversionControllerTest:** 10 tests ✅
- **ConversionControllerIntegrationTest:** 17 tests ✅
- **CurrencyConverterApplicationTest:** 3 tests ✅
- **ConversionResponseTest:** 7 tests ✅

## Test Coverage Areas

### ✅ Functional Testing
- Currency conversion calculations
- Exchange rate calculations
- All currency pair combinations
- Precision and rounding

### ✅ Input Validation
- Null values
- Negative amounts
- Invalid currency codes
- Missing parameters
- Case sensitivity

### ✅ API Testing
- GET /api/convert endpoint
- Query parameter handling
- JSON response format
- HTTP status codes
- Error responses

### ✅ Integration Testing
- Spring Boot context loading
- Bean wiring
- MockMvc request/response
- Full application stack

### ✅ Edge Cases
- Zero amounts
- Very small amounts (0.01)
- Very large amounts (1,000,000+)
- Same currency conversion
- Whitespace in inputs

## Key Test Patterns

### 1. Arrange-Act-Assert (AAA)
All tests follow the AAA pattern for clarity:
```java
@Test
void testConvertUsdToEur() {
    // Arrange
    BigDecimal amount = new BigDecimal("100.00");
    
    // Act
    BigDecimal result = conversionService.convert("USD", "EUR", amount);
    
    // Assert
    assertEquals(new BigDecimal("92.00"), result);
}
```

### 2. Descriptive Test Names
Tests use `@DisplayName` annotations for clear documentation:
```java
@Test
@DisplayName("Should convert USD to EUR correctly")
void testConvertUsdToEur() { ... }
```

### 3. Exception Testing
Proper exception handling validation:
```java
@Test
@DisplayName("Should throw exception for negative amount")
void testConvertNegativeAmount() {
    ResponseStatusException exception = assertThrows(
        ResponseStatusException.class,
        () -> conversionService.convert("USD", "EUR", new BigDecimal("-100"))
    );
    assertTrue(exception.getReason().contains("amount must be non-negative"));
}
```

### 4. Integration Testing with MockMvc
Full HTTP testing:
```java
@Test
void testConvertUsdToEurApi() throws Exception {
    mockMvc.perform(get("/api/convert")
            .param("from", "USD")
            .param("to", "EUR")
            .param("amount", "100.00"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.convertedAmount").value(92.00));
}
```

## Dependencies

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

This includes:
- JUnit 5 (Jupiter)
- Spring Test & Spring Boot Test
- AssertJ
- Hamcrest
- Mockito
- JSONassert
- JsonPath

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- Fast execution (~3 seconds total)
- No external dependencies
- Deterministic results
- Clear failure messages

## Best Practices Demonstrated

1. ✅ **Comprehensive Coverage** - All methods and edge cases tested
2. ✅ **Clear Naming** - Descriptive test and method names
3. ✅ **Isolation** - Each test is independent
4. ✅ **Fast Execution** - Quick feedback loop
5. ✅ **Maintainable** - Well-structured and documented
6. ✅ **Realistic** - Tests real-world scenarios
7. ✅ **Error Handling** - Validates exception cases
8. ✅ **Integration** - Tests full application stack

## Future Enhancements

Potential areas for additional testing:
- Performance testing with JMeter
- Load testing for concurrent requests
- Security testing for input sanitization
- Contract testing with Pact
- Mutation testing with PIT

## Troubleshooting

### Common Issues

**Issue:** Tests fail with "Cannot mock ConversionService"  
**Solution:** Updated to Byte Buddy 1.15.11 for Java 25 compatibility

**Issue:** NullPointerException in Map.get()  
**Solution:** Added null checks before Map lookups in normalize() method

**Issue:** Spring context fails to load  
**Solution:** Ensure @SpringBootApplication is properly configured

## Conclusion

This test suite provides comprehensive coverage of the Spring Boot Currency Converter application, ensuring reliability, correctness, and maintainability. All 66 tests pass successfully, validating both the business logic and the API layer.
