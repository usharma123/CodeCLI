package com.codecli.currency.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ConversionResponse Tests")
class ConversionResponseTest {

    @Test
    @DisplayName("Should create ConversionResponse with all fields")
    void testCreateConversionResponse() {
        String from = "USD";
        String to = "EUR";
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal convertedAmount = new BigDecimal("92.00");
        BigDecimal rate = new BigDecimal("0.92");

        ConversionResponse response = new ConversionResponse(from, to, amount, convertedAmount, rate);

        assertEquals(from, response.from());
        assertEquals(to, response.to());
        assertEquals(amount, response.amount());
        assertEquals(convertedAmount, response.convertedAmount());
        assertEquals(rate, response.rate());
    }

    @Test
    @DisplayName("Should handle null values")
    void testCreateConversionResponseWithNulls() {
        ConversionResponse response = new ConversionResponse(null, null, null, null, null);

        assertNull(response.from());
        assertNull(response.to());
        assertNull(response.amount());
        assertNull(response.convertedAmount());
        assertNull(response.rate());
    }

    @Test
    @DisplayName("Should be equal when all fields match")
    void testEquality() {
        ConversionResponse response1 = new ConversionResponse(
            "USD", "EUR", 
            new BigDecimal("100.00"), 
            new BigDecimal("92.00"), 
            new BigDecimal("0.92")
        );
        
        ConversionResponse response2 = new ConversionResponse(
            "USD", "EUR", 
            new BigDecimal("100.00"), 
            new BigDecimal("92.00"), 
            new BigDecimal("0.92")
        );

        assertEquals(response1, response2);
        assertEquals(response1.hashCode(), response2.hashCode());
    }

    @Test
    @DisplayName("Should not be equal when fields differ")
    void testInequality() {
        ConversionResponse response1 = new ConversionResponse(
            "USD", "EUR", 
            new BigDecimal("100.00"), 
            new BigDecimal("92.00"), 
            new BigDecimal("0.92")
        );
        
        ConversionResponse response2 = new ConversionResponse(
            "USD", "GBP", 
            new BigDecimal("100.00"), 
            new BigDecimal("79.00"), 
            new BigDecimal("0.79")
        );

        assertNotEquals(response1, response2);
    }

    @Test
    @DisplayName("Should have proper toString representation")
    void testToString() {
        ConversionResponse response = new ConversionResponse(
            "USD", "EUR", 
            new BigDecimal("100.00"), 
            new BigDecimal("92.00"), 
            new BigDecimal("0.92")
        );

        String toString = response.toString();
        
        assertTrue(toString.contains("USD"));
        assertTrue(toString.contains("EUR"));
        assertTrue(toString.contains("100.00"));
        assertTrue(toString.contains("92.00"));
        assertTrue(toString.contains("0.92"));
    }

    @Test
    @DisplayName("Should handle different currency pairs")
    void testDifferentCurrencyPairs() {
        ConversionResponse response = new ConversionResponse(
            "GBP", "JPY", 
            new BigDecimal("50.00"), 
            new BigDecimal("9493.67"), 
            new BigDecimal("189.873418")
        );

        assertEquals("GBP", response.from());
        assertEquals("JPY", response.to());
        assertEquals(new BigDecimal("50.00"), response.amount());
        assertEquals(new BigDecimal("9493.67"), response.convertedAmount());
        assertEquals(new BigDecimal("189.873418"), response.rate());
    }

    @Test
    @DisplayName("Should handle zero amounts")
    void testZeroAmounts() {
        ConversionResponse response = new ConversionResponse(
            "USD", "EUR", 
            BigDecimal.ZERO, 
            BigDecimal.ZERO, 
            new BigDecimal("0.92")
        );

        assertEquals(BigDecimal.ZERO, response.amount());
        assertEquals(BigDecimal.ZERO, response.convertedAmount());
    }

    @Test
    @DisplayName("Should handle large amounts")
    void testLargeAmounts() {
        ConversionResponse response = new ConversionResponse(
            "USD", "JPY", 
            new BigDecimal("1000000.00"), 
            new BigDecimal("150000000.00"), 
            new BigDecimal("150.00")
        );

        assertEquals(new BigDecimal("1000000.00"), response.amount());
        assertEquals(new BigDecimal("150000000.00"), response.convertedAmount());
    }

    @Test
    @DisplayName("Should be immutable (record properties)")
    void testImmutability() {
        ConversionResponse response = new ConversionResponse(
            "USD", "EUR", 
            new BigDecimal("100.00"), 
            new BigDecimal("92.00"), 
            new BigDecimal("0.92")
        );

        // Records are immutable by default, verify we can access all fields
        assertNotNull(response.from());
        assertNotNull(response.to());
        assertNotNull(response.amount());
        assertNotNull(response.convertedAmount());
        assertNotNull(response.rate());
    }
}
