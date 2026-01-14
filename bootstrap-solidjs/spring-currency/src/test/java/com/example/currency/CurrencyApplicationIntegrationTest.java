package com.example.currency;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ConfigurableApplicationContext;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("CurrencyApplication Integration Tests")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class CurrencyApplicationIntegrationTest {

    @Test
    @DisplayName("Spring context should load successfully")
    void testContextLoads() {
        ConfigurableApplicationContext context = SpringApplication.run(CurrencyApplication.class);
        assertNotNull(context);
        assertTrue(context.isRunning());
        context.close();
    }

    @Test
    @DisplayName("Application instance should be creatable")
    void testApplicationInstance() {
        CurrencyApplication app = new CurrencyApplication();
        assertNotNull(app);
    }

    @Test
    @DisplayName("SpringApplication run should return valid context")
    void testSpringApplicationRun() {
        ConfigurableApplicationContext context = null;
        try {
            context = SpringApplication.run(CurrencyApplication.class);
            assertNotNull(context);
            assertTrue(context.isActive());
        } finally {
            if (context != null) {
                context.close();
            }
        }
    }

    @Test
    @DisplayName("Application should have SpringBootApplication annotation")
    void testAnnotationPresence() {
        assertNotNull(CurrencyApplication.class.getAnnotation(SpringBootApplication.class));
    }
}