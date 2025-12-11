package com.codecli.currency.controller;

import com.codecli.currency.model.ConversionResponse;
import com.codecli.currency.service.ConversionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ConversionController Tests")
class ConversionControllerTest {

    private ConversionService conversionService;
    private ConversionController conversionController;

    @BeforeEach
    void setUp() {
        conversionService = new ConversionService();
        conversionController = new ConversionController(conversionService);
    }

    @Test
    @DisplayName("Should convert currency and return response")
    void testConvert() {
        // Arrange
        String from = "USD";
        String to = "EUR";
        BigDecimal amount = new BigDecimal("100.00");

        // Act
        ConversionResponse response = conversionController.convert(from, to, amount);

        // Assert
        assertNotNull(response);
        assertEquals("USD", response.from());
        assertEquals("EUR", response.to());
        assertEquals(amount, response.amount());
        assertEquals(new BigDecimal("92.00"), response.convertedAmount());
        assertEquals(new BigDecimal("0.920000"), response.rate());
    }

    @Test
    @DisplayName("Should convert lowercase currency codes to uppercase")
    void testConvertWithLowercaseCodes() {
        // Arrange
        String from = "usd";
        String to = "eur";
        BigDecimal amount = new BigDecimal("100.00");

        // Act
        ConversionResponse response = conversionController.convert(from, to, amount);

        // Assert
        assertNotNull(response);
        assertEquals("USD", response.from());
        assertEquals("EUR", response.to());
        assertEquals(new BigDecimal("92.00"), response.convertedAmount());
    }

    @Test
    @DisplayName("Should handle GBP to JPY conversion")
    void testConvertGbpToJpy() {
        // Arrange
        String from = "GBP";
        String to = "JPY";
        BigDecimal amount = new BigDecimal("50.00");

        // Act
        ConversionResponse response = conversionController.convert(from, to, amount);

        // Assert
        assertNotNull(response);
        assertEquals("GBP", response.from());
        assertEquals("JPY", response.to());
        assertEquals(amount, response.amount());
        assertEquals(new BigDecimal("9493.67"), response.convertedAmount());
    }

    @Test
    @DisplayName("Should handle zero amount")
    void testConvertZeroAmount() {
        // Arrange
        String from = "USD";
        String to = "EUR";
        BigDecimal amount = BigDecimal.ZERO;

        // Act
        ConversionResponse response = conversionController.convert(from, to, amount);

        // Assert
        assertNotNull(response);
        assertEquals(new BigDecimal("0.00"), response.convertedAmount());
    }

    @Test
    @DisplayName("Should handle large amounts")
    void testConvertLargeAmount() {
        // Arrange
        String from = "USD";
        String to = "INR";
        BigDecimal amount = new BigDecimal("1000000.00");

        // Act
        ConversionResponse response = conversionController.convert(from, to, amount);

        // Assert
        assertNotNull(response);
        assertEquals(amount, response.amount());
        assertEquals(new BigDecimal("83000000.00"), response.convertedAmount());
    }

    @Test
    @DisplayName("Should handle same currency conversion")
    void testConvertSameCurrency() {
        // Arrange
        String from = "USD";
        String to = "USD";
        BigDecimal amount = new BigDecimal("100.00");

        // Act
        ConversionResponse response = conversionController.convert(from, to, amount);

        // Assert
        assertNotNull(response);
        assertEquals("USD", response.from());
        assertEquals("USD", response.to());
        assertEquals(amount, response.amount());
        assertEquals(new BigDecimal("100.00"), response.convertedAmount());
        assertEquals(new BigDecimal("1.000000"), response.rate());
    }

    @Test
    @DisplayName("Should handle CAD to AUD conversion")
    void testConvertCadToAud() {
        // Arrange
        String from = "CAD";
        String to = "AUD";
        BigDecimal amount = new BigDecimal("200.00");

        // Act
        ConversionResponse response = conversionController.convert(from, to, amount);

        // Assert
        assertNotNull(response);
        assertEquals("CAD", response.from());
        assertEquals("AUD", response.to());
        assertEquals(amount, response.amount());
        assertEquals(new BigDecimal("225.19"), response.convertedAmount());
    }

    @Test
    @DisplayName("Should handle decimal amounts")
    void testConvertDecimalAmount() {
        // Arrange
        String from = "EUR";
        String to = "USD";
        BigDecimal amount = new BigDecimal("123.45");

        // Act
        ConversionResponse response = conversionController.convert(from, to, amount);

        // Assert
        assertNotNull(response);
        assertEquals(amount, response.amount());
        assertEquals(new BigDecimal("134.18"), response.convertedAmount());
    }

    @Test
    @DisplayName("Should return proper response structure")
    void testResponseStructure() {
        // Arrange
        String from = "USD";
        String to = "EUR";
        BigDecimal amount = new BigDecimal("100.00");

        // Act
        ConversionResponse response = conversionController.convert(from, to, amount);

        // Assert
        assertNotNull(response);
        assertNotNull(response.from());
        assertNotNull(response.to());
        assertNotNull(response.amount());
        assertNotNull(response.convertedAmount());
        assertNotNull(response.rate());
    }

    @Test
    @DisplayName("Should handle mixed case currency codes")
    void testConvertMixedCase() {
        // Arrange
        String from = "UsD";
        String to = "eUr";
        BigDecimal amount = new BigDecimal("50.00");

        // Act
        ConversionResponse response = conversionController.convert(from, to, amount);

        // Assert
        assertNotNull(response);
        assertEquals("USD", response.from());
        assertEquals("EUR", response.to());
        assertEquals(new BigDecimal("46.00"), response.convertedAmount());
    }
}
