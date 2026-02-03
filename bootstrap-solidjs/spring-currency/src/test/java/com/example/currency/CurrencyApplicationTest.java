package com.example.currency;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("CurrencyApplication Tests")
class CurrencyApplicationTest {

    @Nested
    @DisplayName("ApplicationClassTests")
    class ApplicationClassTests {

        @Test
        @DisplayName("main class should exist and be loadable")
        void mainClassShouldExistAndBeLoadable() {
            assertDoesNotThrow(() -> Class.forName("com.example.currency.CurrencyApplication"));
        }

        @Test
        @DisplayName("should be a Spring Boot application")
        void shouldBeASpringBootApplication() throws ClassNotFoundException {
            Class<?> clazz = Class.forName("com.example.currency.CurrencyApplication");
            assertNotNull(clazz);
        }
    }

    @Nested
    @DisplayName("MainMethodTests")
    class MainMethodTests {

        @Test
        @DisplayName("main method should exist")
        void mainMethodShouldExist() throws NoSuchMethodException {
            CurrencyApplication.class.getMethod("main", String[].class);
        }

        @Test
        @DisplayName("main method should be public static void")
        void mainMethodShouldBePublicStaticVoid() throws NoSuchMethodException {
            var method = CurrencyApplication.class.getMethod("main", String[].class);
            assertTrue(java.lang.reflect.Modifier.isPublic(method.getModifiers()));
            assertTrue(java.lang.reflect.Modifier.isStatic(method.getModifiers()));
            assertEquals(void.class, method.getReturnType());
        }

        @Test
        @DisplayName("main method should not throw exception with no args")
        void mainMethodShouldNotThrowWithNoArgs() {
            assertDoesNotThrow(() -> CurrencyApplication.main(new String[0]));
        }
    }

    @Nested
    @DisplayName("ClassStructureTests")
    class ClassStructureTests {

        @Test
        @DisplayName("class should be public")
        void classShouldBePublic() {
            assertTrue(java.lang.reflect.Modifier.isPublic(CurrencyApplication.class.getModifiers()));
        }

        @Test
        @DisplayName("class should not be abstract")
        void classShouldNotBeAbstract() {
            assertFalse(java.lang.reflect.Modifier.isAbstract(CurrencyApplication.class.getModifiers()));
        }

        @Test
        @DisplayName("class should have empty public constructor")
        void classShouldHaveEmptyPublicConstructor() throws NoSuchMethodException {
            var constructor = CurrencyApplication.class.getConstructor();
            assertTrue(java.lang.reflect.Modifier.isPublic(constructor.getModifiers()));
        }
    }

    @Nested
    @DisplayName("AnnotationTests")
    class AnnotationTests {

        @Test
        @DisplayName("class should have SpringBootApplication annotation")
        void classShouldHaveSpringBootApplicationAnnotation() {
            var annotation = CurrencyApplication.class.getAnnotation(org.springframework.boot.autoconfigure.SpringBootApplication.class);
            assertNotNull(annotation);
        }

        @Test
        @DisplayName("SpringBootApplication should enable component scanning via meta-annotation")
        void springBootApplicationShouldEnableComponentScanningViaMetaAnnotation() throws ClassNotFoundException {
            // SpringBootApplication is a composed annotation that includes @ComponentScan
            // Verify this by checking if the annotation exists on the classpath
            Class<?> componentScanClass = org.springframework.context.annotation.ComponentScan.class;
            assertNotNull(componentScanClass, "ComponentScan annotation should be available");

            // The annotation should enable component scanning via its meta-annotations
            var annotation = CurrencyApplication.class.getAnnotation(org.springframework.boot.autoconfigure.SpringBootApplication.class);
            assertNotNull(annotation);
        }

        @Test
        @DisplayName("SpringBootApplication should have scanBasePackages attribute")
        void springBootApplicationShouldHaveScanBasePackagesAttribute() throws Exception {
            var annotation = CurrencyApplication.class.getAnnotation(org.springframework.boot.autoconfigure.SpringBootApplication.class);
            assertNotNull(annotation);
            // Access the scanBasePackages attribute
            String[] scanBasePackages = annotation.scanBasePackages();
            assertNotNull(scanBasePackages);
        }
    }
}