# Quick Start Guide - Spring Currency Converter Tests

## Run All Tests

```bash
cd tests/java/spring-currencyconverter
mvn clean test
```

## Expected Output

```
Tests run: 66, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

## Test Files Overview

| File | Tests | Purpose |
|------|-------|---------|
| `ConversionServiceTest.java` | 29 | Core business logic |
| `ConversionControllerIntegrationTest.java` | 17 | REST API endpoints |
| `ConversionControllerTest.java` | 10 | Controller layer |
| `ConversionResponseTest.java` | 7 | Response model |
| `CurrencyConverterApplicationTest.java` | 3 | Spring context |

## What's Tested

✅ **7 Currencies:** USD, EUR, GBP, JPY, INR, CAD, AUD  
✅ **API Endpoint:** GET /api/convert  
✅ **Validations:** Null, negative, invalid currencies  
✅ **Edge Cases:** Zero, decimals, large amounts  
✅ **Integration:** Full Spring Boot stack  

## Example API Call

```bash
curl "http://localhost:8080/api/convert?from=USD&to=EUR&amount=100"
```

Response:
```json
{
  "from": "USD",
  "to": "EUR",
  "amount": 100.00,
  "convertedAmount": 92.00,
  "rate": 0.920000
}
```

## Run Specific Tests

```bash
# Service tests only
mvn test -Dtest=ConversionServiceTest

# Integration tests only
mvn test -Dtest=ConversionControllerIntegrationTest

# All controller tests
mvn test -Dtest=*Controller*
```

## Documentation

- `TEST_SUMMARY.md` - Detailed test results
- `README_TESTS.md` - Complete test documentation
- `QUICK_START.md` - This file

## Success Criteria

✅ All 66 tests pass  
✅ No compilation errors  
✅ Build completes in ~3 seconds  
✅ 100% success rate  
