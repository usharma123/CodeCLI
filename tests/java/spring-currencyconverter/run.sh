#!/bin/bash

# Spring Boot Currency Converter - Run Script
# This script runs the application with proper JVM arguments for Java 21+

echo "🚀 Starting Spring Boot Currency Converter..."
echo "📍 Running on Java version:"
java -version

echo ""
echo "🔧 Using JVM arguments: --enable-native-access=ALL-UNNAMED"
echo ""

# Run the application with native access enabled
mvn spring-boot:run

# Alternative: Run the JAR directly
# java --enable-native-access=ALL-UNNAMED -jar target/spring-currencyconverter-0.0.1-SNAPSHOT.jar
