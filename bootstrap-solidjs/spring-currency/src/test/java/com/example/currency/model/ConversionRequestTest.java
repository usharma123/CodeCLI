package com.example.currency.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ConversionRequest Record Tests")
class ConversionRequestTest {

    @Test
    @DisplayName("Constructor should create valid ConversionRequest")
    void testConstructor() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

        assertEquals(100.0, request.amount());
        assertEquals(Currency.USD, request.from());
        assertEquals(Currency.EUR, request.to());
    }

    @Test
    @DisplayName("Constructor with zero amount should be valid")
    void testConstructorWithZeroAmount() {
        ConversionRequest request = new ConversionRequest(0.0, Currency.USD, Currency.EUR);

        assertEquals(0.0, request.amount());
        assertEquals(Currency.USD, request.from());
        assertEquals(Currency.EUR, request.to());
    }

    @Test
    @DisplayName("Constructor with negative amount should be valid")
    void testConstructorWithNegativeAmount() {
        ConversionRequest request = new ConversionRequest(-50.0, Currency.USD, Currency.EUR);

        assertEquals(-50.0, request.amount());
        assertEquals(Currency.USD, request.from());
        assertEquals(Currency.EUR, request.to());
    }

    @Test
    @DisplayName("Constructor with same source and target currency should be valid")
    void testConstructorWithSameCurrencies() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.USD);

        assertEquals(100.0, request.amount());
        assertEquals(Currency.USD, request.from());
        assertEquals(Currency.USD, request.to());
    }

    @Test
    @DisplayName("Constructor with large amount should be valid")
    void testConstructorWithLargeAmount() {
        ConversionRequest request = new ConversionRequest(1_000_000.0, Currency.JPY, Currency.USD);

        assertEquals(1_000_000.0, request.amount());
        assertEquals(Currency.JPY, request.from());
        assertEquals(Currency.USD, request.to());
    }

    @Test
    @DisplayName("Constructor with fractional amount should preserve precision")
    void testConstructorWithFractionalAmount() {
        ConversionRequest request = new ConversionRequest(99.99, Currency.EUR, Currency.GBP);

        assertEquals(99.99, request.amount());
    }

    @Test
    @DisplayName("equals should return true for same values")
    void testEquals() {
        ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
        ConversionRequest request2 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

        assertEquals(request1, request2);
    }

    @Test
    @DisplayName("equals should return false for different amounts")
    void testEqualsDifferentAmounts() {
        ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
        ConversionRequest request2 = new ConversionRequest(200.0, Currency.USD, Currency.EUR);

        assertNotEquals(request1, request2);
    }

    @Test
    @DisplayName("equals should return false for different currencies")
    void testEqualsDifferentCurrencies() {
        ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
        ConversionRequest request2 = new ConversionRequest(100.0, Currency.USD, Currency.GBP);

        assertNotEquals(request1, request2);
    }

    @Test
    @DisplayName("hashCode should be consistent for equal objects")
    void testHashCode() {
        ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
        ConversionRequest request2 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

        assertEquals(request1.hashCode(), request2.hashCode());
    }

    @Test
    @DisplayName("toString should contain all fields")
    void testToString() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
        String result = request.toString();

        assertTrue(result.contains("100.0"));
        assertTrue(result.contains("USD"));
        assertTrue(result.contains("EUR"));
    }

    @Test
    @DisplayName("toString should not be null or empty")
    void testToStringNotNull() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

        assertNotNull(request.toString());
        assertFalse(request.toString().isEmpty());
    }

    @Test
    @DisplayName("All currency combinations should be valid")
    void testAllCurrencyCombinations() {
        for (Currency from : Currency.values()) {
            for (Currency to : Currency.values()) {
                ConversionRequest request = new ConversionRequest(50.0, from, to);
                assertNotNull(request);
                assertEquals(from, request.from());
                assertEquals(to, request.to());
            }
        }
    }
}