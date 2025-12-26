package com.codecli.currency.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ConversionService
 */
@DisplayName("ConversionService Tests")
class ConversionServiceTest {

    private ConversionService conversionService;

    @BeforeEach
    void setUp() {
        conversionService = new ConversionService();
    }

    @Nested
    @DisplayName("Convert Method Tests")
    class ConvertMethodTests {

        @Test
        @DisplayName("Should convert USD to EUR correctly")
        void shouldConvertUsdToEur() {
            BigDecimal amount = new BigDecimal("100");
            BigDecimal result = conversionService.convert("USD", "EUR", amount);
            
            assertNotNull(result);
            assertEquals(0, new BigDecimal("92.00").compareTo(result));
        }

        @Test
        @DisplayName("Should convert EUR to USD correctly")
        void shouldConvertEurToUsd() {
            BigDecimal amount = new BigDecimal("100");
            BigDecimal result = conversionService.convert("EUR", "USD", amount);
            
            assertNotNull(result);
            assertEquals(0, new BigDecimal("108.70").compareTo(result));
        }

        @Test
        @DisplayName("Should convert same currency without change")
        void shouldConvertSameCurrency() {
            BigDecimal amount = new BigDecimal("100");
            BigDecimal result = conversionService.convert("USD", "USD", amount);
            
            assertNotNull(result);
            assertEquals(0, amount.compareTo(result));
        }

        @Test
        @DisplayName("Should convert GBP to JPY correctly")
        void shouldConvertGbpToJpy() {
            BigDecimal amount = new BigDecimal("100");
            BigDecimal result = conversionService.convert("GBP", "JPY", amount);
            
            assertNotNull(result);
            assertEquals(0, new BigDecimal("18987.34").compareTo(result));
        }

        @Test
        @DisplayName("Should handle case-insensitive currency codes")
        void shouldHandleCaseInsensitiveCodes() {
            BigDecimal amount = new BigDecimal("100");
            
            BigDecimal resultLower = conversionService.convert("usd", "eur", amount);
            BigDecimal resultUpper = conversionService.convert("USD", "EUR", amount);
            BigDecimal resultMixed = conversionService.convert("Usd", "EuR", amount);
            
            assertEquals(resultLower, resultUpper);
            assertEquals(resultUpper, resultMixed);
        }

        @Test
        @DisplayName("Should throw exception for null amount")
        void shouldThrowExceptionForNullAmount() {
            assertThrows(ResponseStatusException.class, () -> {
                conversionService.convert("USD", "EUR", null);
            });
        }

        @Test
        @DisplayName("Should throw exception for negative amount")
        void shouldThrowExceptionForNegativeAmount() {
            BigDecimal negativeAmount = new BigDecimal("-100");
            
            assertThrows(ResponseStatusException.class, () -> {
                conversionService.convert("USD", "EUR", negativeAmount);
            });
        }

        @Test
        @DisplayName("Should throw exception for unsupported source currency")
        void shouldThrowExceptionForUnsupportedFromCurrency() {
            BigDecimal amount = new BigDecimal("100");
            
            assertThrows(ResponseStatusException.class, () -> {
                conversionService.convert("XYZ", "USD", amount);
            });
        }

        @Test
        @DisplayName("Should throw exception when both currencies are unsupported")
        void shouldThrowExceptionWhenBothCurrenciesUnsupported() {
            BigDecimal amount = new BigDecimal("100");
            
            assertThrows(ResponseStatusException.class, () -> {
                conversionService.convert("XXX", "YYY", amount);
            });
        }

        @Test
        @DisplayName("Should throw exception when normalized source currency is null")
        void shouldThrowExceptionWhenNormalizedFromIsNull() {
            BigDecimal amount = new BigDecimal("100");
            
            assertThrows(ResponseStatusException.class, () -> {
                // Pass null as from currency with valid amount
                conversionService.convert(null, "USD", amount);
            });
        }

        @Test
        @DisplayName("Should throw exception when normalized target currency is null")
        void shouldThrowExceptionWhenNormalizedToIsNull() {
            BigDecimal amount = new BigDecimal("100");
            
            assertThrows(ResponseStatusException.class, () -> {
                // Pass null as to currency with valid amount
                conversionService.convert("USD", null, amount);
            });
        }

        @Test
        @DisplayName("Should throw exception when both currencies are null")
        void shouldThrowExceptionWhenBothCurrenciesAreNull() {
            BigDecimal amount = new BigDecimal("100");
            
            assertThrows(ResponseStatusException.class, () -> {
                conversionService.convert(null, null, amount);
            });
        }

        @Test
        @DisplayName("Should throw exception for unsupported target currency")
        void shouldThrowExceptionForUnsupportedToCurrency() {
            BigDecimal amount = new BigDecimal("100");
            
            assertThrows(ResponseStatusException.class, () -> {
                conversionService.convert("USD", "XYZ", amount);
            });
        }

        @ParameterizedTest
        @CsvSource({
            "USD, EUR, 100, 92.00",
            "EUR, GBP, 100, 85.87",
            "GBP, JPY, 100, 18987.34",
            "JPY, INR, 1000, 553.33",
            "CAD, AUD, 100, 112.59"
        })
        @DisplayName("Should convert various currency pairs correctly")
        void shouldConvertVariousCurrencyPairs(String from, String to, String amount, String expected) {
            BigDecimal result = conversionService.convert(from, to, new BigDecimal(amount));
            
            assertNotNull(result);
            assertEquals(0, new BigDecimal(expected).compareTo(result),
                String.format("Conversion from %s to %s of %s should equal %s", from, to, amount, expected));
        }
    }

    @Nested
    @DisplayName("Rate Method Tests")
    class RateMethodTests {

        @Test
        @DisplayName("Should return correct rate for USD to EUR")
        void shouldReturnCorrectUsdToEurRate() {
            BigDecimal rate = conversionService.rate("USD", "EUR");
            
            assertNotNull(rate);
            assertEquals(0, new BigDecimal("0.920000").compareTo(rate));
        }

        @Test
        @DisplayName("Should return 1.0 for same currency")
        void shouldReturnOneForSameCurrency() {
            BigDecimal rate = conversionService.rate("USD", "USD");
            
            assertNotNull(rate);
            assertEquals(0, BigDecimal.ONE.compareTo(rate));
        }

        @Test
        @DisplayName("Should return inverse rate for reverse conversion")
        void shouldReturnInverseRate() {
            BigDecimal usdToEur = conversionService.rate("USD", "EUR");
            BigDecimal eurToUsd = conversionService.rate("EUR", "USD");
            
            // The product of rate and its inverse should be approximately 1
            BigDecimal product = usdToEur.multiply(eurToUsd);
            assertEquals(0, BigDecimal.ONE.compareTo(product.setScale(2, java.math.RoundingMode.HALF_UP)));
        }

        @Test
        @DisplayName("Should handle case-insensitive currency codes for rate")
        void shouldHandleCaseInsensitiveCodesForRate() {
            BigDecimal rate1 = conversionService.rate("usd", "eur");
            BigDecimal rate2 = conversionService.rate("USD", "EUR");
            
            assertEquals(rate1, rate2);
        }

        @Test
        @DisplayName("Should throw exception for unsupported currency in rate")
        void shouldThrowExceptionForUnsupportedCurrencyInRate() {
            assertThrows(ResponseStatusException.class, () -> {
                conversionService.rate("USD", "INVALID");
            });
        }

        @Test
        @DisplayName("Should throw exception for null source currency in rate")
        void shouldThrowExceptionForNullSourceCurrencyInRate() {
            assertThrows(ResponseStatusException.class, () -> {
                conversionService.rate(null, "USD");
            });
        }

        @Test
        @DisplayName("Should throw exception for null target currency in rate")
        void shouldThrowExceptionForNullTargetCurrencyInRate() {
            assertThrows(ResponseStatusException.class, () -> {
                conversionService.rate("USD", null);
            });
        }

        @Test
        @DisplayName("Should throw exception when normalized source is null in rate")
        void shouldThrowExceptionWhenNormalizedSourceIsNullInRate() {
            assertThrows(ResponseStatusException.class, () -> {
                conversionService.rate("", "USD");
            });
        }

        @Test
        @DisplayName("Should throw exception when normalized target is null in rate")
        void shouldThrowExceptionWhenNormalizedTargetIsNullInRate() {
            assertThrows(ResponseStatusException.class, () -> {
                conversionService.rate("USD", "");
            });
        }

        @Test
        @DisplayName("Should throw exception for null currency in rate")
        void shouldThrowExceptionForNullCurrencyInRate() {
            assertThrows(ResponseStatusException.class, () -> {
                conversionService.rate(null, null);
            });
        }

        @ParameterizedTest
        @CsvSource({
            "USD, EUR, 0.920000",
            "EUR, GBP, 0.858696",
            "GBP, JPY, 189.873418",
            "JPY, INR, 0.553333",
            "CAD, AUD, 1.125926"
        })
        @DisplayName("Should return correct rates for various pairs")
        void shouldReturnCorrectRates(String from, String to, String expectedRate) {
            BigDecimal rate = conversionService.rate(from, to);
            
            assertNotNull(rate);
            assertEquals(0, new BigDecimal(expectedRate).compareTo(rate),
                String.format("Rate from %s to %s should be %s", from, to, expectedRate));
        }
    }

    @Nested
    @DisplayName("Edge Cases Tests")
    class EdgeCasesTests {

        @Test
        @DisplayName("Should handle zero amount")
        void shouldHandleZeroAmount() {
            BigDecimal result = conversionService.convert("USD", "EUR", BigDecimal.ZERO);
            
            assertNotNull(result);
            assertEquals(0, BigDecimal.ZERO.compareTo(result));
        }

        @Test
        @DisplayName("Should handle very small amounts")
        void shouldHandleVerySmallAmounts() {
            BigDecimal amount = new BigDecimal("0.01");
            BigDecimal result = conversionService.convert("USD", "EUR", amount);
            
            assertNotNull(result);
            assertTrue(result.compareTo(BigDecimal.ZERO) > 0);
        }

        @Test
        @DisplayName("Should handle very large amounts")
        void shouldHandleVeryLargeAmounts() {
            BigDecimal amount = new BigDecimal("1000000");
            BigDecimal result = conversionService.convert("USD", "EUR", amount);
            
            assertNotNull(result);
            assertTrue(result.compareTo(BigDecimal.ZERO) > 0);
        }

        @Test
        @DisplayName("Should handle currency codes with extra whitespace")
        void shouldHandleCurrencyCodesWithWhitespace() {
            BigDecimal amount = new BigDecimal("100");
            BigDecimal result = conversionService.convert("  USD  ", "EUR  ", amount);
            
            assertNotNull(result);
            assertEquals(0, new BigDecimal("92.00").compareTo(result));
        }
    }
}
