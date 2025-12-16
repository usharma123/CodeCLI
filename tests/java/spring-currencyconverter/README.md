# Spring Boot Currency Converter

A simple REST API for currency conversion built with Spring Boot 3.2.5.

## 🚀 Quick Start

### Prerequisites
- Java 17+ (Java 17 LTS recommended)
- Maven 3.6+

### Run the Application

```bash
# Option 1: Using Maven
mvn spring-boot:run

# Option 2: Using the run script
./run.sh

# Option 3: Build and run JAR
mvn clean package
java -jar target/spring-currencyconverter-0.0.1-SNAPSHOT.jar
```

### Access the Application

- **API Base URL**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **API Docs**: http://localhost:8080/v3/api-docs

## 📋 API Endpoints

### Convert Currency

**GET** `/api/convert`

**Parameters:**
- `from` (required): Source currency code (e.g., USD)
- `to` (required): Target currency code (e.g., EUR)
- `amount` (required): Amount to convert

**Example:**
```bash
curl "http://localhost:8080/api/convert?from=USD&to=EUR&amount=100"
```

**Response:**
```json
{
  "from": "USD",
  "to": "EUR",
  "amount": 100.00,
  "convertedAmount": 85.00,
  "rate": 0.85,
  "timestamp": "2025-12-16T13:27:40.123Z"
}
```

### Supported Currencies

**GET** `/api/currencies`

**Example:**
```bash
curl "http://localhost:8080/api/currencies"
```

**Response:**
```json
["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR"]
```

## 🧪 Testing

### Run All Tests
```bash
mvn test
```

### Run with Coverage
```bash
mvn clean test jacoco:report
```

View coverage report: `target/site/jacoco/index.html`

### Test Coverage Goals
- **Instruction Coverage**: 90%+
- **Branch Coverage**: 85%+

### Current Test Results
- ✅ 16 tests passing
- ✅ 0 failures
- ✅ Coverage goals met

## 📁 Project Structure

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

## 🔧 Configuration

### Application Properties

Located in `src/main/resources/application.properties`:

```properties
spring.application.name=spring-currencyconverter
server.port=8080
```

### Change Server Port

```bash
# Via command line
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081

# Via environment variable
SERVER_PORT=8081 mvn spring-boot:run
```

## ⚠️ Java Version Compatibility

This application is configured for **Java 17** but will run on newer versions.

If you're using **Java 21+**, you may see warnings about native access. These are harmless but can be suppressed:

```bash
# The pom.xml is already configured to suppress these warnings
mvn spring-boot:run
```

For detailed information, see:
- [JAVA_VERSION_GUIDE.md](JAVA_VERSION_GUIDE.md) - Comprehensive Java version compatibility guide
- [RUNNING_GUIDE.md](RUNNING_GUIDE.md) - Detailed running instructions

## 🛠️ Development

### Build the Project
```bash
mvn clean install
```

### Run in Debug Mode
```bash
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"
```

Then attach your debugger to port 5005.

### Hot Reload (DevTools)

Add Spring Boot DevTools to `pom.xml` for automatic restart on code changes:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
    <optional>true</optional>
</dependency>
```

## 📊 Code Quality

### Run Tests with Coverage
```bash
mvn clean test jacoco:report
```

### Coverage Reports
- **HTML Report**: `target/site/jacoco/index.html`
- **XML Report**: `target/site/jacoco/jacoco.xml`
- **CSV Report**: `target/site/jacoco/jacoco.csv`

### Coverage Exclusions
The following are excluded from coverage requirements:
- `CurrencyConverterApplication.class` (Spring Boot main class)

## 🐳 Docker Support

### Build Docker Image
```dockerfile
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY target/spring-currencyconverter-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```bash
# Build the JAR
mvn clean package

# Build Docker image
docker build -t spring-currencyconverter .

# Run container
docker run -p 8080:8080 spring-currencyconverter
```

## 📚 Additional Documentation

- [TEST_SUMMARY.md](TEST_SUMMARY.md) - Test execution summary
- [TEST_REPORT.md](TEST_REPORT.md) - Detailed test report
- [COVERAGE_ANALYSIS.md](COVERAGE_ANALYSIS.md) - Coverage analysis
- [COVERAGE_IMPROVEMENT_GUIDE.md](COVERAGE_IMPROVEMENT_GUIDE.md) - Coverage improvement guide
- [JAVA_VERSION_GUIDE.md](JAVA_VERSION_GUIDE.md) - Java version compatibility
- [RUNNING_GUIDE.md](RUNNING_GUIDE.md) - Running instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `mvn test`
6. Ensure coverage goals are met: `mvn jacoco:report`
7. Submit a pull request

## 📝 License

This project is for educational purposes.

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Find process using port 8080
lsof -ti:8080

# Kill the process
lsof -ti:8080 | xargs kill -9
```

### Tests Failing
```bash
# Clean and rebuild
mvn clean install

# Run specific test
mvn test -Dtest=ConversionServiceTest
```

### Java Version Issues
See [JAVA_VERSION_GUIDE.md](JAVA_VERSION_GUIDE.md) for detailed troubleshooting.

## 📞 Support

For issues or questions:
1. Check the documentation in this directory
2. Review the test reports
3. Check Spring Boot documentation: https://spring.io/projects/spring-boot

## 🎯 Features

- ✅ RESTful API for currency conversion
- ✅ Support for 9 major currencies
- ✅ Swagger/OpenAPI documentation
- ✅ Comprehensive test coverage (90%+)
- ✅ Integration tests
- ✅ Unit tests
- ✅ Code coverage reporting
- ✅ Maven build automation
- ✅ Java 17+ compatibility

## 🔮 Future Enhancements

- [ ] Real-time exchange rates from external API
- [ ] Historical exchange rate data
- [ ] Currency conversion history
- [ ] User authentication
- [ ] Rate caching
- [ ] Database persistence
- [ ] Docker Compose setup
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline
- [ ] Performance monitoring
