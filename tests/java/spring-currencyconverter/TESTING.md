# Spring Currency Converter - Testing Guide

## Quick Start

### Run All Tests
```bash
mvn clean test
```

### Run with Coverage Report
```bash
mvn clean test
open target/site/jacoco/index.html  # macOS
xdg-open target/site/jacoco/index.html  # Linux
start target/site/jacoco/index.html  # Windows
```

## Test Results Summary

```
✅ Total Tests: 70
✅ All Passed: 70/70 (100%)
✅ Code Coverage: 100%
✅ Build Time: ~3 seconds
```

## Test Suites

### 1. ConversionServiceTest (32 tests)
Unit tests for currency conversion business logic.

```bash
mvn test -Dtest=ConversionServiceTest
```

**Tests:**
- Currency conversions (USD, EUR, GBP, JPY, INR, CAD, AUD)
- Exchange rate calculations
- Input normalization (case-insensitive, whitespace handling)
- Error handling (negative amounts, null values, unsupported currencies)
- Edge cases (zero, decimals, large numbers, rounding)

### 2. ConversionResponseTest (9 tests)
Tests for the response model (Java Record).

```bash
mvn test -Dtest=ConversionResponseTest
```

**Tests:**
- Model creation and field access
- Equality and hashCode
- Null handling
- toString representation
- Immutability

### 3. ConversionControllerIntegrationTest (22 tests)
Integration tests for REST API endpoints.

```bash
mvn test -Dtest=ConversionControllerIntegrationTest
```

**Tests:**
- HTTP GET requests to `/api/convert`
- Query parameter validation
- HTTP status codes (200 OK, 400 Bad Request)
- JSON response format
- Error messages
- All supported currency pairs

### 4. CurrencyConverterApplicationTest (7 tests)
Spring Boot application context tests.

```bash
mvn test -Dtest=CurrencyConverterApplicationTest
```

**Tests:**
- Application context loading
- Bean configuration
- Dependency injection
- Component scanning

## Coverage Report

After running tests, view the detailed coverage report:

```bash
# Generate report
mvn clean test

# View HTML report
open target/site/jacoco/index.html
```

### Coverage Breakdown
- **ConversionService**: 100% (143/143 instructions, 22/22 branches)
- **ConversionController**: 100% (30/30 instructions)
- **ConversionResponse**: 100% (18/18 instructions)

## Test Structure

```
src/test/java/com/codecli/currency/
├── CurrencyConverterApplicationTest.java    # Application context tests
├── controller/
│   └── ConversionControllerIntegrationTest.java  # REST API tests
├── model/
│   └── ConversionResponseTest.java          # Model tests
└── service/
    └── ConversionServiceTest.java           # Business logic tests
```

## Example Test Execution

```bash
$ mvn clean test

[INFO] Tests run: 22, Failures: 0, Errors: 0, Skipped: 0 -- ConversionControllerIntegrationTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0 -- CurrencyConverterApplicationTest
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0 -- ConversionResponseTest
[INFO] Tests run: 32, Failures: 0, Errors: 0, Skipped: 0 -- ConversionServiceTest

[INFO] Results:
[INFO] Tests run: 70, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

## API Testing Examples

### Test Endpoint Manually
```bash
# Start the application
mvn spring-boot:run

# Test conversion (in another terminal)
curl "http://localhost:8080/api/convert?from=USD&to=EUR&amount=100"

# Expected response:
# {
#   "from": "USD",
#   "to": "EUR",
#   "amount": 100.00,
#   "convertedAmount": 92.00,
#   "rate": 0.920000
# }
```

### Supported Currencies
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- JPY (Japanese Yen)
- INR (Indian Rupee)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)

## Continuous Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: mvn clean test

- name: Check Coverage
  run: mvn jacoco:check
```

### Coverage Thresholds
The project enforces minimum coverage thresholds:
- **Instruction Coverage**: 90% (Currently: 100%)
- **Branch Coverage**: 85% (Currently: 100%)

Build will fail if coverage drops below these thresholds.

## Troubleshooting

### Tests Fail to Run
```bash
# Clean and rebuild
mvn clean install

# Skip tests temporarily
mvn clean install -DskipTests
```

### Port Already in Use (Integration Tests)
Integration tests use random ports, but if you encounter issues:
```bash
# Kill processes on port 8080
lsof -ti:8080 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :8080   # Windows
```

### JaCoCo Coverage Issues
```bash
# Regenerate coverage report
mvn clean test jacoco:report
```

## Test Best Practices

### Writing New Tests
1. Use `@DisplayName` for readable test names
2. Follow AAA pattern (Arrange, Act, Assert)
3. Test one thing per test method
4. Use meaningful assertions
5. Keep tests independent

### Example Test
```java
@Test
@DisplayName("Should convert USD to EUR correctly")
void testConvertUsdToEur() {
    // Arrange
    BigDecimal amount = new BigDecimal("100.00");
    
    // Act
    BigDecimal result = conversionService.convert("USD", "EUR", amount);
    
    // Assert
    assertEquals(new BigDecimal("92.00"), result);
}
```

## Additional Resources

- [JUnit 5 Documentation](https://junit.org/junit5/docs/current/user-guide/)
- [Spring Boot Testing](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing)
- [JaCoCo Documentation](https://www.jacoco.org/jacoco/trunk/doc/)
- [Maven Surefire Plugin](https://maven.apache.org/surefire/maven-surefire-plugin/)

---

**Last Updated**: December 16, 2025  
**Test Framework**: JUnit 5.10.2  
**Spring Boot**: 3.2.5  
**Java**: 17+
