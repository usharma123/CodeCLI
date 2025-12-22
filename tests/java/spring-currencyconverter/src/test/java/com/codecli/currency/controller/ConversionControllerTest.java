package com.codecli.currency.controller;

import com.codecli.currency.model.ConversionResponse;
import com.codecli.currency.service.ConversionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class ConversionControllerTest {

    private ConversionController conversionController;
    private ConversionService conversionService;

    @BeforeEach
    void setUp() {
        conversionService = new ConversionService();
        conversionController = new ConversionController(conversionService);
    }

    @Test
    void testConvertSuccess() {
        ConversionResponse response = conversionController.convert("usd", "eur", BigDecimal.valueOf(100));

        assertNotNull(response);
        assertEquals("USD", response.from());
        assertEquals("EUR", response.to());
        assertEquals(BigDecimal.valueOf(100), response.amount());
        assertEquals(new BigDecimal("92.00"), response.convertedAmount());
        assertEquals(new BigDecimal("0.920000"), response.rate());
    }

    @Test
    void testConvertUpperCaseConversion() {
        ConversionResponse response = conversionController.convert("gbp", "jpy", BigDecimal.valueOf(50));

        assertEquals("GBP", response.from());
        assertEquals("JPY", response.to());
    }

    @Test
    void testConvertWithMixedCase() {
        ConversionResponse response = conversionController.convert("CaD", "InR", BigDecimal.valueOf(200));

        assertEquals("CAD", response.from());
        assertEquals("INR", response.to());
    }

    @Test
    void testConvertZeroAmount() {
        ConversionResponse response = conversionController.convert("usd", "eur", BigDecimal.ZERO);

        assertEquals(BigDecimal.ZERO, response.amount());
        assertEquals(new BigDecimal("0.00"), response.convertedAmount());
    }

    @Test
    void testConvertSameCurrency() {
        ConversionResponse response = conversionController.convert("usd", "usd", BigDecimal.valueOf(100));

        assertEquals("USD", response.from());
        assertEquals("USD", response.to());
        assertEquals(new BigDecimal("100.00"), response.convertedAmount());
    }

    @Test
    void testConvertLargeAmount() {
        ConversionResponse response = conversionController.convert("eur", "jpy", new BigDecimal("1000000"));

        assertEquals(new BigDecimal("1000000"), response.amount());
        assertTrue(response.convertedAmount().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    void testConvertSmallAmount() {
        ConversionResponse response = conversionController.convert("usd", "eur", new BigDecimal("0.01"));

        assertEquals(new BigDecimal("0.01"), response.amount());
        assertEquals(new BigDecimal("0.01"), response.convertedAmount());
    }

    @Test
    void testConvertAllSupportedCurrencies() {
        String[] currencies = {"EUR", "GBP", "JPY", "INR", "CAD", "AUD"};
        
        for (String currency : currencies) {
            ConversionResponse response = conversionController.convert("usd", currency.toLowerCase(), BigDecimal.valueOf(100));

            assertEquals("USD", response.from());
            assertEquals(currency, response.to());
            assertNotNull(response.convertedAmount());
            assertNotNull(response.rate());
        }
    }
}
