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
        // Arrange
        String from = "USD";
        String to = "EUR";
        BigDecimal amount = new BigDecimal("100.00");
        BigDecimal convertedAmount = new BigDecimal("92.00");
        BigDecimal rate = new BigDecimal("0.920000");

        // Act
        ConversionResponse response = new ConversionResponse(from, to, amount, convertedAmount, rate);

        // Assert
        assertNotNull(response);
        assertEquals(from, response.from());
        assertEquals(to, response.to());
        assertEquals(amount, response.amount());
        assertEquals(convertedAmount, response.convertedAmount());
        assertEquals(rate, response.rate());
    }

    @Test
    @DisplayName("Should support record equality")
    void testRecordEquality() {
        // Arrange
        ConversionResponse response1 = new ConversionResponse(
            "USD", "EUR", 
            new BigDecimal("100.00"), 
            new BigDecimal("92.00"), 
            new BigDecimal("0.920000")
        );
        
        ConversionResponse response2 = new ConversionResponse(
            "USD", "EUR", 
            new BigDecimal("100.00"), 
            new BigDecimal("92.00"), 
            new BigDecimal("0.920000")
        );

        // Assert
        assertEquals(response1, response2);
        assertEquals(response1.hashCode(), response2.hashCode());
    }

    @Test
    @DisplayName("Should support record inequality")
    void testRecordInequality() {
        // Arrange
        ConversionResponse response1 = new ConversionResponse(
            "USD", "EUR", 
            new BigDecimal("100.00"), 
            new BigDecimal("92.00"), 
            new BigDecimal("0.920000")
        );
        
        ConversionResponse response2 = new ConversionResponse(
            "USD", "GBP", 
            new BigDecimal("100.00"), 
            new BigDecimal("79.00"), 
            new BigDecimal("0.790000")
        );

        // Assert
        assertNotEquals(response1, response2);
    }

    @Test
    @DisplayName("Should have proper toString representation")
    void testToString() {
        // Arrange
        ConversionResponse response = new ConversionResponse(
            "USD", "EUR", 
            new BigDecimal("100.00"), 
            new BigDecimal("92.00"), 
            new BigDecimal("0.920000")
        );

        // Act
        String toString = response.toString();

        // Assert
        assertNotNull(toString);
        assertTrue(toString.contains("USD"));
        assertTrue(toString.contains("EUR"));
        assertTrue(toString.contains("100.00"));
        assertTrue(toString.contains("92.00"));
        assertTrue(toString.contains("0.920000"));
    }

    @Test
    @DisplayName("Should handle null values")
    void testNullValues() {
        // Act
        ConversionResponse response = new ConversionResponse(null, null, null, null, null);

        // Assert
        assertNotNull(response);
        assertNull(response.from());
        assertNull(response.to());
        assertNull(response.amount());
        assertNull(response.convertedAmount());
        assertNull(response.rate());
    }

    @Test
    @DisplayName("Should handle zero values")
    void testZeroValues() {
        // Arrange
        ConversionResponse response = new ConversionResponse(
            "USD", "EUR", 
            BigDecimal.ZERO, 
            BigDecimal.ZERO, 
            BigDecimal.ZERO
        );

        // Assert
        assertNotNull(response);
        assertEquals(BigDecimal.ZERO, response.amount());
        assertEquals(BigDecimal.ZERO, response.convertedAmount());
        assertEquals(BigDecimal.ZERO, response.rate());
    }

    @Test
    @DisplayName("Should handle large values")
    void testLargeValues() {
        // Arrange
        BigDecimal largeAmount = new BigDecimal("999999999.99");
        ConversionResponse response = new ConversionResponse(
            "USD", "JPY", 
            largeAmount, 
            new BigDecimal("149999999998.50"), 
            new BigDecimal("150.000000")
        );

        // Assert
        assertNotNull(response);
        assertEquals(largeAmount, response.amount());
    }
}
