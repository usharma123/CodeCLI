package com.codecli.currency;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class CurrencyConverterApplicationTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void contextLoads() {
        // This test verifies that the Spring application context loads successfully
        assertNotNull(applicationContext, "Application context should not be null");
    }

    @Test
    void mainMethodStartsApplication() {
        // Test that the main method can be invoked and starts the application
        assertDoesNotThrow(() -> {
            // Create a separate context to test the main method
            ConfigurableApplicationContext context = null;
            try {
                // Call SpringApplication.run directly (same as what main() does)
                // Use a different port to avoid conflicts
                context = SpringApplication.run(
                    CurrencyConverterApplication.class,
                    "--server.port=0",  // Random available port
                    "--spring.main.web-application-type=none"  // Don't start web server
                );
                
                assertNotNull(context, "Application context from main should not be null");
                assertTrue(context.isActive(), "Application context should be active");
            } finally {
                if (context != null) {
                    context.close();
                }
            }
        }, "Main method should start application without throwing exceptions");
    }

    @Test
    void applicationContextContainsExpectedBeans() {
        // Verify that key beans are present in the application context
        assertTrue(applicationContext.containsBean("conversionService"), 
                   "ConversionService bean should be present");
        assertTrue(applicationContext.containsBean("conversionController"), 
                   "ConversionController bean should be present");
    }

    @Test
    void applicationHasCorrectSpringBootConfiguration() {
        // Verify the application is properly annotated
        assertTrue(CurrencyConverterApplication.class.isAnnotationPresent(
                org.springframework.boot.autoconfigure.SpringBootApplication.class),
                "Application class should have @SpringBootApplication annotation");
    }
}
