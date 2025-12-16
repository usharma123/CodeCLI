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
        
        // EUR to USD: 92 EUR should be approximately 100 USD
        assertEquals(new BigDecimal("100.00"), result);
    }

    @Test
    @DisplayName("Should convert USD to GBP correctly")
    void testConvertUsdToGbp() {
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal result = conversionService.convert("USD", "GBP", amount);
        
        // USD to GBP rate is 0.79, so 100 USD = 79.00 GBP
        assertEquals(new BigDecimal("79.00"), result);
    }

    @Test
    @DisplayName("Should convert USD to JPY correctly")
    void testConvertUsdToJpy() {
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal result = conversionService.convert("USD", "JPY", amount);
        
        // USD to JPY rate is 150.00, so 100 USD = 15000.00 JPY
        assertEquals(new BigDecimal("15000.00"), result);
    }

    @Test
    @DisplayName("Should convert USD to INR correctly")
    void testConvertUsdToInr() {
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal result = conversionService.convert("USD", "INR", amount);
        
        // USD to INR rate is 83.00, so 100 USD = 8300.00 INR
        assertEquals(new BigDecimal("8300.00"), result);
    }

    @Test
    @DisplayName("Should convert USD to CAD correctly")
    void testConvertUsdToCad() {
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal result = conversionService.convert("USD", "CAD", amount);
        
        // USD to CAD rate is 1.35, so 100 USD = 135.00 CAD
        assertEquals(new BigDecimal("135.00"), result);
    }

    @Test
    @DisplayName("Should convert USD to AUD correctly")
    void testConvertUsdToAud() {
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal result = conversionService.convert("USD", "AUD", amount);
        
        // USD to AUD rate is 1.52, so 100 USD = 152.00 AUD
        assertEquals(new BigDecimal("152.00"), result);
    }

    @Test
    @DisplayName("Should convert same currency (USD to USD)")
    void testConvertSameCurrency() {
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal result = conversionService.convert("USD", "USD", amount);
        
        assertEquals(new BigDecimal("100.00"), result);
    }

    @Test
    @DisplayName("Should convert EUR to GBP correctly")
    void testConvertEurToGbp() {
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal result = conversionService.convert("EUR", "GBP", amount);
        
        // EUR (0.92) to GBP (0.79): 100 EUR = 100/0.92 * 0.79 ≈ 85.87 GBP
        assertEquals(0, result.compareTo(new BigDecimal("85.87")));
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
    void testConvertWithWhitespaceCodes() {
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
    @DisplayName("Should handle decimal amounts")
    void testConvertDecimalAmount() {
        BigDecimal amount = new BigDecimal("50.50");
        BigDecimal result = conversionService.convert("USD", "EUR", amount);
        
        // 50.50 USD * 0.92 = 46.46 EUR
        assertEquals(new BigDecimal("46.46"), result);
    }

    @Test
    @DisplayName("Should throw exception for negative amount")
    void testConvertNegativeAmount() {
        BigDecimal amount = new BigDecimal("-100.00");
        
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> conversionService.convert("USD", "EUR", amount)
        );
        
        assertTrue(exception.getReason().contains("non-negative"));
    }

    @Test
    @DisplayName("Should throw exception for null amount")
    void testConvertNullAmount() {
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> conversionService.convert("USD", "EUR", null)
        );
        
        assertTrue(exception.getReason().contains("non-negative"));
    }

    @Test
    @DisplayName("Should throw exception for unsupported from currency")
    void testConvertUnsupportedFromCurrency() {
        BigDecimal amount = new BigDecimal("100.00");
        
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> conversionService.convert("XYZ", "EUR", amount)
        );
        
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    @DisplayName("Should throw exception for unsupported to currency")
    void testConvertUnsupportedToCurrency() {
        BigDecimal amount = new BigDecimal("100.00");
        
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> conversionService.convert("USD", "XYZ", amount)
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
        assertEquals(0, rate.compareTo(new BigDecimal("0.920000")));
    }

    @Test
    @DisplayName("Should calculate EUR to USD rate correctly")
    void testRateEurToUsd() {
        BigDecimal rate = conversionService.rate("EUR", "USD");
        
        // USD rate / EUR rate = 1.00 / 0.92 ≈ 1.086957
        assertTrue(rate.compareTo(new BigDecimal("1.086956")) >= 0);
        assertTrue(rate.compareTo(new BigDecimal("1.086958")) <= 0);
    }

    @Test
    @DisplayName("Should calculate same currency rate as 1")
    void testRateSameCurrency() {
        BigDecimal rate = conversionService.rate("USD", "USD");
        
        assertEquals(0, rate.compareTo(new BigDecimal("1.000000")));
    }

    @Test
    @DisplayName("Should handle lowercase in rate calculation")
    void testRateWithLowercase() {
        BigDecimal rate = conversionService.rate("usd", "eur");
        
        assertEquals(0, rate.compareTo(new BigDecimal("0.920000")));
    }

    @Test
    @DisplayName("Should throw exception for unsupported from currency in rate")
    void testRateUnsupportedFromCurrency() {
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> conversionService.rate("XYZ", "EUR")
        );
        
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    @DisplayName("Should throw exception for unsupported to currency in rate")
    void testRateUnsupportedToCurrency() {
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> conversionService.rate("USD", "XYZ")
        );
        
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    @DisplayName("Should throw exception for null from currency in rate")
    void testRateNullFromCurrency() {
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> conversionService.rate(null, "EUR")
        );
        
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    @DisplayName("Should throw exception for null to currency in rate")
    void testRateNullToCurrency() {
        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> conversionService.rate("USD", null)
        );
        
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    @DisplayName("Should calculate GBP to JPY rate correctly")
    void testRateGbpToJpy() {
        BigDecimal rate = conversionService.rate("GBP", "JPY");
        
        // JPY rate / GBP rate = 150.00 / 0.79 ≈ 189.873418
        assertTrue(rate.compareTo(new BigDecimal("189.873417")) >= 0);
        assertTrue(rate.compareTo(new BigDecimal("189.873419")) <= 0);
    }

    @Test
    @DisplayName("Should round conversion result to 2 decimal places")
    void testConversionRounding() {
        BigDecimal amount = new BigDecimal("33.33");
        BigDecimal result = conversionService.convert("USD", "EUR", amount);
        
        // 33.33 * 0.92 = 30.6636, should round to 30.66
        assertEquals(new BigDecimal("30.66"), result);
    }

    @Test
    @DisplayName("Should handle large amounts")
    void testConvertLargeAmount() {
        BigDecimal amount = new BigDecimal("1000000.00");
        BigDecimal result = conversionService.convert("USD", "EUR", amount);
        
        assertEquals(new BigDecimal("920000.00"), result);
    }

    @Test
    @DisplayName("Should handle very small amounts")
    void testConvertVerySmallAmount() {
        BigDecimal amount = new BigDecimal("0.01");
        BigDecimal result = conversionService.convert("USD", "EUR", amount);
        
        // 0.01 * 0.92 = 0.0092, should round to 0.01
        assertEquals(new BigDecimal("0.01"), result);
    }
}
