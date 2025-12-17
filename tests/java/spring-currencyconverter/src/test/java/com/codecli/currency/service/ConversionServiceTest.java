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
    void testConvertUsdToEur() {
        BigDecimal amount = BigDecimal.valueOf(100);
        BigDecimal result = conversionService.convert("USD", "EUR", amount);
        // USD to EUR rate is 0.92. 100 * 0.92 = 92.00
        assertEquals(new BigDecimal("92.00"), result);
    }

    @Test
    void testConvertEurToUsd() {
        BigDecimal amount = BigDecimal.valueOf(92);
        BigDecimal result = conversionService.convert("EUR", "USD", amount);
        // EUR to USD rate is 1/0.92. 92 / 0.92 = 100.00
        assertEquals(new BigDecimal("100.00"), result);
    }

    @Test
    void testConvertSameCurrency() {
        BigDecimal amount = BigDecimal.valueOf(100);
        BigDecimal result = conversionService.convert("USD", "USD", amount);
        assertEquals(new BigDecimal("100.00"), result);
    }

    @Test
    void testConvertInvalidCurrency() {
        assertThrows(ResponseStatusException.class, () -> {
            conversionService.convert("INVALID", "USD", BigDecimal.valueOf(100));
        });
        assertThrows(ResponseStatusException.class, () -> {
            conversionService.convert("USD", "INVALID", BigDecimal.valueOf(100));
        });
    }

    @Test
    void testNormalization() {
        BigDecimal result = conversionService.convert(" usd ", "eur", BigDecimal.valueOf(100));
        assertEquals(new BigDecimal("92.00"), result);
        
        result = conversionService.convert("USD", " jpy ", BigDecimal.valueOf(1));
        assertEquals(new BigDecimal("150.00"), result);
    }

    @Test
    void testZeroAmount() {
        BigDecimal result = conversionService.convert("USD", "EUR", BigDecimal.ZERO);
        assertEquals(new BigDecimal("0.00"), result);
    }

    @Test
    void testRoundingPrecision() {
        // 100 JPY to USD: 100 / 150 = 0.66666666... -> 0.67
        BigDecimal result = conversionService.convert("JPY", "USD", BigDecimal.valueOf(100));
        assertEquals(new BigDecimal("0.67"), result);
    }

    @Test
    void testLargeAmount() {
        BigDecimal largeAmount = new BigDecimal("1000000000000.00"); // 1 Trillion
        BigDecimal result = conversionService.convert("USD", "INR", largeAmount);
        assertEquals(new BigDecimal("83000000000000.00"), result);
    }

    @Test
    void testRatePrecision() {
        // EUR to GBP: 0.79 / 0.92 = 0.85869565... -> 0.858696 (6 places)
        BigDecimal rate = conversionService.rate("EUR", "GBP");
        assertEquals(new BigDecimal("0.858696"), rate);
    }

    @Test
    void testConvertNegativeAmount() {
        assertThrows(ResponseStatusException.class, () -> {
            conversionService.convert("USD", "EUR", BigDecimal.valueOf(-100));
        });
    }

    @Test
    void testConvertNullAmount() {
        assertThrows(ResponseStatusException.class, () -> {
            conversionService.convert("USD", "EUR", null);
        });
    }

    @Test
    void testConvertNullCurrency() {
        assertThrows(ResponseStatusException.class, () -> {
            conversionService.convert(null, "USD", BigDecimal.valueOf(100));
        });
        assertThrows(ResponseStatusException.class, () -> {
            conversionService.convert("USD", null, BigDecimal.valueOf(100));
        });
    }

    @Test
    void testRateNullCurrency() {
        assertThrows(ResponseStatusException.class, () -> {
            conversionService.rate(null, "USD");
        });
        assertThrows(ResponseStatusException.class, () -> {
            conversionService.rate("USD", null);
        });
    }

    @Test
    void testRateInvalidCurrency() {
        assertThrows(ResponseStatusException.class, () -> {
            conversionService.rate("INVALID", "USD");
        });
        assertThrows(ResponseStatusException.class, () -> {
            conversionService.rate("USD", "INVALID");
        });
    }

    @Test
    void testRate() {
        BigDecimal rate = conversionService.rate("USD", "EUR");
        assertEquals(new BigDecimal("0.920000"), rate);
    }
}
