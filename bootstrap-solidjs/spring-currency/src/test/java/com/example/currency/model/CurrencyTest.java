package com.example.currency.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Currency Enum Tests")
class CurrencyTest {

    @Nested
    @DisplayName("Values Tests")
    class ValuesTests {

        @Test
        @DisplayName("should contain exactly 10 currency values")
        void shouldContainTenCurrencyValues() {
            assertEquals(10, Currency.values().length,
                "Currency enum should contain exactly 10 currencies");
        }

        @Test
        @DisplayName("should contain all expected currencies")
        void shouldContainAllExpectedCurrencies() {
            var currencies = Arrays.stream(Currency.values())
                .map(Currency::name)
                .toList();

            assertTrue(currencies.contains("USD"), "Should contain USD");
            assertTrue(currencies.contains("EUR"), "Should contain EUR");
            assertTrue(currencies.contains("GBP"), "Should contain GBP");
            assertTrue(currencies.contains("JPY"), "Should contain JPY");
            assertTrue(currencies.contains("CAD"), "Should contain CAD");
            assertTrue(currencies.contains("AUD"), "Should contain AUD");
            assertTrue(currencies.contains("CHF"), "Should contain CHF");
            assertTrue(currencies.contains("CNY"), "Should contain CNY");
            assertTrue(currencies.contains("INR"), "Should contain INR");
            assertTrue(currencies.contains("MXN"), "Should contain MXN");
        }
    }

    @Nested
    @DisplayName("ValueOf Tests")
    class ValueOfTests {

        @Test
        @DisplayName("valueOf should return correct currency for valid name")
        void valueOfShouldReturnCorrectCurrencyForValidName() {
            assertEquals(Currency.USD, Currency.valueOf("USD"));
            assertEquals(Currency.EUR, Currency.valueOf("EUR"));
            assertEquals(Currency.GBP, Currency.valueOf("GBP"));
            assertEquals(Currency.JPY, Currency.valueOf("JPY"));
        }

        @Test
        @DisplayName("valueOf should throw IllegalArgumentException for invalid name")
        void valueOfShouldThrowForInvalidName() {
            assertThrows(IllegalArgumentException.class,
                () -> Currency.valueOf("INVALID"));
            assertThrows(IllegalArgumentException.class,
                () -> Currency.valueOf("usd"));
            assertThrows(IllegalArgumentException.class,
                () -> Currency.valueOf(""));
        }
    }

    @Nested
    @DisplayName("Name Tests")
    class NameTests {

        @Test
        @DisplayName("name should return correct string representation")
        void nameShouldReturnCorrectStringRepresentation() {
            assertEquals("USD", Currency.USD.name());
            assertEquals("EUR", Currency.EUR.name());
            assertEquals("GBP", Currency.GBP.name());
            assertEquals("JPY", Currency.JPY.name());
        }

        @Test
        @DisplayName("all names should match enum constant names")
        void allNamesShouldMatchEnumConstantNames() {
            for (Currency currency : Currency.values()) {
                assertEquals(currency.name(), currency.name());
            }
        }
    }

    @Nested
    @DisplayName("Ordinal Tests")
    class OrdinalTests {

        @Test
        @DisplayName("ordinal should be unique for each currency")
        void ordinalShouldBeUniqueForEachCurrency() {
            var ordinals = Arrays.stream(Currency.values())
                .map(Currency::ordinal)
                .toList();

            assertEquals(10, ordinals.size());
            assertEquals(10, ordinals.stream().distinct().count(),
                "All ordinals should be unique");
        }

        @Test
        @DisplayName("USD should have ordinal 0")
        void usdShouldHaveOrdinalZero() {
            assertEquals(0, Currency.USD.ordinal());
        }
    }

    @Nested
    @DisplayName("CompareTo Tests")
    class CompareToTests {

        @Test
        @DisplayName("compareTo should order currencies by ordinal")
        void compareToShouldOrderCurrenciesByOrdinal() {
            var currencies = Currency.values();
            for (int i = 0; i < currencies.length - 1; i++) {
                assertTrue(currencies[i].compareTo(currencies[i + 1]) < 0,
                    currencies[i] + " should be less than " + currencies[i + 1]);
            }
        }

        @Test
        @DisplayName("compareTo with same currency should return 0")
        void compareToWithSameCurrencyShouldReturnZero() {
            assertEquals(0, Currency.USD.compareTo(Currency.USD));
            assertEquals(0, Currency.EUR.compareTo(Currency.EUR));
        }
    }

    @Nested
    @DisplayName("EqualsHashCode Tests")
    class EqualsHashCodeTests {

        @Test
        @DisplayName("equals should return true for same currency")
        void equalsShouldReturnTrueForSameCurrency() {
            assertEquals(Currency.USD, Currency.USD);
            assertEquals(Currency.EUR, Currency.EUR);
        }

        @Test
        @DisplayName("equals should return false for different currencies")
        void equalsShouldReturnFalseForDifferentCurrencies() {
            assertNotEquals(Currency.USD, Currency.EUR);
            assertNotEquals(Currency.GBP, Currency.JPY);
        }

        @Test
        @DisplayName("hashCode should be consistent for same currency")
        void hashCodeShouldBeConsistentForSameCurrency() {
            assertEquals(Currency.USD.hashCode(), Currency.USD.hashCode());
            assertEquals(Currency.EUR.hashCode(), Currency.EUR.hashCode());
        }

        @Test
        @DisplayName("hashCode for different currencies should not be equal")
        void hashCodeForDifferentCurrenciesShouldNotBeEqual() {
            assertNotEquals(Currency.USD.hashCode(), Currency.EUR.hashCode());
        }
    }

    @Nested
    @DisplayName("ToString Tests")
    class ToStringTests {

        @Test
        @DisplayName("toString should return the same as name")
        void toStringShouldReturnSameAsName() {
            assertEquals(Currency.USD.name(), Currency.USD.toString());
            assertEquals(Currency.EUR.name(), Currency.EUR.toString());
        }
    }
}