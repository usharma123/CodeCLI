package com.example.currency.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Currency Enum Tests")
class CurrencyTest {

    @Nested
    @DisplayName("Enum Values Tests")
    class EnumValuesTests {

        @Test
        @DisplayName("Should have exactly 10 currency values")
        void shouldHaveExactlyTenCurrencies() {
            assertEquals(10, Currency.values().length);
        }

        @Test
        @DisplayName("Should contain USD")
        void shouldContainUSD() {
            Currency usd = Currency.valueOf("USD");
            assertEquals(Currency.USD, usd);
        }

        @Test
        @DisplayName("Should contain EUR")
        void shouldContainEUR() {
            Currency eur = Currency.valueOf("EUR");
            assertEquals(Currency.EUR, eur);
        }

        @Test
        @DisplayName("Should contain GBP")
        void shouldContainGBP() {
            Currency gbp = Currency.valueOf("GBP");
            assertEquals(Currency.GBP, gbp);
        }

        @Test
        @DisplayName("Should contain JPY")
        void shouldContainJPY() {
            Currency jpy = Currency.valueOf("JPY");
            assertEquals(Currency.JPY, jpy);
        }

        @Test
        @DisplayName("Should contain CAD")
        void shouldContainCAD() {
            Currency cad = Currency.valueOf("CAD");
            assertEquals(Currency.CAD, cad);
        }

        @Test
        @DisplayName("Should contain AUD")
        void shouldContainAUD() {
            Currency aud = Currency.valueOf("AUD");
            assertEquals(Currency.AUD, aud);
        }

        @Test
        @DisplayName("Should contain CHF")
        void shouldContainCHF() {
            Currency chf = Currency.valueOf("CHF");
            assertEquals(Currency.CHF, chf);
        }

        @Test
        @DisplayName("Should contain CNY")
        void shouldContainCNY() {
            Currency cny = Currency.valueOf("CNY");
            assertEquals(Currency.CNY, cny);
        }

        @Test
        @DisplayName("Should contain INR")
        void shouldContainINR() {
            Currency inr = Currency.valueOf("INR");
            assertEquals(Currency.INR, inr);
        }

        @Test
        @DisplayName("Should contain MXN")
        void shouldContainMXN() {
            Currency mxn = Currency.valueOf("MXN");
            assertEquals(Currency.MXN, mxn);
        }
    }

    @Nested
    @DisplayName("ValueError Tests")
    class ValueErrorTests {

        @Test
        @DisplayName("Should throw IllegalArgumentException for invalid currency")
        void shouldThrowExceptionForInvalidCurrency() {
            assertThrows(IllegalArgumentException.class, () -> Currency.valueOf("INVALID"));
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException for lowercase currency")
        void shouldThrowExceptionForLowercaseCurrency() {
            assertThrows(IllegalArgumentException.class, () -> Currency.valueOf("usd"));
        }

        @Test
        @DisplayName("Should throw NullPointerException for null currency")
        void shouldThrowExceptionForNullCurrency() {
            assertThrows(NullPointerException.class, () -> Currency.valueOf(null));
        }
    }

    @Nested
    @DisplayName("Name Tests")
    class NameTests {

        @ParameterizedTest
        @EnumSource(Currency.class)
        @DisplayName("Should return correct name for all currencies")
        void shouldReturnCorrectNameForAllCurrencies(Currency currency) {
            assertNotNull(currency.name());
            assertTrue(currency.name().matches("[A-Z]{3}"));
        }
    }

    @Nested
    @DisplayName("HashCode Tests")
    class HashCodeTests {

        @Test
        @DisplayName("Should return consistent hashCode for same currency")
        void shouldReturnConsistentHashCode() {
            assertEquals(Currency.USD.hashCode(), Currency.USD.hashCode());
        }

        @Test
        @DisplayName("Should return same hashCode for same currency value")
        void shouldReturnSameHashCodeForSameValue() {
            Currency usd1 = Currency.valueOf("USD");
            Currency usd2 = Currency.valueOf("USD");
            assertEquals(usd1.hashCode(), usd2.hashCode());
        }
    }

    @Nested
    @DisplayName("Equality Tests")
    class EqualityTests {

        @Test
        @DisplayName("Should be equal to itself")
        void shouldBeEqualToItself() {
            assertEquals(Currency.USD, Currency.USD);
        }

        @Test
        @DisplayName("Should be equal to same currency via valueOf")
        void shouldBeEqualToSameCurrencyViaValueOf() {
            Currency usd1 = Currency.valueOf("USD");
            Currency usd2 = Currency.valueOf("USD");
            assertEquals(usd1, usd2);
        }

        @Test
        @DisplayName("Should not be equal to different currency")
        void shouldNotBeEqualToDifferentCurrency() {
            assertNotEquals(Currency.USD, Currency.EUR);
        }
    }
}
