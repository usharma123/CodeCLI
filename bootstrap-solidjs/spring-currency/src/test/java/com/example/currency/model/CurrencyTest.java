package com.example.currency.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Currency Enum Tests")
class CurrencyTest {

    @Nested
    @DisplayName("Currency Values Tests")
    class ValuesTests {

        @Test
        @DisplayName("should have exactly 10 currency values")
        void shouldHaveExactlyTenCurrencyValues() {
            assertEquals(10, Currency.values().length);
        }

        @Test
        @DisplayName("should contain USD currency")
        void shouldContainUSD() {
            Currency[] values = Currency.values();
            assertTrue(java.util.Arrays.stream(values).anyMatch(c -> c.name().equals("USD")));
        }

        @Test
        @DisplayName("should contain all expected currencies")
        void shouldContainAllExpectedCurrencies() {
            String[] expectedCurrencies = {"USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "MXN"};

            for (String expected : expectedCurrencies) {
                assertNotNull(Currency.valueOf(expected), "Currency " + expected + " should exist");
            }
        }

        @Test
        @DisplayName("values() should return all currencies in consistent order")
        void valuesShouldReturnAllCurrenciesInConsistentOrder() {
            Currency[] firstCall = Currency.values();
            Currency[] secondCall = Currency.values();

            assertEquals(firstCall.length, secondCall.length);
            for (int i = 0; i < firstCall.length; i++) {
                assertEquals(firstCall[i], secondCall[i]);
            }
        }
    }

    @Nested
    @DisplayName("ValueOf Tests")
    class ValueOfTests {

        @Test
        @DisplayName("valueOf should return correct currency for valid name")
        void valueOfShouldReturnCorrectCurrency() {
            assertEquals(Currency.USD, Currency.valueOf("USD"));
            assertEquals(Currency.EUR, Currency.valueOf("EUR"));
            assertEquals(Currency.GBP, Currency.valueOf("GBP"));
        }

        @Test
        @DisplayName("valueOf should throw IllegalArgumentException for invalid name")
        void valueOfShouldThrowForInvalidName() {
            assertThrows(IllegalArgumentException.class, () -> Currency.valueOf("INVALID"));
            assertThrows(IllegalArgumentException.class, () -> Currency.valueOf("usd")); // case sensitive
            assertThrows(IllegalArgumentException.class, () -> Currency.valueOf(""));
            assertThrows(IllegalArgumentException.class, () -> Currency.valueOf("DOLLAR"));
        }
    }

    @Nested
    @DisplayName("Name Method Tests")
    class NameTests {

        @Test
        @DisplayName("name() should return correct string representation")
        void nameShouldReturnCorrectStringRepresentation() {
            assertEquals("USD", Currency.USD.name());
            assertEquals("EUR", Currency.EUR.name());
            assertEquals("GBP", Currency.GBP.name());
            assertEquals("JPY", Currency.JPY.name());
        }

        @Test
        @DisplayName("all currencies should have non-null names")
        void allCurrenciesShouldHaveNonNullNames() {
            for (Currency currency : Currency.values()) {
                assertNotNull(currency.name());
                assertFalse(currency.name().isEmpty());
            }
        }
    }

    @Nested
    @DisplayName("Ordinal Method Tests")
    class OrdinalTests {

        @Test
        @DisplayName("ordinal() should return consistent values")
        void ordinalShouldReturnConsistentValues() {
            Currency[] values = Currency.values();
            for (int i = 0; i < values.length; i++) {
                assertEquals(i, values[i].ordinal());
            }
        }

        @Test
        @DisplayName("ordinal() should be unique for each currency")
        void ordinalShouldBeUniqueForEachCurrency() {
            java.util.Set<Integer> ordinals = new java.util.HashSet<>();
            for (Currency currency : Currency.values()) {
                assertTrue(ordinals.add(currency.ordinal()), "Ordinal should be unique for " + currency.name());
            }
        }
    }

    @Nested
    @DisplayName("CompareTo Tests")
    class CompareToTests {

        @Test
        @DisplayName("compareTo should follow ordinal order")
        void compareToShouldFollowOrdinalOrder() {
            Currency[] values = Currency.values();
            for (int i = 0; i < values.length - 1; i++) {
                assertTrue(values[i].compareTo(values[i + 1]) < 0);
                assertTrue(values[i + 1].compareTo(values[i]) > 0);
            }
        }

        @Test
        @DisplayName("compareTo should return 0 for same currency")
        void compareToShouldReturnZeroForSameCurrency() {
            assertEquals(0, Currency.USD.compareTo(Currency.USD));
            assertEquals(0, Currency.EUR.compareTo(Currency.EUR));
        }
    }

    @Nested
    @DisplayName("Equals and HashCode Tests")
    class EqualsHashCodeTests {

        @Test
        @DisplayName("equals should return true for same currency")
        void equalsShouldReturnTrueForSameCurrency() {
            assertTrue(Currency.USD.equals(Currency.USD));
            assertTrue(Currency.EUR.equals(Currency.EUR));
        }

        @Test
        @DisplayName("equals should return false for different currencies")
        void equalsShouldReturnFalseForDifferentCurrencies() {
            assertFalse(Currency.USD.equals(Currency.EUR));
            assertFalse(Currency.GBP.equals(Currency.JPY));
        }

        @Test
        @DisplayName("hashCode should be consistent for same currency")
        void hashCodeShouldBeConsistentForSameCurrency() {
            assertEquals(Currency.USD.hashCode(), Currency.USD.hashCode());
            assertEquals(Currency.EUR.hashCode(), Currency.EUR.hashCode());
        }
    }

    @Nested
    @DisplayName("ToString Tests")
    class ToStringTests {

        @Test
        @DisplayName("toString should return the same as name")
        void toStringShouldReturnSameAsName() {
            for (Currency currency : Currency.values()) {
                assertEquals(currency.name(), currency.toString());
            }
        }
    }
}
