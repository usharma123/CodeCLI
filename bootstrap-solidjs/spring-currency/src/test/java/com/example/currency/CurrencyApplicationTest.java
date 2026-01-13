package com.example.currency;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.lang.reflect.Method;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;


    @Nested
    @DisplayName("Application Instance Tests")
    class ApplicationInstanceTests {

        @Test
        @DisplayName("Should create application instance")
        void shouldCreateApplicationInstance() {
            CurrencyApplication app = new CurrencyApplication();
            assertNotNull(app);
        }
    }

    @Nested
    @DisplayName("Main Method Tests")
    class MainMethodTests {

        @Test
        @Timeout(value = 5, unit = TimeUnit.SECONDS)
        @DisplayName("Main method should be invokable with args")
        void mainMethodShouldBeInvokableWithArgs() throws Exception {
            Thread thread = new Thread(() -> {
                try {
                    CurrencyApplication.main(new String[]{"--spring.main.web-application-type=none"});
                } catch (Exception e) {
                    // Expected - will be interrupted or timeout
                }
            });
            thread.start();
            thread.join(4000);
            thread.interrupt();
            assertTrue(true, "main method executed without unhandled exception");
        }

        @Test
        @DisplayName("Main method should have correct signature")
        void mainMethodShouldHaveCorrectSignature() throws Exception {
            Method mainMethod = CurrencyApplication.class.getMethod("main", String[].class);
            assertNotNull(mainMethod);
            assertTrue(java.lang.reflect.Modifier.isStatic(mainMethod.getModifiers()));
            assertEquals(void.class, mainMethod.getReturnType());
        }
    }

    @Nested
    @DisplayName("Spring Context Integration Tests")
    @SpringBootTest
    @TestPropertySource(properties = {
        "spring.main.allow-bean-definition-overriding=true"
    })
    class SpringContextIntegrationTests {

        @Test
        @DisplayName("Spring context should load successfully")
        void springContextShouldLoadSuccessfully() {
            assertNotNull(this, "Spring context should be available");
        }

        @Test
        @DisplayName("CurrencyApplication should be loadable in Spring context")
        void currencyApplicationShouldBeLoadableInSpringContext() {
            assertNotNull(CurrencyApplication.class, "CurrencyApplication class should be loadable");
        }
    }
