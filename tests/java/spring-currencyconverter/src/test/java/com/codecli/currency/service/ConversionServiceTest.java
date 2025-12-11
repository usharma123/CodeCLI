package com.codecli.currency.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ConversionService Tests")
class ConversionServiceTest {

    private ConversionService conversionService;

    @BeforeEach
    void setUp() {
        conversionService = new ConversionService();
    }

    @Test
    @DisplayName("Should convert USD to EUR correctly")
    void testConvertUsdToEur() {
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal result = conversionService.convert("USD", "EUR", amount);
        
        // USD to EUR rate is 0.92, so 100 USD = 92.00 EUR
        assertEquals(new BigDecimal("92.00"), result);
    }

    @Test
    @DisplayName("Should convert EUR to USD correctly")
    void testConvertEurToUsd() {
        BigDecimal amount = new BigDecimal("92.00");
        BigDecimal result = conversionService.convert("EUR", "USD", amount);
        
        // EUR to USD: 92 EUR / 0.92 = 100 USD
        assertEquals(new BigDecimal("100.00"), result);
    }

    @Test
    @DisplayName("Should convert USD to JPY correctly")
    void testConvertUsdToJpy() {
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal result = conversionService.convert("USD", "JPY", amount);
        
        // USD to JPY rate is 150.00
        assertEquals(new BigDecimal("15000.00"), result);
    }

    @Test
    @DisplayName("Should convert GBP to INR correctly")
    void testConvertGbpToInr() {
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal result = conversionService.convert("GBP", "INR", amount);
        
        // GBP to USD: 100 / 0.79 = 126.58227848
        // USD to INR: 126.58227848 * 83 = 10506.33 (rounded)
        assertEquals(new BigDecimal("10506.33"), result);
    }

    @Test
    @DisplayName("Should convert CAD to AUD correctly")
    void testConvertCadToAud() {
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal result = conversionService.convert("CAD", "AUD", amount);
        
        // CAD to USD: 100 / 1.35
        // USD to AUD: result * 1.52
        assertEquals(new BigDecimal("112.59"), result);
    }

    @Test
    @DisplayName("Should handle same currency conversion")
    void testConvertSameCurrency() {
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal result = conversionService.convert("USD", "USD", amount);
        
        assertEquals(new BigDecimal("100.00"), result);
    }

    @Test
    @DisplayName("Should handle lowercase currency codes")
    void testConvertWithLowercaseCodes() {
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal result = conversionService.convert("usd", "eur", amount);
        
        assertEquals(new BigDecimal("92.00"), result);
    }

    @Test
    @DisplayName("Should handle mixed case currency codes")
    void testConvertWithMixedCaseCodes() {
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal result = conversionService.convert("UsD", "EuR", amount);
        
        assertEquals(new BigDecimal("92.00"), result);
    }

    @Test
    @DisplayName("Should handle currency codes with whitespace")
    void testConvertWithWhitespace() {
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal result = conversionService.convert(" USD ", " EUR ", amount);
        
        assertEquals(new BigDecimal("92.00"), result);
    }

    @Test
    @DisplayName("Should handle zero amount")
    void testConvertZeroAmount() {
        BigDecimal amount = BigDecimal.ZERO;
        BigDecimal result = conversionService.convert("USD", "EUR", amount);
        
        assertEquals(new BigDecimal("0.00"), result);
    }

    @Test
    @DisplayName("Should handle small decimal amounts")
    void testConvertSmallDecimalAmount() {
        BigDecimal amount = new BigDecimal("0.01");
        BigDecimal result = conversionService.convert("USD", "EUR", amount);
        
        assertEquals(new BigDecimal("0.01"), result);
    }

    @Test
    @DisplayName("Should handle large amounts")
    void testConvertLargeAmount() {
        BigDecimal amount = new BigDecimal("1000000.00");
        BigDecimal result = conversionService.convert("USD", "EUR", amount);
        
        assertEquals(new BigDecimal("920000.00"), result);
    }

    @Test
    @DisplayName("Should throw exception for negative amount")
    void testConvertNegativeAmount() {
        BigDecimal amount = new BigDecimal("-100.00");
        
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> conversionService.convert("USD", "EUR", amount)
        );
        
        assertTrue(exception.getReason().contains("amount must be non-negative"));
    }

    @Test
    @DisplayName("Should throw exception for null amount")
    void testConvertNullAmount() {
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> conversionService.convert("USD", "EUR", null)
        );
        
        assertTrue(exception.getReason().contains("amount must be non-negative"));
    }

    @Test
    @DisplayName("Should throw exception for unsupported from currency")
    void testConvertUnsupportedFromCurrency() {
        BigDecimal amount = new BigDecimal("100.00");
        
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> conversionService.convert("XXX", "EUR", amount)
        );
        
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    @DisplayName("Should throw exception for unsupported to currency")
    void testConvertUnsupportedToCurrency() {
        BigDecimal amount = new BigDecimal("100.00");
        
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> conversionService.convert("USD", "XXX", amount)
        );
        
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    @DisplayName("Should throw exception for both unsupported currencies")
    void testConvertBothUnsupportedCurrencies() {
        BigDecimal amount = new BigDecimal("100.00");
        
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> conversionService.convert("XXX", "YYY", amount)
        );
        
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    @DisplayName("Should throw exception for null from currency")
    void testConvertNullFromCurrency() {
        BigDecimal amount = new BigDecimal("100.00");
        
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> conversionService.convert(null, "EUR", amount)
        );
        
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    @DisplayName("Should throw exception for null to currency")
    void testConvertNullToCurrency() {
        BigDecimal amount = new BigDecimal("100.00");
        
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> conversionService.convert("USD", null, amount)
        );
        
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    // Rate method tests
    @Test
    @DisplayName("Should calculate USD to EUR rate correctly")
    void testRateUsdToEur() {
        BigDecimal rate = conversionService.rate("USD", "EUR");
        
        // EUR rate / USD rate = 0.92 / 1.00 = 0.92
        assertEquals(new BigDecimal("0.920000"), rate);
    }

    @Test
    @DisplayName("Should calculate EUR to USD rate correctly")
    void testRateEurToUsd() {
        BigDecimal rate = conversionService.rate("EUR", "USD");
        
        // USD rate / EUR rate = 1.00 / 0.92 = 1.086957 (6 decimal places)
        assertEquals(new BigDecimal("1.086957"), rate);
    }

    @Test
    @DisplayName("Should calculate GBP to JPY rate correctly")
    void testRateGbpToJpy() {
        BigDecimal rate = conversionService.rate("GBP", "JPY");
        
        // JPY rate / GBP rate = 150.00 / 0.79 = 189.873418
        assertEquals(new BigDecimal("189.873418"), rate);
    }

    @Test
    @DisplayName("Should calculate same currency rate as 1")
    void testRateSameCurrency() {
        BigDecimal rate = conversionService.rate("USD", "USD");
        
        assertEquals(new BigDecimal("1.000000"), rate);
    }

    @Test
    @DisplayName("Should handle lowercase in rate calculation")
    void testRateWithLowercase() {
        BigDecimal rate = conversionService.rate("usd", "eur");
        
        assertEquals(new BigDecimal("0.920000"), rate);
    }

    @Test
    @DisplayName("Should throw exception for unsupported from currency in rate")
    void testRateUnsupportedFromCurrency() {
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> conversionService.rate("XXX", "EUR")
        );
        
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    @DisplayName("Should throw exception for unsupported to currency in rate")
    void testRateUnsupportedToCurrency() {
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> conversionService.rate("USD", "XXX")
        );
        
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    @DisplayName("Should verify all supported currencies")
    void testAllSupportedCurrencies() {
        String[] currencies = {"USD", "EUR", "GBP", "JPY", "INR", "CAD", "AUD"};
        BigDecimal amount = new BigDecimal("100.00");
        
        for (String from : currencies) {
            for (String to : currencies) {
                assertDoesNotThrow(() -> {
                    BigDecimal result = conversionService.convert(from, to, amount);
                    assertNotNull(result);
                    assertTrue(result.compareTo(BigDecimal.ZERO) >= 0);
                });
            }
        }
    }

    @Test
    @DisplayName("Should maintain precision in conversion")
    void testConversionPrecision() {
        BigDecimal amount = new BigDecimal("123.456");
        BigDecimal result = conversionService.convert("USD", "EUR", amount);
        
        // Should have exactly 2 decimal places
        assertEquals(2, result.scale());
    }

    @Test
    @DisplayName("Should round correctly")
    void testConversionRounding() {
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal result = conversionService.convert("USD", "GBP", amount);
        
        // USD to GBP: 100 * 0.79 = 79.00
        assertEquals(new BigDecimal("79.00"), result);
    }
}
