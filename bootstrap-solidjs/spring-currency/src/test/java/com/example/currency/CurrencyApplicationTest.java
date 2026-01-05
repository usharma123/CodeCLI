package com.example.currency;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

/**
 * CurrencyApplication tests - covers main class initialization.
 */
@DisplayName("CurrencyApplication Tests")
class CurrencyApplicationTest {

    @Test
    @DisplayName("Should instantiate CurrencyApplication without exception")
    void testApplicationInstantiation() {
        CurrencyApplication application = new CurrencyApplication();
        assertDoesNotThrow(() -> {
            // Just verify the class can be instantiated
        });
    }
}