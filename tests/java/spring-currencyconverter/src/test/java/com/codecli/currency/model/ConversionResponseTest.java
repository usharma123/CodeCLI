package com.codecli.currency.model;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class ConversionResponseTest {

    @Test
    void testConversionResponseCreation() {
        ConversionResponse response = new ConversionResponse(
                "USD",
                "EUR",
                BigDecimal.valueOf(100),
                BigDecimal.valueOf(92),
                BigDecimal.valueOf(0.92)
        );

        assertEquals("USD", response.from());
        assertEquals("EUR", response.to());
        assertEquals(BigDecimal.valueOf(100), response.amount());
        assertEquals(BigDecimal.valueOf(92), response.convertedAmount());
        assertEquals(BigDecimal.valueOf(0.92), response.rate());
    }

    @Test
    void testConversionResponseEquality() {
        ConversionResponse response1 = new ConversionResponse(
                "USD",
                "EUR",
                BigDecimal.valueOf(100),
                BigDecimal.valueOf(92),
                BigDecimal.valueOf(0.92)
        );

        ConversionResponse response2 = new ConversionResponse(
                "USD",
                "EUR",
                BigDecimal.valueOf(100),
                BigDecimal.valueOf(92),
                BigDecimal.valueOf(0.92)
        );

        assertEquals(response1, response2);
    }

    @Test
    void testConversionResponseInequality() {
        ConversionResponse response1 = new ConversionResponse(
                "USD",
                "EUR",
                BigDecimal.valueOf(100),
                BigDecimal.valueOf(92),
                BigDecimal.valueOf(0.92)
        );

        ConversionResponse response2 = new ConversionResponse(
                "USD",
                "GBP",
                BigDecimal.valueOf(100),
                BigDecimal.valueOf(79),
                BigDecimal.valueOf(0.79)
        );

        assertNotEquals(response1, response2);
    }

    @Test
    void testConversionResponseToString() {
        ConversionResponse response = new ConversionResponse(
                "USD",
                "EUR",
                BigDecimal.valueOf(100),
                BigDecimal.valueOf(92),
                BigDecimal.valueOf(0.92)
        );

        String str = response.toString();
        assertTrue(str.contains("USD"));
        assertTrue(str.contains("EUR"));
        assertTrue(str.contains("100"));
        assertTrue(str.contains("92"));
    }

    @Test
    void testConversionResponseHashCode() {
        ConversionResponse response1 = new ConversionResponse(
                "USD",
                "EUR",
                BigDecimal.valueOf(100),
                BigDecimal.valueOf(92),
                BigDecimal.valueOf(0.92)
        );

        ConversionResponse response2 = new ConversionResponse(
                "USD",
                "EUR",
                BigDecimal.valueOf(100),
                BigDecimal.valueOf(92),
                BigDecimal.valueOf(0.92)
        );

        assertEquals(response1.hashCode(), response2.hashCode());
    }
}
