package com.example.currency.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ConversionResponse Record Tests")
class ConversionResponseTest {

    @Test
    @DisplayName("Constructor should create valid ConversionResponse")
    void testConstructor() {
        ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

        assertEquals(100.0, response.amount());
        assertEquals("USD", response.from());
        assertEquals("EUR", response.to());
        assertEquals(92.0, response.result());
        assertEquals(0.92, response.rate());
    }

    @Test
    @DisplayName("Constructor with zero values should be valid")
    void testConstructorWithZeroValues() {
        ConversionResponse response = new ConversionResponse(0.0, "USD", "USD", 0.0, 1.0);

        assertEquals(0.0, response.amount());
        assertEquals("USD", response.from());
        assertEquals("USD", response.to());
        assertEquals(0.0, response.result());
        assertEquals(1.0, response.rate());
    }

    @Test
    @DisplayName("Constructor with same currencies should be valid")
    void testConstructorWithSameCurrencies() {
        ConversionResponse response = new ConversionResponse(100.0, "USD", "USD", 100.0, 1.0);

        assertEquals(100.0, response.amount());
        assertEquals("USD", response.from());
        assertEquals("USD", response.to());
        assertEquals(100.0, response.result());
        assertEquals(1.0, response.rate());
    }

    @Test
    @DisplayName("Constructor with large values should be valid")
    void testConstructorWithLargeValues() {
        ConversionResponse response = new ConversionResponse(1000000.0, "JPY", "USD", 6688.96, 0.00668896);

        assertEquals(1000000.0, response.amount());
        assertEquals("JPY", response.from());
        assertEquals("USD", response.to());
        assertEquals(6688.96, response.result());
    }

    @Test
    @DisplayName("Constructor with fractional values should preserve precision")
    void testConstructorWithFractionalValues() {
        ConversionResponse response = new ConversionResponse(99.99, "EUR", "GBP", 78.99, 0.79);

        assertEquals(99.99, response.amount());
        assertEquals(78.99, response.result());
        assertEquals(0.79, response.rate());
    }

    @Test
    @DisplayName("Constructor with negative result should be valid")
    void testConstructorWithNegativeResult() {
        ConversionResponse response = new ConversionResponse(-100.0, "USD", "EUR", -92.0, 0.92);

        assertEquals(-100.0, response.amount());
        assertEquals(-92.0, response.result());
    }

    @Test
    @DisplayName("equals should return true for same values")
    void testEquals() {
        ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
        ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

        assertEquals(response1, response2);
    }

    @Test
    @DisplayName("equals should return false for different values")
    void testEqualsDifferentValues() {
        ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
        ConversionResponse response2 = new ConversionResponse(200.0, "USD", "EUR", 184.0, 0.92);

        assertNotEquals(response1, response2);
    }

    @Test
    @DisplayName("equals should return false for different from currency")
    void testEqualsDifferentFrom() {
        ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
        ConversionResponse response2 = new ConversionResponse(100.0, "GBP", "EUR", 92.0, 0.92);

        assertNotEquals(response1, response2);
    }

    @Test
    @DisplayName("equals should return false for different to currency")
    void testEqualsDifferentTo() {
        ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
        ConversionResponse response2 = new ConversionResponse(100.0, "USD", "GBP", 79.0, 0.79);

        assertNotEquals(response1, response2);
    }

    @Test
    @DisplayName("equals with null should return false")
    void testEqualsWithNull() {
        ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

        assertNotEquals(null, response);
    }

    @Test
    @DisplayName("equals with different type should return false")
    void testEqualsWithDifferentType() {
        ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

        assertNotEquals("string", response);
    }

    @Test
    @DisplayName("hashCode should be consistent for equal objects")
    void testHashCode() {
        ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
        ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

        assertEquals(response1.hashCode(), response2.hashCode());
    }

    @Test
    @DisplayName("toString should contain all fields")
    void testToString() {
        ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
        String result = response.toString();

        assertTrue(result.contains("100.0"));
        assertTrue(result.contains("USD"));
        assertTrue(result.contains("EUR"));
        assertTrue(result.contains("92.0"));
        assertTrue(result.contains("0.92"));
    }

    @Test
    @DisplayName("toString should not be null or empty")
    void testToStringNotNull() {
        ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

        assertNotNull(response.toString());
        assertFalse(response.toString().isEmpty());
    }
}