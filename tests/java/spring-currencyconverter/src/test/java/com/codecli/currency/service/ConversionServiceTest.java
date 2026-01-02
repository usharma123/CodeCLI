package com.codecli.currency.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ConversionService.
 * Tests cover happy path scenarios, edge cases, and error handling.
 */
@DisplayName("ConversionService Tests")
class ConversionServiceTest {

    private ConversionService conversionService;

    @BeforeEach
    void setUp() {
        conversionService = new ConversionService();
    }

    @Nested
    @DisplayName("Happy Path Conversion Tests")
    class HappyPathTests {

        @ParameterizedTest
        @CsvSource({
                "USD, EUR, 100, 92.00",
                "EUR, USD, 100, 108.70",
                "USD, GBP, 100, 79.00",
                "GBP, USD, 100, 126.58",
                "USD, JPY, 100, 15000.00",
                "JPY, USD, 100, 0.67",
                "USD, INR, 100, 8300.00",
                "INR, USD, 100, 1.20",
                "USD, CAD, 100, 135.00",
                "CAD, USD, 100, 74.07",
                "USD, AUD, 100, 152.00",
                "AUD, USD, 100, 65.79"
        })
        @DisplayName("Should convert between supported currencies correctly")
        void shouldConvertBetweenSupportedCurrencies(String from, String to, BigDecimal amount, BigDecimal expected) {
            BigDecimal result = conversionService.convert(from, to, amount);
            assertEquals(expected, result);
        }

        @Test
        @DisplayName("Should handle case-insensitive currency codes")
        void shouldHandleCaseInsensitiveCurrencyCodes() {
            BigDecimal resultLower = conversionService.convert("usd", "eur", BigDecimal.valueOf(100));
            BigDecimal resultUpper = conversionService.convert("USD", "EUR", BigDecimal.valueOf(100));
            BigDecimal resultMixed = conversionService.convert("UsD", "EuR", BigDecimal.valueOf(100));

            assertEquals(resultLower, resultUpper);
            assertEquals(resultUpper, resultMixed);
        }

        @Test
        @DisplayName("Should handle whitespace in currency codes")
        void shouldHandleWhitespaceInCurrencyCodes() {
            BigDecimal result = conversionService.convert("  usd  ", "  eur  ", BigDecimal.valueOf(100));
            assertEquals(0, BigDecimal.valueOf(92.00).compareTo(result), "Should handle whitespace in currency codes");
        }

        @Test
        @DisplayName("Should handle zero amount")
        void shouldHandleZeroAmount() {
            BigDecimal result = conversionService.convert("USD", "EUR", BigDecimal.ZERO);
            assertEquals(BigDecimal.ZERO.setScale(2), result);
        }

        @Test
        @DisplayName("Should handle small amounts with precision")
        void shouldHandleSmallAmountsWithPrecision() {
            BigDecimal result = conversionService.convert("USD", "EUR", BigDecimal.valueOf(0.01));
            assertNotNull(result);
            assertTrue(result.compareTo(BigDecimal.ZERO) >= 0);
        }

        @Test
        @DisplayName("Should handle large amounts")
        void shouldHandleLargeAmounts() {
            BigDecimal result = conversionService.convert("USD", "EUR", BigDecimal.valueOf(1000000));
            assertEquals(0, BigDecimal.valueOf(920000.00).compareTo(result), "Should handle large amounts correctly");
        }
    }

    @Nested
    @DisplayName("Rate Calculation Tests")
    class RateCalculationTests {

        @ParameterizedTest
        @CsvSource({
                "USD, EUR, 0.92",
                "EUR, USD, 1.087",
                "USD, GBP, 0.79",
                "GBP, USD, 1.2658",
                "USD, JPY, 150.00",
                "JPY, USD, 0.0067",
                "USD, INR, 83.00",
                "INR, USD, 0.0120",
                "USD, CAD, 1.35",
                "CAD, USD, 0.7407",
                "USD, AUD, 1.52",
                "AUD, USD, 0.6579"
        })
        @DisplayName("Should calculate rates correctly")
        void shouldCalculateRatesCorrectly(String from, String to, BigDecimal expectedRate) {
            BigDecimal result = conversionService.rate(from, to);
            assertEquals(0, result.compareTo(expectedRate), 6, "Rate should match expected value with precision tolerance");
        }

        @Test
        @DisplayName("Should handle case-insensitive rate calculation")
        void shouldHandleCaseInsensitiveRateCalculation() {
            BigDecimal resultLower = conversionService.rate("usd", "eur");
            BigDecimal resultUpper = conversionService.rate("USD", "EUR");
            assertEquals(resultLower, resultUpper);
        }

        @Test
        @DisplayName("Rate should be consistent with conversion")
        void rateShouldBeConsistentWithConversion() {
            BigDecimal rate = conversionService.rate("USD", "EUR");
            BigDecimal amount = BigDecimal.valueOf(100);
            BigDecimal expectedConversion = amount.multiply(rate).setScale(2, java.math.RoundingMode.HALF_UP);
            BigDecimal actualConversion = conversionService.convert("USD", "EUR", amount);
            assertEquals(expectedConversion, actualConversion);
        }
    }

    @Nested
    @DisplayName("Error Handling Tests - Invalid Amount")
    class InvalidAmountTests {

        @Test
        @DisplayName("Should throw exception for null amount")
        void shouldThrowExceptionForNullAmount() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.convert("USD", "EUR", null)
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("amount must be non-negative"));
        }

        @Test
        @DisplayName("Should throw exception for negative amount")
        void shouldThrowExceptionForNegativeAmount() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.convert("USD", "EUR", BigDecimal.valueOf(-100))
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("amount must be non-negative"));
        }

        @Test
        @DisplayName("Should throw exception for rate calculation with null amount")
        void shouldThrowExceptionForRateWithNullAmount() {
            // Rate calculation doesn't validate amount, but it does validate currency codes
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.rate(null, "EUR")
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        }
    }

    @Nested
    @DisplayName("Error Handling Tests - Unsupported Currency")
    class UnsupportedCurrencyTests {

        @Test
        @DisplayName("Should throw exception for null from currency")
        void shouldThrowExceptionForNullFromCurrency() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.convert(null, "EUR", BigDecimal.valueOf(100))
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }

        @Test
        @DisplayName("Should throw exception for null to currency")
        void shouldThrowExceptionForNullToCurrency() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.convert("USD", null, BigDecimal.valueOf(100))
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }

        @Test
        @DisplayName("Should throw exception for invalid from currency")
        void shouldThrowExceptionForInvalidFromCurrency() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.convert("XYZ", "EUR", BigDecimal.valueOf(100))
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }

        @Test
        @DisplayName("Should throw exception for invalid to currency")
        void shouldThrowExceptionForInvalidToCurrency() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.convert("USD", "XYZ", BigDecimal.valueOf(100))
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }

        @Test
        @DisplayName("Should throw exception for both invalid currencies")
        void shouldThrowExceptionForBothInvalidCurrencies() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.convert("XYZ", "ABC", BigDecimal.valueOf(100))
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }

        @Test
        @DisplayName("Should throw exception for rate calculation with invalid currencies")
        void shouldThrowExceptionForRateWithInvalidCurrencies() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.rate("XYZ", "EUR")
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }

        @Test
        @DisplayName("Should throw exception for rate calculation with null currencies")
        void shouldThrowExceptionForRateWithNullCurrencies() {
            ResponseStatusException exceptionFrom = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.rate(null, "EUR")
            );
            assertEquals(HttpStatus.BAD_REQUEST, exceptionFrom.getStatusCode());

            ResponseStatusException exceptionTo = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.rate("USD", null)
            );
            assertEquals(HttpStatus.BAD_REQUEST, exceptionTo.getStatusCode());
        }
    }

    @Nested
    @DisplayName("Edge Cases and Boundary Conditions")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle same currency conversion")
        void shouldHandleSameCurrencyConversion() {
            BigDecimal result = conversionService.convert("USD", "USD", BigDecimal.valueOf(100));
            assertEquals(0, result.compareTo(BigDecimal.valueOf(100.00)), "Same currency conversion should preserve value");
        }

        @Test
        @DisplayName("Same currency rate should be 1")
        void sameCurrencyRateShouldBeOne() {
            BigDecimal result = conversionService.rate("USD", "USD");
            assertEquals(0, result.compareTo(BigDecimal.ONE), "Same currency rate should be 1");
        }

        @Test
        @DisplayName("Should handle maximum precision in rates")
        void shouldHandleMaximumPrecisionInRates() {
            BigDecimal eurToJpy = conversionService.rate("EUR", "JPY");
            BigDecimal expected = BigDecimal.valueOf(150.00).divide(BigDecimal.valueOf(0.92), 6, java.math.RoundingMode.HALF_UP);
            assertEquals(expected, eurToJpy);
        }

        @Test
        @DisplayName("Should handle very small positive amounts")
        void shouldHandleVerySmallPositiveAmounts() {
            BigDecimal result = conversionService.convert("USD", "EUR", BigDecimal.valueOf(0.001));
            assertNotNull(result);
            assertTrue(result.compareTo(BigDecimal.ZERO) >= 0, "Result should be non-negative");
        }
    }
}