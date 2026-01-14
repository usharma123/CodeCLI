package com.example.currency.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Currency Enum Tests")
class CurrencyTest {

    @Test
    @DisplayName("All currency values should exist")
    void testAllCurrencyValuesExist() {
        assertEquals(10, Currency.values().length, "Currency enum should have exactly 10 values");
    }

    @ParameterizedTest
    @EnumSource(Currency.class)
    @DisplayName("All currency enum values should have valid names")
    void testCurrencyValuesHaveValidNames(Currency currency) {
        assertNotNull(currency.name(), "Currency name should not be null");
        assertFalse(currency.name().isEmpty(), "Currency name should not be empty");
    }

    @Test
    @DisplayName("USD valueOf should return USD enum")
    void testValueOfUSD() {
        assertEquals(Currency.USD, Currency.valueOf("USD"));
    }

    @Test
    @DisplayName("EUR valueOf should return EUR enum")
    void testValueOfEUR() {
        assertEquals(Currency.EUR, Currency.valueOf("EUR"));
    }

    @Test
    @DisplayName("GBP valueOf should return GBP enum")
    void testValueOfGBP() {
        assertEquals(Currency.GBP, Currency.valueOf("GBP"));
    }

    @Test
    @DisplayName("JPY valueOf should return JPY enum")
    void testValueOfJPY() {
        assertEquals(Currency.JPY, Currency.valueOf("JPY"));
    }

    @Test
    @DisplayName("CAD valueOf should return CAD enum")
    void testValueOfCAD() {
        assertEquals(Currency.CAD, Currency.valueOf("CAD"));
    }

    @Test
    @DisplayName("AUD valueOf should return AUD enum")
    void testValueOfAUD() {
        assertEquals(Currency.AUD, Currency.valueOf("AUD"));
    }

    @Test
    @DisplayName("CHF valueOf should return CHF enum")
    void testValueOfCHF() {
        assertEquals(Currency.CHF, Currency.valueOf("CHF"));
    }

    @Test
    @DisplayName("CNY valueOf should return CNY enum")
    void testValueOfCNY() {
        assertEquals(Currency.CNY, Currency.valueOf("CNY"));
    }

    @Test
    @DisplayName("INR valueOf should return INR enum")
    void testValueOfINR() {
        assertEquals(Currency.INR, Currency.valueOf("INR"));
    }

    @Test
    @DisplayName("MXN valueOf should return MXN enum")
    void testValueOfMXN() {
        assertEquals(Currency.MXN, Currency.valueOf("MXN"));
    }

    @Test
    @DisplayName("Invalid valueOf should throw IllegalArgumentException")
    void testInvalidValueOf() {
        assertThrows(IllegalArgumentException.class, () -> Currency.valueOf("INVALID"));
    }

    @Test
    @DisplayName("Invalid valueOf lowercase should throw IllegalArgumentException")
    void testInvalidValueOfLowercase() {
        assertThrows(IllegalArgumentException.class, () -> Currency.valueOf("usd"));
    }

    @Test
    @DisplayName("valueOf with null should throw NullPointerException")
    void testValueOfNull() {
        assertThrows(NullPointerException.class, () -> Currency.valueOf(null));
    }

    @Test
    @DisplayName("Each currency should be accessible by ordinal")
    void testCurrencyOrdinals() {
        Currency[] values = Currency.values();
        for (int i = 0; i < values.length; i++) {
            assertEquals(i, values[i].ordinal(), "Ordinal should match index for " + values[i]);
        }
    }

    @Test
    @DisplayName("compareTo should work correctly between currencies")
    void testCompareTo() {
        assertTrue(Currency.USD.compareTo(Currency.EUR) < 0, "USD should be less than EUR by ordinal");
        assertEquals(0, Currency.USD.compareTo(Currency.USD), "Same currency should compare as 0");
    }

    @Test
    @DisplayName("equals should work correctly")
    void testEquals() {
        assertEquals(Currency.USD, Currency.USD, "Same currency instance should be equal");
        assertNotEquals(Currency.USD, Currency.EUR, "Different currencies should not be equal");
    }

    @Test
    @DisplayName("hashCode should be consistent")
    void testHashCode() {
        assertEquals(Currency.USD.hashCode(), Currency.USD.hashCode(), "Same currency should have same hashCode");
        assertNotEquals(Currency.USD.hashCode(), Currency.EUR.hashCode(), "Different currencies may have different hashCodes");
    }

    @Test
    @DisplayName("toString should return currency code")
    void testToString() {
        assertEquals("USD", Currency.USD.toString());
        assertEquals("EUR", Currency.EUR.toString());
        assertEquals("GBP", Currency.GBP.toString());
    }

    @Test
    @DisplayName("name() should return currency code")
    void testName() {
        assertEquals("USD", Currency.USD.name());
        assertEquals("JPY", Currency.JPY.name());
        assertEquals("MXN", Currency.MXN.name());
    }
}