package com.codecli.currency.service;

import com.codecli.currency.service.ConversionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ConversionService.
 * Tests the core currency conversion logic, exchange rate calculations,
 * and error handling for edge cases.
 */
class ConversionServiceTest {

    private ConversionService conversionService;

    @BeforeEach
    void setUp() {
        conversionService = new ConversionService();
    }

    @Nested
    @DisplayName("Currency Conversion Tests")
    class ConversionTests {

        @Test
        @DisplayName("Should convert USD to EUR correctly")
        void convertUsdToEur() {
            BigDecimal amount = new BigDecimal("100.00");
            BigDecimal result = conversionService.convert("USD", "EUR", amount);
            
            assertNotNull(result);
            assertEquals(new BigDecimal("92.00"), result);
        }

        @Test
        @DisplayName("Should convert EUR to GBP correctly")
        void convertEurToGbp() {
            BigDecimal amount = new BigDecimal("100.00");
            BigDecimal result = conversionService.convert("EUR", "GBP", amount);
            
            assertNotNull(result);
            assertEquals(new BigDecimal("85.87"), result);
        }

        @Test
        @DisplayName("Should convert JPY to INR correctly")
        void convertJpyToInr() {
            BigDecimal amount = new BigDecimal("1000.00");
            BigDecimal result = conversionService.convert("JPY", "INR", amount);
            
            assertNotNull(result);
            assertEquals(new BigDecimal("553.33"), result);
        }

        @Test
        @DisplayName("Should handle same currency conversion")
        void convertSameCurrency() {
            BigDecimal amount = new BigDecimal("50.00");
            BigDecimal result = conversionService.convert("USD", "USD", amount);
            
            assertNotNull(result);
            assertEquals(new BigDecimal("50.00"), result);
        }

        @Test
        @DisplayName("Should handle lowercase currency codes")
        void convertLowercaseCodes() {
            BigDecimal amount = new BigDecimal("100.00");
            BigDecimal result = conversionService.convert("usd", "eur", amount);
            
            assertNotNull(result);
            assertEquals(new BigDecimal("92.00"), result);
        }

        @Test
        @DisplayName("Should handle currency codes with spaces")
        void convertWithSpaces() {
            BigDecimal amount = new BigDecimal("100.00");
            BigDecimal result = conversionService.convert("  USD  ", "  EUR  ", amount);
            
            assertNotNull(result);
            assertEquals(new BigDecimal("92.00"), result);
        }

        @Test
        @DisplayName("Should throw exception for null amount")
        void convertNullAmount() {
            ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> conversionService.convert("USD", "EUR", null)
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        }

        @Test
        @DisplayName("Should throw exception for negative amount")
        void convertNegativeAmount() {
            BigDecimal amount = new BigDecimal("-50.00");
            ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> conversionService.convert("USD", "EUR", amount)
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        }

        @Test
        @DisplayName("Should throw exception for unsupported currency")
        void convertUnsupportedCurrency() {
            BigDecimal amount = new BigDecimal("100.00");
            ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> conversionService.convert("XYZ", "EUR", amount)
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        }

        @Test
        @DisplayName("Should throw exception when target currency is unsupported")
        void convertUnsupportedTargetCurrency() {
            BigDecimal amount = new BigDecimal("100.00");
            ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> conversionService.convert("USD", "XYZ", amount)
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        }

        @Test
        @DisplayName("Should throw exception for null from currency")
        void convertNullFromCurrency() {
            BigDecimal amount = new BigDecimal("100.00");
            ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> conversionService.convert(null, "EUR", amount)
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        }

        @Test
        @DisplayName("Should throw exception for null to currency (from is valid)")
        void convertNullToCurrency() {
            BigDecimal amount = new BigDecimal("100.00");
            ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> conversionService.convert("USD", null, amount)
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        }
    }

    @Nested
    @DisplayName("Exchange Rate Tests")
    class RateTests {

        @Test
        @DisplayName("Should return correct exchange rate USD to EUR")
        void rateUsdToEur() {
            BigDecimal result = conversionService.rate("USD", "EUR");
            
            assertNotNull(result);
            assertEquals(new BigDecimal("0.920000"), result);
        }

        @Test
        @DisplayName("Should return correct exchange rate EUR to USD")
        void rateEurToUsd() {
            BigDecimal result = conversionService.rate("EUR", "USD");
            
            assertNotNull(result);
            assertEquals(new BigDecimal("1.086957"), result);
        }

        @Test
        @DisplayName("Should return 1.0 for same currency")
        void rateSameCurrency() {
            BigDecimal result = conversionService.rate("USD", "USD");
            
            assertNotNull(result);
            assertEquals(new BigDecimal("1.000000"), result);
        }

        @Test
        @DisplayName("Should handle lowercase currency codes")
        void rateLowercaseCodes() {
            BigDecimal result = conversionService.rate("usd", "eur");
            
            assertNotNull(result);
            assertEquals(new BigDecimal("0.920000"), result);
        }

        @Test
        @DisplayName("Should throw exception for unsupported from currency")
        void rateUnsupportedFromCurrency() {
            ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> conversionService.rate("XYZ", "EUR")
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        }

        @Test
        @DisplayName("Should throw exception for unsupported to currency")
        void rateUnsupportedToCurrency() {
            ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> conversionService.rate("USD", "XYZ")
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        }

        @Test
        @DisplayName("Should throw exception for null from currency")
        void rateNullFromCurrency() {
            ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> conversionService.rate(null, "EUR")
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        }

        @Test
        @DisplayName("Should throw exception for null to currency")
        void rateNullToCurrency() {
            ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> conversionService.rate("USD", null)
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        }
    }

    @Nested
    @DisplayName("Normalize Method Tests")
    class NormalizeTests {

        @Test
        @DisplayName("Should normalize uppercase currency code")
        void normalizeUppercase() {
            String result = invokeNormalize("USD");
            assertEquals("USD", result);
        }

        @Test
        @DisplayName("Should normalize lowercase currency code")
        void normalizeLowercase() {
            String result = invokeNormalize("usd");
            assertEquals("USD", result);
        }

        @Test
        @DisplayName("Should trim whitespace from currency code")
        void normalizeWithWhitespace() {
            String result = invokeNormalize("  usd  ");
            assertEquals("USD", result);
        }

        @Test
        @DisplayName("Should return null for null input")
        void normalizeNull() {
            String result = invokeNormalize(null);
            assertNull(result);
        }
    }

    private String invokeNormalize(String code) {
        try {
            java.lang.reflect.Method method = ConversionService.class.getDeclaredMethod("normalize", String.class);
            method.setAccessible(true);
            return (String) method.invoke(conversionService, code);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
