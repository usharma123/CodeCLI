package com.example.currency.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Currency Tests")
class CurrencyTest {

    @Nested
    @DisplayName("Currency values count")
    class ValuesCountTests {

        @Test
        @DisplayName("should have exactly 10 currency values")
        void shouldHaveExactlyTenCurrencyValues() {
            assertEquals(10, Currency.values().length);
        }
    }

    @Nested
    @DisplayName("Currency.valueOf() tests")
    class ValueOfTests {

        @Test
        @DisplayName("should return USD for valid string USD")
        void shouldReturnUsdForValidStringUsd() {
            assertEquals(Currency.USD, Currency.valueOf("USD"));
        }

        @Test
        @DisplayName("should return EUR for valid string EUR")
        void shouldReturnEurForValidStringEur() {
            assertEquals(Currency.EUR, Currency.valueOf("EUR"));
        }

        @Test
        @DisplayName("should return GBP for valid string GBP")
        void shouldReturnGbpForValidStringGbp() {
            assertEquals(Currency.GBP, Currency.valueOf("GBP"));
        }

        @Test
        @DisplayName("should return JPY for valid string JPY")
        void shouldReturnJpyForValidStringJpy() {
            assertEquals(Currency.JPY, Currency.valueOf("JPY"));
        }

        @Test
        @DisplayName("should return CAD for valid string CAD")
        void shouldReturnCadForValidStringCad() {
            assertEquals(Currency.CAD, Currency.valueOf("CAD"));
        }

        @Test
        @DisplayName("should return AUD for valid string AUD")
        void shouldReturnAudForValidStringAud() {
            assertEquals(Currency.AUD, Currency.valueOf("AUD"));
        }

        @Test
        @DisplayName("should return CHF for valid string CHF")
        void shouldReturnChfForValidStringChf() {
            assertEquals(Currency.CHF, Currency.valueOf("CHF"));
        }

        @Test
        @DisplayName("should return CNY for valid string CNY")
        void shouldReturnCnyForValidStringCny() {
            assertEquals(Currency.CNY, Currency.valueOf("CNY"));
        }

        @Test
        @DisplayName("should return INR for valid string INR")
        void shouldReturnInrForValidStringInr() {
            assertEquals(Currency.INR, Currency.valueOf("INR"));
        }

        @Test
        @DisplayName("should return MXN for valid string MXN")
        void shouldReturnMxnForValidStringMxn() {
            assertEquals(Currency.MXN, Currency.valueOf("MXN"));
        }

        @Test
        @DisplayName("should throw IllegalArgumentException for invalid value")
        void shouldThrowIllegalArgumentExceptionForInvalidValue() {
            assertThrows(IllegalArgumentException.class, () -> Currency.valueOf("INVALID"));
        }

        @Test
        @DisplayName("should throw IllegalArgumentException for lowercase currency")
        void shouldThrowIllegalArgumentExceptionForLowercaseCurrency() {
            assertThrows(IllegalArgumentException.class, () -> Currency.valueOf("usd"));
        }

        @Test
        @DisplayName("should throw IllegalArgumentException for empty string")
        void shouldThrowIllegalArgumentExceptionForEmptyString() {
            assertThrows(IllegalArgumentException.class, () -> Currency.valueOf(""));
        }
    }

    @Nested
    @DisplayName("Currency.name() tests")
    class NameTests {

        @Test
        @DisplayName("should return correct name for USD")
        void shouldReturnCorrectNameForUsd() {
            assertEquals("USD", Currency.USD.name());
        }

        @Test
        @DisplayName("should return correct name for EUR")
        void shouldReturnCorrectNameForEur() {
            assertEquals("EUR", Currency.EUR.name());
        }

        @Test
        @DisplayName("should return correct name for all currencies")
        void shouldReturnCorrectNameForAllCurrencies() {
            String[] expectedNames = {"USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "MXN"};
            assertArrayEquals(expectedNames,
                Arrays.stream(Currency.values()).map(Currency::name).toArray());
        }
    }

    @Nested
    @DisplayName("Currency.ordinal() tests")
    class OrdinalTests {

        @Test
        @DisplayName("should have correct ordinal values")
        void shouldHaveCorrectOrdinalValues() {
            assertEquals(0, Currency.USD.ordinal());
            assertEquals(1, Currency.EUR.ordinal());
            assertEquals(2, Currency.GBP.ordinal());
            assertEquals(3, Currency.JPY.ordinal());
            assertEquals(4, Currency.CAD.ordinal());
            assertEquals(5, Currency.AUD.ordinal());
            assertEquals(6, Currency.CHF.ordinal());
            assertEquals(7, Currency.CNY.ordinal());
            assertEquals(8, Currency.INR.ordinal());
            assertEquals(9, Currency.MXN.ordinal());
        }
    }

    @Nested
    @DisplayName("Currency equality tests")
    class EqualityTests {

        @Test
        @DisplayName("should be equal to itself")
        void shouldBeEqualToItself() {
            assertEquals(Currency.USD, Currency.USD);
        }

        @Test
        @DisplayName("should not be equal to different currency")
        void shouldNotBeEqualToDifferentCurrency() {
            assertNotEquals(Currency.USD, Currency.EUR);
        }

        @Test
        @DisplayName("all currencies should have consistent hash codes")
        void allCurrenciesShouldHaveConsistentHashCodes() {
            for (Currency currency : Currency.values()) {
                assertEquals(currency.hashCode(), currency.hashCode());
            }
        }
    }
}