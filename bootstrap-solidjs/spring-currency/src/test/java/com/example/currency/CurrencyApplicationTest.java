package com.example.currency;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@DisplayName("CurrencyApplication Tests")
@ExtendWith(MockitoExtension.class)
class CurrencyApplicationTest {

    @Test
    @DisplayName("Application class should exist and be instantiable")
    void testApplicationClassExists() {
        CurrencyApplication app = new CurrencyApplication();
        assertNotNull(app);
    }

    @Test
    @DisplayName("Application class should be annotated with SpringBootApplication")
    void testApplicationHasAnnotation() {
        assertNotNull(CurrencyApplication.class.getAnnotation(SpringBootApplication.class));
    }

    @Test
    @DisplayName("Application should be public class")
    void testApplicationIsPublic() {
        assertTrue(java.lang.reflect.Modifier.isPublic(CurrencyApplication.class.getModifiers()));
    }

    @Test
    @DisplayName("main method should exist")
    void testMainMethodExists() throws NoSuchMethodException {
        assertNotNull(CurrencyApplication.class.getMethod("main", String[].class));
    }

    @Test
    @DisplayName("main method should be static")
    void testMainMethodIsStatic() throws NoSuchMethodException {
        java.lang.reflect.Method mainMethod = CurrencyApplication.class.getMethod("main", String[].class);
        assertTrue(java.lang.reflect.Modifier.isStatic(mainMethod.getModifiers()));
    }

    @Test
    @DisplayName("main method should be public")
    void testMainMethodIsPublic() throws NoSuchMethodException {
        java.lang.reflect.Method mainMethod = CurrencyApplication.class.getMethod("main", String[].class);
        assertTrue(java.lang.reflect.Modifier.isPublic(mainMethod.getModifiers()));
    }

    @Test
    @DisplayName("Package should be correct")
    void testPackage() {
        assertEquals("com.example.currency", CurrencyApplication.class.getPackageName());
    }

    @Test
    @DisplayName("main method should call SpringApplication.run with correct class")
    void testMainMethodCallsSpringApplicationRun() throws Exception {
        // Mock SpringApplication to avoid actually starting the application
        try (var mockedStatic = mockStatic(SpringApplication.class)) {
            mockedStatic.when(() -> SpringApplication.run(
                    eq(CurrencyApplication.class),
                    any(String[].class)))
                    .thenReturn(null);

            // Call the main method
            CurrencyApplication.main(new String[]{});

            // Verify SpringApplication.run was called with correct parameters
            mockedStatic.verify(() -> SpringApplication.run(
                    eq(CurrencyApplication.class),
                    any(String[].class)
            ));
        }
    }

    @Test
    @DisplayName("main method should accept empty string array")
    void testMainMethodWithEmptyArgs() throws Exception {
        try (var mockedStatic = mockStatic(SpringApplication.class)) {
            mockedStatic.when(() -> SpringApplication.run(
                    any(Class.class),
                    any(String[].class)))
                    .thenReturn(null);

            CurrencyApplication.main(new String[]{});

            mockedStatic.verify(() -> SpringApplication.run(
                    any(Class.class),
                    any(String[].class)));
        }
    }

    @Test
    @DisplayName("main method should accept arguments")
    void testMainMethodWithArgs() throws Exception {
        try (var mockedStatic = mockStatic(SpringApplication.class)) {
            mockedStatic.when(() -> SpringApplication.run(
                    any(Class.class),
                    any(String[].class)))
                    .thenReturn(null);

            String[] args = {"--server.port=8080"};
            CurrencyApplication.main(args);

            mockedStatic.verify(() -> SpringApplication.run(
                    any(Class.class),
                    eq(args)));
        }
    }
}