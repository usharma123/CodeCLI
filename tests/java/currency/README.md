# Currency Converter Unit Tests

This directory contains comprehensive unit tests for the Currency Converter application.

## Files

- `CurrencyConverter.java` - Main converter class with conversion logic
- `CurrencyApp.java` - CLI application entry point
- `CurrencyConverterTest.java` - JUnit 5 test suite with 30 test cases

## Test Coverage

The test suite covers the following scenarios:

### Basic Conversions (8 tests)
- USD to EUR, EUR to USD
- USD to GBP, GBP to USD
- USD to JPY, JPY to USD
- Same currency conversions (USD to USD, EUR to EUR)

### Cross-Currency Conversions (4 tests)
- EUR to GBP, GBP to EUR
- EUR to JPY
- JPY to GBP

### Edge Cases (3 tests)
- Zero amount conversion
- Very small amounts (0.01)
- Very large amounts (1,000,000)

### Input Normalization (3 tests)
- Lowercase currency codes
- Mixed case currency codes
- Whitespace handling

### Error Handling (7 tests)
- Negative amounts
- Unsupported currencies (from and to)
- Null currency codes (from and to)
- Empty currency codes (from and to)

### API Testing (3 tests)
- supportedRates() returns all currencies
- supportedRates() returns correct values
- supportedRates() map is unmodifiable

### Precision Testing (2 tests)
- Decimal amounts
- High precision amounts

## Running the Tests

### Prerequisites

1. Java Development Kit (JDK) 11 or higher
2. JUnit Platform Console Standalone JAR (automatically downloaded)

### Setup and Run

```bash
# Navigate to the currency directory
cd tests/java/currency

# Download JUnit JAR (if not already present)
curl -L -o junit-platform-console-standalone.jar \
  https://repo1.maven.org/maven2/org/junit/platform/junit-platform-console-standalone/1.10.2/junit-platform-console-standalone-1.10.2.jar

# Compile the source and test files
javac -cp junit-platform-console-standalone.jar:. \
  CurrencyConverter.java CurrencyApp.java CurrencyConverterTest.java

# Run the tests
java -jar junit-platform-console-standalone.jar --class-path . --scan-class-path
```

Note: On Windows, use semicolon (;) instead of colon (:) for the classpath separator.

## Test Results

All 30 tests pass successfully:

```
Test run finished after 38 ms
[        30 tests found           ]
[         0 tests skipped         ]
[        30 tests started         ]
[         0 tests aborted         ]
[        30 tests successful      ]
[         0 tests failed          ]
```

## Currency Rates

The converter uses the following hardcoded rates (to USD):
- USD: 1.0 (base)
- EUR: 1.1 (1 EUR = 1.1 USD)
- GBP: 1.25 (1 GBP = 1.25 USD)
- JPY: 0.007 (1 JPY = 0.007 USD)

## Example Usage

```java
CurrencyConverter converter = new CurrencyConverter();

// Convert 100 USD to EUR
double result = converter.convert(100.0, "USD", "EUR");
// result ≈ 90.91

// Get supported currencies
Map<String, Double> rates = converter.supportedRates();
```
