package com.example.currency;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("CurrencyApplication Tests")
class CurrencyApplicationTest {

    @Nested
    @DisplayName("Application Class Tests")
    class ApplicationClassTests {

        @Test
        @DisplayName("should have SpringBootApplication annotation")
        void shouldHaveSpringBootApplicationAnnotation() {
            assertNotNull(CurrencyApplication.class.getAnnotation(org.springframework.boot.autoconfigure.SpringBootApplication.class));
        }

        @Test
        @DisplayName("should be a public class")
        void shouldBeAPublicClass() {
            assertTrue(java.lang.reflect.Modifier.isPublic(CurrencyApplication.class.getModifiers()));
        }

        @Test
        @DisplayName("should not be abstract")
        void shouldNotBeAbstract() {
            assertFalse(java.lang.reflect.Modifier.isAbstract(CurrencyApplication.class.getModifiers()));
        }

        @Test
        @DisplayName("should extend Object (implicitly)")
        void shouldExtendObject() {
            assertEquals(Object.class, CurrencyApplication.class.getSuperclass());
        }
    }

    @Nested
    @DisplayName("Main Method Tests")
    class MainMethodTests {

        @Test
        @DisplayName("should have main method")
        void shouldHaveMainMethod() throws NoSuchMethodException {
            assertNotNull(CurrencyApplication.class.getMethod("main", String[].class));
        }

        @Test
        @DisplayName("main method should be public static")
        void mainMethodShouldBePublicStatic() throws NoSuchMethodException {
            java.lang.reflect.Method mainMethod = CurrencyApplication.class.getMethod("main", String[].class);

            assertTrue(java.lang.reflect.Modifier.isPublic(mainMethod.getModifiers()));
            assertTrue(java.lang.reflect.Modifier.isStatic(mainMethod.getModifiers()));
        }

        @Test
        @DisplayName("main method should return void")
        void mainMethodShouldReturnVoid() throws NoSuchMethodException {
            java.lang.reflect.Method mainMethod = CurrencyApplication.class.getMethod("main", String[].class);

            assertEquals(void.class, mainMethod.getReturnType());
        }

        @Test
        @DisplayName("main method should accept String array parameter")
        void mainMethodShouldAcceptStringArrayParameter() throws NoSuchMethodException {
            java.lang.reflect.Method mainMethod = CurrencyApplication.class.getMethod("main", String[].class);

            assertEquals(1, mainMethod.getParameterCount());
            assertEquals(String[].class, mainMethod.getParameterTypes()[0]);
        }
    }

    @Nested
    @DisplayName("Class Structure Tests")
    class ClassStructureTests {

        @Test
        @DisplayName("class should be in correct package")
        void classShouldBeInCorrectPackage() {
            assertEquals("com.example.currency", CurrencyApplication.class.getPackageName());
        }

        @Test
        @DisplayName("class should have correct simple name")
        void classShouldHaveCorrectSimpleName() {
            assertEquals("CurrencyApplication", CurrencyApplication.class.getSimpleName());
        }

        @Test
        @DisplayName("class should be loadable")
        void classShouldBeLoadable() {
            assertDoesNotThrow(() -> Class.forName("com.example.currency.CurrencyApplication"));
        }

        @Test
        @DisplayName("class should have no declared fields")
        void classShouldHaveNoDeclaredFields() {
            assertEquals(0, CurrencyApplication.class.getDeclaredFields().length);
        }

        @Test
        @DisplayName("class should have no declared constructors other than default")
        void classShouldHaveNoDeclaredConstructorsOtherThanDefault() {
            java.lang.reflect.Constructor<?>[] constructors = CurrencyApplication.class.getDeclaredConstructors();

            assertEquals(1, constructors.length);
            assertTrue(java.lang.reflect.Modifier.isPublic(constructors[0].getModifiers()));
        }

        @Test
        @DisplayName("default constructor should not throw")
        void defaultConstructorShouldNotThrow() {
            assertDoesNotThrow(() -> new CurrencyApplication());
        }
    }

    @Nested
    @DisplayName("Annotation Tests")
    class AnnotationTests {

        @Test
        @DisplayName("should have SpringBootApplication annotation")
        void shouldHaveSpringBootApplicationAnnotation() {
            org.springframework.boot.autoconfigure.SpringBootApplication annotation =
                    CurrencyApplication.class.getAnnotation(org.springframework.boot.autoconfigure.SpringBootApplication.class);

            assertNotNull(annotation);
        }

        @Test
        @DisplayName("SpringBootApplication should enable auto configuration")
        void springBootApplicationShouldEnableAutoConfiguration() {
            org.springframework.boot.autoconfigure.SpringBootApplication annotation =
                    CurrencyApplication.class.getAnnotation(org.springframework.boot.autoconfigure.SpringBootApplication.class);

            assertNotNull(annotation);
        }

        @Test
        @DisplayName("SpringBootApplication should enable component scanning")
        void springBootApplicationShouldEnableComponentScan() {
            org.springframework.boot.autoconfigure.SpringBootApplication annotation =
                    CurrencyApplication.class.getAnnotation(org.springframework.boot.autoconfigure.SpringBootApplication.class);

            assertNotNull(annotation);
        }
    }
}
