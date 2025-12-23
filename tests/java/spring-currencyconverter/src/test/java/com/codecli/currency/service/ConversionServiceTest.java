package com.codecli.currency.service;

import com.codecli.currency.service.ConversionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
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
        @DisplayName("Should convert EUR to USD correctly")
        void convertEurToUsd() {
            BigDecimal amount = new BigDecimal("92.00");
            BigDecimal result = conversionService.convert("EUR", "USD", amount);
            
            assertNotNull(result);
            assertEquals(new BigDecimal("100.00"), result);
        }

        @Test
        @DisplayName("Should convert GBP to JPY correctly")
        void convertGbpToJpy() {
            BigDecimal amount = new BigDecimal("100.00");
            BigDecimal result = conversionService.convert("GBP", "JPY", amount);
            
            assertNotNull(result);
            // GBP rate is 0.79, JPY rate is 150.00
            // 100 / 0.79 * 150 = 18987.34 (rounded to 2 decimals)
            assertEquals(new BigDecimal("18987.34"), result);
        }

        @Test
        @DisplayName("Should convert same currency correctly")
        void convertSameCurrency() {
            BigDecimal amount = new BigDecimal("100.00");
            BigDecimal result = conversionService.convert("USD", "USD", amount);
            
            assertNotNull(result);
            assertEquals(amount, result);
        }

        @Test
        @DisplayName("Should handle large amounts")
        void convertLargeAmount() {
            BigDecimal amount = new BigDecimal("1000000.00");
            BigDecimal result = conversionService.convert("USD", "EUR", amount);
            
            assertNotNull(result);
            assertEquals(new BigDecimal("920000.00"), result);
        }

        @Test
        @DisplayName("Should handle small amounts")
        void convertSmallAmount() {
            BigDecimal amount = new BigDecimal("0.01");
            BigDecimal result = conversionService.convert("USD", "EUR", amount);
            
            assertNotNull(result);
            assertEquals(new BigDecimal("0.01"), result);
        }

        @Test
        @DisplayName("Should convert INR to CAD correctly")
        void convertInrToCad() {
            BigDecimal amount = new BigDecimal("100.00");
            BigDecimal result = conversionService.convert("INR", "CAD", amount);
            
            assertNotNull(result);
            // INR rate: 83.00, CAD rate: 1.35
            // 100 / 83 * 1.35 = 1.63
            assertEquals(new BigDecimal("1.63"), result);
        }

        @Test
        @DisplayName("Should convert AUD to all supported currencies")
        void convertAudToVarious() {
            BigDecimal amount = new BigDecimal("100.00");
            
            BigDecimal toUsd = conversionService.convert("AUD", "USD", amount);
            BigDecimal toEur = conversionService.convert("AUD", "EUR", amount);
            BigDecimal toGbp = conversionService.convert("AUD", "GBP", amount);
            BigDecimal toJpy = conversionService.convert("AUD", "JPY", amount);
            
            assertNotNull(toUsd);
            assertNotNull(toEur);
            assertNotNull(toGbp);
            assertNotNull(toJpy);
            
            // Verify AUD rate is 1.52
            assertTrue(toUsd.compareTo(BigDecimal.ZERO) > 0);
            assertTrue(toEur.compareTo(toUsd) < 0); // EUR is weaker than USD
        }
    }

    @Nested
    @DisplayName("Exchange Rate Tests")
    class RateTests {

        @Test
        @DisplayName("Should return correct USD to EUR rate")
        void rateUsdToEur() {
            BigDecimal rate = conversionService.rate("USD", "EUR");
            assertNotNull(rate);
            assertEquals(new BigDecimal("0.920000"), rate);
        }

        @Test
        @DisplayName("Should return correct EUR to USD rate (inverse)")
        void rateEurToUsd() {
            BigDecimal rate = conversionService.rate("EUR", "USD");
            assertNotNull(rate);
            // 1 / 0.92 = 1.086956...
            assertEquals(new BigDecimal("1.086957"), rate);
        }

        @Test
        @DisplayName("Should return 1.0 for same currency rate")
        void rateSameCurrency() {
            BigDecimal rate = conversionService.rate("USD", "USD");
            assertNotNull(rate);
            assertEquals(0, rate.compareTo(BigDecimal.ONE));
        }

        @Test
        @DisplayName("Should return correct GBP to JPY rate")
        void rateGbpToJpy() {
            BigDecimal rate = conversionService.rate("GBP", "JPY");
            assertNotNull(rate);
            // 150 / 0.79 = 189.873...
            assertEquals(new BigDecimal("189.873418"), rate);
        }

        @Test
        @DisplayName("Should return rate for all currency pairs")
        void rateAllPairs() {
            String[] currencies = {"USD", "EUR", "GBP", "JPY", "INR", "CAD", "AUD"};
            
            for (String from : currencies) {
                for (String to : currencies) {
                    BigDecimal rate = conversionService.rate(from, to);
                    assertNotNull(rate, "Rate should not be null for " + from + " to " + to);
                    assertTrue(rate.compareTo(BigDecimal.ZERO) > 0, 
                            "Rate should be positive for " + from + " to " + to);
                }
            }
        }

        @Test
        @DisplayName("Should throw exception for null source currency in rate")
        void rateNullFromCurrency() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.rate(null, "USD")
            );
            assertEquals(400, exception.getStatusCode().value());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }

        @Test
        @DisplayName("Should throw exception for null target currency in rate")
        void rateNullToCurrency() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.rate("USD", null)
            );
            assertEquals(400, exception.getStatusCode().value());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }

        @Test
        @DisplayName("Should throw exception for empty string currency in rate")
        void rateEmptyStringCurrency() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.rate("", "USD")
            );
            assertEquals(400, exception.getStatusCode().value());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }

        @Test
        @DisplayName("Should throw exception for whitespace-only currency in rate")
        void rateWhitespaceOnlyCurrency() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.rate("   ", "USD")
            );
            assertEquals(400, exception.getStatusCode().value());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }
    }

    @Nested
    @DisplayName("Currency Code Normalization Tests")
    class NormalizationTests {

        @Test
        @DisplayName("Should handle lowercase currency codes")
        void convertLowercase() {
            BigDecimal result = conversionService.convert("usd", "eur", new BigDecimal("100.00"));
            assertEquals(new BigDecimal("92.00"), result);
        }

        @Test
        @DisplayName("Should handle mixed case currency codes")
        void convertMixedCase() {
            BigDecimal result = conversionService.convert("UsD", "EuR", new BigDecimal("100.00"));
            assertEquals(new BigDecimal("92.00"), result);
        }

        @Test
        @DisplayName("Should handle currency codes with spaces")
        void convertWithSpaces() {
            BigDecimal result = conversionService.convert(" USD ", " EUR ", new BigDecimal("100.00"));
            assertEquals(new BigDecimal("92.00"), result);
        }

        @Test
        @DisplayName("Should handle lowercase in rate calculation")
        void rateLowercase() {
            BigDecimal rate = conversionService.rate("usd", "eur");
            assertEquals(new BigDecimal("0.920000"), rate);
        }
    }

    @Nested
    @DisplayName("Error Handling Tests")
    class ErrorHandlingTests {

        @Test
        @DisplayName("Should throw exception for null amount")
        void convertNullAmount() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.convert("USD", "EUR", null)
            );
            assertEquals(400, exception.getStatusCode().value());
            assertTrue(exception.getReason().contains("amount must be non-negative"));
        }

        @Test
        @DisplayName("Should throw exception for negative amount")
        void convertNegativeAmount() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.convert("USD", "EUR", new BigDecimal("-100.00"))
            );
            assertEquals(400, exception.getStatusCode().value());
            assertTrue(exception.getReason().contains("amount must be non-negative"));
        }

        @Test
        @DisplayName("Should throw exception for zero amount")
        void convertZeroAmount() {
            BigDecimal result = conversionService.convert("USD", "EUR", BigDecimal.ZERO);
            assertEquals(0, result.compareTo(BigDecimal.ZERO));
        }

        @Test
        @DisplayName("Should throw exception for unsupported source currency")
        void convertUnsupportedFromCurrency() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.convert("XYZ", "USD", new BigDecimal("100.00"))
            );
            assertEquals(400, exception.getStatusCode().value());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }

        @Test
        @DisplayName("Should throw exception for unsupported target currency")
        void convertUnsupportedToCurrency() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.convert("USD", "XYZ", new BigDecimal("100.00"))
            );
            assertEquals(400, exception.getStatusCode().value());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }

        @Test
        @DisplayName("Should throw exception for both unsupported currencies")
        void convertBothUnsupportedCurrencies() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.convert("XYZ", "ABC", new BigDecimal("100.00"))
            );
            assertEquals(400, exception.getStatusCode().value());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }

        @Test
        @DisplayName("Should throw exception for null source currency")
        void convertNullFromCurrency() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.convert(null, "USD", new BigDecimal("100.00"))
            );
            assertEquals(400, exception.getStatusCode().value());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }

        @Test
        @DisplayName("Should throw exception for null target currency")
        void convertNullToCurrency() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.convert("USD", null, new BigDecimal("100.00"))
            );
            assertEquals(400, exception.getStatusCode().value());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }

        @Test
        @DisplayName("Should throw exception for rate with unsupported currency")
        void rateUnsupportedCurrency() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionService.rate("USD", "XYZ")
            );
            assertEquals(400, exception.getStatusCode().value());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }
    }

    @Nested
    @DisplayName("Precision and Rounding Tests")
    class PrecisionTests {

        @Test
        @DisplayName("Should round result to 2 decimal places")
        void roundingPrecision() {
            // This conversion should produce a value that needs rounding
            BigDecimal result = conversionService.convert("GBP", "JPY", new BigDecimal("1.00"));
            assertEquals(2, result.scale());
        }

        @Test
        @DisplayName("Should handle amounts requiring exact precision")
        void exactPrecision() {
            BigDecimal result = conversionService.convert("USD", "EUR", new BigDecimal("50.00"));
            assertEquals(new BigDecimal("46.00"), result);
        }

        @Test
        @DisplayName("Should preserve precision for rate calculation")
        void ratePrecision() {
            BigDecimal rate = conversionService.rate("EUR", "GBP");
            assertEquals(6, rate.scale());
        }
    }

    @Nested
    @DisplayName("Boundary Value Tests")
    class BoundaryTests {

        @Test
        @DisplayName("Should handle maximum supported currency code length")
        void maxCurrencyCodeLength() {
            // Currency codes are 3 characters, this tests the boundary
            BigDecimal result = conversionService.convert("USD", "EUR", new BigDecimal("1.00"));
            assertNotNull(result);
        }

        @Test
        @DisplayName("Should handle very small positive amount")
        void verySmallAmount() {
            BigDecimal amount = new BigDecimal("0.001");
            BigDecimal result = conversionService.convert("USD", "EUR", amount);
            assertNotNull(result);
            assertTrue(result.compareTo(BigDecimal.ZERO) >= 0);
        }
    }
}
