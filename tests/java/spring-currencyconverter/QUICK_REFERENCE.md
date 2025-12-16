# Quick Reference Card

## 🚀 Common Commands

```bash
# Run the application
mvn spring-boot:run

# Run tests
mvn test

# Build JAR
mvn clean package

# Run with coverage
mvn clean test jacoco:report

# Run JAR directly
java -jar target/spring-currencyconverter-0.0.1-SNAPSHOT.jar

# Run on different port
mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081
```

## 🌐 URLs

| Service | URL |
|---------|-----|
| API Base | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| API Docs | http://localhost:8080/v3/api-docs |
| Convert Endpoint | http://localhost:8080/api/convert |
| Currencies Endpoint | http://localhost:8080/api/currencies |

## 📡 API Examples

### Convert Currency
```bash
curl "http://localhost:8080/api/convert?from=USD&to=EUR&amount=100"
```

### Get Supported Currencies
```bash
curl "http://localhost:8080/api/currencies"
```

### With Pretty Print (jq)
```bash
curl -s "http://localhost:8080/api/convert?from=USD&to=EUR&amount=100" | jq
```

## 🧪 Testing Commands

```bash
# All tests
mvn test

# Specific test class
mvn test -Dtest=ConversionServiceTest

# Specific test method
mvn test -Dtest=ConversionServiceTest#testConvertUsdToEur

# Skip tests
mvn clean package -DskipTests

# Coverage report
mvn clean test jacoco:report
open target/site/jacoco/index.html  # macOS
xdg-open target/site/jacoco/index.html  # Linux
```

## 🔧 Troubleshooting

### Port Already in Use
```bash
# macOS/Linux
lsof -ti:8080 | xargs kill -9

# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Clean Build
```bash
mvn clean install
```

### Java Version Warnings
```bash
# Already configured in pom.xml
# Just run normally:
mvn spring-boot:run
```

## 📊 Coverage Goals

| Metric | Target | Current |
|--------|--------|---------|
| Instruction Coverage | 90% | ✅ Met |
| Branch Coverage | 85% | ✅ Met |

## 🗂️ Project Files

| File | Purpose |
|------|---------|
| `pom.xml` | Maven configuration |
| `src/main/java/` | Application source code |
| `src/test/java/` | Test source code |
| `src/main/resources/application.properties` | Configuration |
| `target/` | Build output |
| `target/site/jacoco/` | Coverage reports |

## 🔑 Key Classes

| Class | Purpose |
|-------|---------|
| `CurrencyConverterApplication` | Main Spring Boot application |
| `ConversionController` | REST API endpoints |
| `ConversionService` | Business logic |
| `ConversionResponse` | Response model |

## 📝 Supported Currencies

USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR

## 🎯 Test Coverage

- **Total Tests**: 16
- **Unit Tests**: 12
- **Integration Tests**: 4
- **Success Rate**: 100%

## 🐛 Debug Mode

```bash
# Run with debug port 5005
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"
```

## 📚 Documentation Files

- `README.md` - Main documentation
- `RUNNING_GUIDE.md` - How to run the application
- `JAVA_VERSION_GUIDE.md` - Java version compatibility
- `TEST_SUMMARY.md` - Test execution summary
- `COVERAGE_ANALYSIS.md` - Coverage analysis
- `QUICK_REFERENCE.md` - This file

## ⚡ Quick Checks

```bash
# Check Java version
java -version

# Check Maven version
mvn -version

# Check if port 8080 is available
lsof -i:8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Verify build
mvn verify

# Health check (when running)
curl http://localhost:8080/actuator/health
```

## 🔄 Development Workflow

1. **Make changes** to source code
2. **Run tests**: `mvn test`
3. **Check coverage**: `mvn jacoco:report`
4. **Build**: `mvn clean package`
5. **Run**: `mvn spring-boot:run`
6. **Test API**: Use curl or Swagger UI

## 💡 Tips

- Use Swagger UI for interactive API testing
- Check coverage reports after adding new features
- Run tests before committing code
- Use debug mode for troubleshooting
- Keep Java 17 for best compatibility

## 🆘 Getting Help

1. Check `README.md` for detailed information
2. Review `JAVA_VERSION_GUIDE.md` for version issues
3. Check `RUNNING_GUIDE.md` for running problems
4. Review test reports in `target/surefire-reports/`
5. Check Spring Boot docs: https://spring.io/projects/spring-boot
