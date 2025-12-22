package com.codecli.currency.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class ConversionServiceTest {

    private ConversionService conversionService;

    @BeforeEach
    void setUp() {
        conversionService = new ConversionService();
    }

    @Test
    void testConvertUSDToEUR() {
        BigDecimal result = conversionService.convert("USD", "EUR", BigDecimal.valueOf(100));
        assertEquals(new BigDecimal("92.00"), result);
    }

    @Test
    void testConvertEURToUSD() {
        BigDecimal result = conversionService.convert("EUR", "USD", BigDecimal.valueOf(92));
        assertEquals(new BigDecimal("100.00"), result);
    }

    @Test
    void testConvertUSDToGBP() {
        BigDecimal result = conversionService.convert("USD", "GBP", BigDecimal.valueOf(100));
        assertEquals(new BigDecimal("79.00"), result);
    }

    @Test
    void testConvertUSDToJPY() {
        BigDecimal result = conversionService.convert("USD", "JPY", BigDecimal.valueOf(100));
        assertEquals(new BigDecimal("15000.00"), result);
    }

    @Test
    void testConvertUSDToINR() {
        BigDecimal result = conversionService.convert("USD", "INR", BigDecimal.valueOf(100));
        assertEquals(new BigDecimal("8300.00"), result);
    }

    @Test
    void testConvertUSDToCAD() {
        BigDecimal result = conversionService.convert("USD", "CAD", BigDecimal.valueOf(100));
        assertEquals(new BigDecimal("135.00"), result);
    }

    @Test
    void testConvertUSDToAUD() {
        BigDecimal result = conversionService.convert("USD", "AUD", BigDecimal.valueOf(100));
        assertEquals(new BigDecimal("152.00"), result);
    }

    @Test
    void testConvertSameCurrency() {
        BigDecimal result = conversionService.convert("USD", "USD", BigDecimal.valueOf(100));
        assertEquals(new BigDecimal("100.00"), result);
    }

    @Test
    void testConvertWithLowerCaseInput() {
        BigDecimal result = conversionService.convert("usd", "eur", BigDecimal.valueOf(100));
        assertEquals(new BigDecimal("92.00"), result);
    }

    @Test
    void testConvertWithMixedCaseInput() {
        BigDecimal result = conversionService.convert("UsD", "EuR", BigDecimal.valueOf(100));
        assertEquals(new BigDecimal("92.00"), result);
    }

    @Test
    void testConvertWithWhitespace() {
        BigDecimal result = conversionService.convert(" USD ", " EUR ", BigDecimal.valueOf(100));
        assertEquals(new BigDecimal("92.00"), result);
    }

    @Test
    void testConvertZeroAmount() {
        BigDecimal result = conversionService.convert("USD", "EUR", BigDecimal.ZERO);
        assertEquals(new BigDecimal("0.00"), result);
    }

    @Test
    void testConvertNegativeAmountThrowsException() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            conversionService.convert("USD", "EUR", BigDecimal.valueOf(-100));
        });
        assertTrue(exception.getReason().contains("amount must be non-negative"));
    }

    @Test
    void testConvertNullAmountThrowsException() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            conversionService.convert("USD", "EUR", null);
        });
        assertTrue(exception.getReason().contains("amount must be non-negative"));
    }

    @Test
    void testConvertUnsupportedFromCurrencyThrowsException() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            conversionService.convert("XXX", "EUR", BigDecimal.valueOf(100));
        });
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    void testConvertUnsupportedToCurrencyThrowsException() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            conversionService.convert("USD", "XXX", BigDecimal.valueOf(100));
        });
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    void testConvertNullFromCurrencyThrowsException() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            conversionService.convert(null, "EUR", BigDecimal.valueOf(100));
        });
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    void testConvertNullToCurrencyThrowsException() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            conversionService.convert("USD", null, BigDecimal.valueOf(100));
        });
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    void testRateUSDToEUR() {
        BigDecimal rate = conversionService.rate("USD", "EUR");
        assertEquals(new BigDecimal("0.920000"), rate);
    }

    @Test
    void testRateEURToUSD() {
        BigDecimal rate = conversionService.rate("EUR", "USD");
        // 1.00 / 0.92 = 1.086957
        assertEquals(0, rate.compareTo(new BigDecimal("1.086957")));
    }

    @Test
    void testRateSameCurrency() {
        BigDecimal rate = conversionService.rate("USD", "USD");
        assertEquals(new BigDecimal("1.000000"), rate);
    }

    @Test
    void testRateWithLowerCase() {
        BigDecimal rate = conversionService.rate("usd", "eur");
        assertEquals(new BigDecimal("0.920000"), rate);
    }

    @Test
    void testRateWithWhitespace() {
        BigDecimal rate = conversionService.rate(" USD ", " EUR ");
        assertEquals(new BigDecimal("0.920000"), rate);
    }

    @Test
    void testRateUnsupportedFromCurrencyThrowsException() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            conversionService.rate("XXX", "EUR");
        });
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    void testRateUnsupportedToCurrencyThrowsException() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            conversionService.rate("USD", "XXX");
        });
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    void testRateNullFromCurrencyThrowsException() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            conversionService.rate(null, "EUR");
        });
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    void testRateNullToCurrencyThrowsException() {
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            conversionService.rate("USD", null);
        });
        assertTrue(exception.getReason().contains("unsupported currency"));
    }

    @Test
    void testConvertGBPToJPY() {
        // Test cross-currency conversion (not via USD directly in test logic)
        BigDecimal result = conversionService.convert("GBP", "JPY", BigDecimal.valueOf(100));
        // 100 GBP -> USD: 100 / 0.79 = 126.58 USD
        // 126.58 USD -> JPY: 126.58 * 150 = 18987.34
        assertTrue(result.compareTo(new BigDecimal("18987.00")) > 0);
        assertTrue(result.compareTo(new BigDecimal("18988.00")) < 0);
    }

    @Test
    void testConvertSmallAmount() {
        BigDecimal result = conversionService.convert("USD", "EUR", new BigDecimal("0.01"));
        assertEquals(new BigDecimal("0.01"), result);
    }

    @Test
    void testConvertLargeAmount() {
        BigDecimal result = conversionService.convert("USD", "EUR", new BigDecimal("1000000"));
        assertEquals(new BigDecimal("920000.00"), result);
    }
}
