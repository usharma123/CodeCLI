# Java Version Compatibility Guide

## Current Situation

- **Your Java Version**: 25.0.1 (Early Access/Preview)
- **Application Target**: Java 17 (LTS)
- **Spring Boot Version**: 3.2.5

## Understanding the Warnings

### What are these warnings?

```
WARNING: A restricted method in java.lang.System has been called
WARNING: java.lang.System::load has been called by org.apache.tomcat.jni.Library
WARNING: Use --enable-native-access=ALL-UNNAMED to avoid a warning
```

### Why do they appear?

Starting with **Java 21**, the JDK introduced stricter controls over native method access as part of Project Panama. This is a security enhancement to:

1. **Prevent unsafe native code execution** without explicit permission
2. **Improve security** by making native access opt-in
3. **Prepare for future removal** of legacy unsafe APIs

### Is this a problem?

**No!** These are **warnings**, not errors:
- ✅ Your application runs correctly
- ✅ All functionality works as expected
- ⚠️ You'll see warning messages in the console
- 🔮 In future Java versions, this will become an error (blocked by default)

## Solutions

### Solution 1: Add JVM Argument (Already Implemented)

The `pom.xml` has been updated to include the JVM argument:

```xml
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
    <configuration>
        <jvmArguments>--enable-native-access=ALL-UNNAMED</jvmArguments>
    </configuration>
</plugin>
```

**Run with:**
```bash
mvn spring-boot:run
```

Or use the provided script:
```bash
./run.sh
```

### Solution 2: Run JAR with JVM Argument

```bash
# Build the JAR
mvn clean package

# Run with native access enabled
java --enable-native-access=ALL-UNNAMED -jar target/spring-currencyconverter-0.0.1-SNAPSHOT.jar
```

### Solution 3: Use Java 17 LTS (Recommended for Production)

Java 17 is the current Long-Term Support (LTS) version and is recommended for production applications.

#### Install Java 17 using SDKMAN (macOS/Linux)

```bash
# Install SDKMAN if not already installed
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

# List available Java versions
sdk list java

# Install Java 17 (Temurin is recommended)
sdk install java 17.0.9-tem

# Use Java 17 for current session
sdk use java 17.0.9-tem

# Set Java 17 as default
sdk default java 17.0.9-tem

# Verify
java -version
```

#### Install Java 17 using Homebrew (macOS)

```bash
# Install Java 17
brew install openjdk@17

# Link it
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk

# Add to PATH in ~/.zshrc or ~/.bash_profile
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"

# Verify
java -version
```

#### Install Java 17 on Windows

1. Download from [Adoptium](https://adoptium.net/temurin/releases/?version=17)
2. Run the installer
3. Set `JAVA_HOME` environment variable
4. Add `%JAVA_HOME%\bin` to PATH

### Solution 4: Upgrade Spring Boot (Future-Proof)

Update to Spring Boot 3.3.0+ which has better support for Java 21+:

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.0</version>
    <relativePath/>
</parent>
```

## Java Version Comparison

| Version | Status | Support Until | Recommended For |
|---------|--------|---------------|-----------------|
| Java 8  | LTS    | 2030 (Extended) | Legacy apps |
| Java 11 | LTS    | 2026 | Legacy apps |
| **Java 17** | **LTS** | **2029** | **Production (Current)** |
| Java 21 | LTS    | 2031 | Production (New projects) |
| Java 25 | Preview | N/A | Development/Testing only |

## Checking Your Java Version

```bash
# Check current Java version
java -version

# Check JAVA_HOME
echo $JAVA_HOME

# List all installed Java versions (macOS)
/usr/libexec/java_home -V

# List all installed Java versions (SDKMAN)
sdk list java
```

## Project-Specific Java Version

You can set a project-specific Java version using `.sdkmanrc`:

```bash
# Create .sdkmanrc in project root
echo "java=17.0.9-tem" > .sdkmanrc

# Now when you cd into the project directory
cd /path/to/spring-currencyconverter
sdk env
```

## Maven Compiler Configuration

The `pom.xml` specifies Java 17:

```xml
<properties>
    <java.version>17</java.version>
</properties>
```

This ensures:
- Code is compiled for Java 17 bytecode
- Application runs on Java 17+
- Features from Java 18+ are not available

## IDE Configuration

### IntelliJ IDEA

1. **File → Project Structure → Project**
   - Project SDK: 17
   - Project language level: 17

2. **File → Settings → Build, Execution, Deployment → Compiler → Java Compiler**
   - Project bytecode version: 17

### VS Code

Add to `.vscode/settings.json`:

```json
{
  "java.configuration.runtimes": [
    {
      "name": "JavaSE-17",
      "path": "/path/to/java-17",
      "default": true
    }
  ]
}
```

### Eclipse

1. **Window → Preferences → Java → Installed JREs**
   - Add Java 17
   - Set as default

2. **Right-click project → Properties → Java Compiler**
   - Compiler compliance level: 17

## Testing with Different Java Versions

```bash
# Test with Java 17
sdk use java 17.0.9-tem
mvn clean test

# Test with Java 21
sdk use java 21.0.1-tem
mvn clean test

# Test with current version (25)
sdk use java 25.0.1-tem
mvn clean test
```

## Continuous Integration (CI/CD)

### GitHub Actions

```yaml
name: Java CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        java: [17, 21]
    
    steps:
    - uses: actions/checkout@v3
    - name: Set up JDK ${{ matrix.java }}
      uses: actions/setup-java@v3
      with:
        java-version: ${{ matrix.java }}
        distribution: 'temurin'
    
    - name: Build with Maven
      run: mvn clean verify
```

## Docker Configuration

```dockerfile
# Use Java 17 base image
FROM eclipse-temurin:17-jre-alpine

# Copy the JAR
COPY target/spring-currencyconverter-0.0.1-SNAPSHOT.jar app.jar

# Run with native access enabled (if needed)
ENTRYPOINT ["java", "--enable-native-access=ALL-UNNAMED", "-jar", "/app.jar"]
```

## Summary

| Approach | Pros | Cons | Recommended |
|----------|------|------|-------------|
| Add JVM argument | Quick fix, no version change | Warnings still appear in logs | ✅ Short-term |
| Use Java 17 | No warnings, LTS support | Need to install/switch | ✅✅ Production |
| Upgrade Spring Boot | Better Java 21+ support | May require code changes | ✅ Long-term |
| Ignore warnings | No changes needed | Warnings clutter logs | ❌ Not recommended |

## Need Help?

- **Spring Boot Docs**: https://spring.io/projects/spring-boot
- **Java Version Support**: https://www.oracle.com/java/technologies/java-se-support-roadmap.html
- **SDKMAN**: https://sdkman.io/
- **Adoptium (OpenJDK)**: https://adoptium.net/

## Quick Reference Commands

```bash
# Check Java version
java -version

# Run with warnings suppressed
mvn spring-boot:run

# Run JAR with native access
java --enable-native-access=ALL-UNNAMED -jar target/*.jar

# Switch to Java 17 (SDKMAN)
sdk use java 17.0.9-tem

# Run tests
mvn test

# Build JAR
mvn clean package
```
