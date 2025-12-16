# Spring Boot Currency Converter - Running Guide

## Java Version Compatibility

This application is configured for **Java 17** but you're running **Java 25.0.1**. While the application works, you may see warnings about restricted method access.

## Understanding the Warnings

The warnings you see:
```
WARNING: A restricted method in java.lang.System has been called
WARNING: java.lang.System::load has been called by org.apache.tomcat.jni.Library
WARNING: Use --enable-native-access=ALL-UNNAMED to avoid a warning
```

These occur because:
- Java 21+ introduced stricter controls on native method access
- Tomcat's embedded server uses native libraries for performance
- The warnings are **informational only** - your app still works fine

## Running the Application

### Option 1: Using Maven (Recommended)
```bash
mvn spring-boot:run
```

The `pom.xml` has been updated to include `--enable-native-access=ALL-UNNAMED` which suppresses the warnings.

### Option 2: Using Java directly with JAR
```bash
# Build the JAR
mvn clean package

# Run with native access enabled
java --enable-native-access=ALL-UNNAMED -jar target/spring-currencyconverter-0.0.1-SNAPSHOT.jar
```

### Option 3: Run without suppressing warnings
```bash
# Just run normally - warnings are harmless
java -jar target/spring-currencyconverter-0.0.1-SNAPSHOT.jar
```

## Testing the Application

### Run all tests
```bash
mvn test
```

### Run with coverage
```bash
mvn clean test jacoco:report
```

View coverage report at: `target/site/jacoco/index.html`

## Accessing the Application

Once running, access:
- **API Endpoints**: http://localhost:8080/api/convert
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **API Docs**: http://localhost:8080/v3/api-docs

## Example API Request

```bash
curl "http://localhost:8080/api/convert?from=USD&to=EUR&amount=100"
```

## Long-term Solutions

1. **Downgrade to Java 17 LTS** (Recommended for production)
   ```bash
   # Using SDKMAN
   sdk install java 17.0.9-tem
   sdk use java 17.0.9-tem
   ```

2. **Upgrade Spring Boot** to a version with better Java 21+ support
   - Update `pom.xml` parent version to 3.3.0 or later

3. **Keep current setup** - The warnings are harmless and will be blocked (not warned) in future Java releases, at which point Spring Boot will have full support.

## Troubleshooting

### Port 8080 already in use
```bash
# Find and kill the process
lsof -ti:8080 | xargs kill -9

# Or run on a different port
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081
```

### Tests failing
```bash
# Clean and rebuild
mvn clean install

# Run specific test
mvn test -Dtest=ConversionServiceTest
```

## Project Structure

```
src/
├── main/
│   ├── java/com/codecli/currency/
│   │   ├── CurrencyConverterApplication.java  # Main application
│   │   ├── controller/
│   │   │   └── ConversionController.java      # REST endpoints
│   │   ├── service/
│   │   │   └── ConversionService.java         # Business logic
│   │   └── model/
│   │       └── ConversionResponse.java        # Response model
│   └── resources/
│       └── application.properties              # Configuration
└── test/
    └── java/com/codecli/currency/
        ├── CurrencyConverterApplicationTest.java
        ├── controller/
        │   └── ConversionControllerIntegrationTest.java
        ├── service/
        │   └── ConversionServiceTest.java
        └── model/
            └── ConversionResponseTest.java
```

## Coverage Goals

- **Instruction Coverage**: 90%+
- **Branch Coverage**: 85%+

Current coverage can be viewed after running: `mvn test jacoco:report`
