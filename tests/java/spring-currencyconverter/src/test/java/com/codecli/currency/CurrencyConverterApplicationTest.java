package com.codecli.currency;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("CurrencyConverterApplication Integration Tests")
class CurrencyConverterApplicationTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    @DisplayName("Should load application context")
    void contextLoads() {
        assertNotNull(applicationContext);
    }

    @Test
    @DisplayName("Should have ConversionService bean")
    void shouldHaveConversionServiceBean() {
        assertTrue(applicationContext.containsBean("conversionService"));
    }

    @Test
    @DisplayName("Should have ConversionController bean")
    void shouldHaveConversionControllerBean() {
        assertTrue(applicationContext.containsBean("conversionController"));
    }
}
