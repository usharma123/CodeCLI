package com.example.currency.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ConversionRequest Record Tests")
class ConversionRequestTest {

    @Nested
    @DisplayName("Constructor Tests")
    class ConstructorTests {

        @Test
        @DisplayName("Should create request with valid values")
        void shouldCreateRequestWithValidValues() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            
            assertNotNull(request);
            assertEquals(100.0, request.amount());
            assertEquals(Currency.USD, request.from());
            assertEquals(Currency.EUR, request.to());
        }

        @Test
        @DisplayName("Should create request with zero amount")
        void shouldCreateRequestWithZeroAmount() {
            ConversionRequest request = new ConversionRequest(0.0, Currency.USD, Currency.EUR);
            
            assertEquals(0.0, request.amount());
        }

        @Test
        @DisplayName("Should create request with negative amount")
        void shouldCreateRequestWithNegativeAmount() {
            ConversionRequest request = new ConversionRequest(-50.0, Currency.USD, Currency.EUR);
            
            assertEquals(-50.0, request.amount());
        }

        @Test
        @DisplayName("Should create request with very large amount")
        void shouldCreateRequestWithVeryLargeAmount() {
            ConversionRequest request = new ConversionRequest(1_000_000_000.0, Currency.USD, Currency.EUR);
            
            assertEquals(1_000_000_000.0, request.amount());
        }

        @Test
        @DisplayName("Should create request with same from and to currency")
        void shouldCreateRequestWithSameCurrencies() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.USD);
            
            assertEquals(Currency.USD, request.from());
            assertEquals(Currency.USD, request.to());
        }

        @Test
        @DisplayName("Should create request with decimal amount")
        void shouldCreateRequestWithDecimalAmount() {
            ConversionRequest request = new ConversionRequest(123.456, Currency.USD, Currency.EUR);
            
            assertEquals(123.456, request.amount());
        }
    }

    @Nested
    @DisplayName("Accessor Method Tests")
    class AccessorMethodTests {

        @Test
        @DisplayName("amount() should return correct value")
        void amountShouldReturnCorrectValue() {
            ConversionRequest request = new ConversionRequest(250.75, Currency.GBP, Currency.JPY);
            
            assertEquals(250.75, request.amount());
        }

        @Test
        @DisplayName("from() should return correct currency")
        void fromShouldReturnCorrectCurrency() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.CAD, Currency.AUD);
            
            assertEquals(Currency.CAD, request.from());
        }

        @Test
        @DisplayName("to() should return correct currency")
        void toShouldReturnCorrectCurrency() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.CHF, Currency.CNY);
            
            assertEquals(Currency.CNY, request.to());
        }
    }

    @Nested
    @DisplayName("Equality Tests")
    class EqualityTests {

        @Test
        @DisplayName("Should be equal to itself")
        void shouldBeEqualToItself() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            
            assertEquals(request, request);
        }

        @Test
        @DisplayName("Should be equal to another request with same values")
        void shouldBeEqualToAnotherRequestWithSameValues() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            
            assertEquals(request1, request2);
        }

        @Test
        @DisplayName("Should not be equal to request with different amount")
        void shouldNotBeEqualToRequestWithDifferentAmount() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(200.0, Currency.USD, Currency.EUR);
            
            assertNotEquals(request1, request2);
        }

        @Test
        @DisplayName("Should not be equal to request with different from currency")
        void shouldNotBeEqualToRequestWithDifferentFromCurrency() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(100.0, Currency.GBP, Currency.EUR);
            
            assertNotEquals(request1, request2);
        }

        @Test
        @DisplayName("Should not be equal to request with different to currency")
        void shouldNotBeEqualToRequestWithDifferentToCurrency() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(100.0, Currency.USD, Currency.GBP);
            
            assertNotEquals(request1, request2);
        }

        @Test
        @DisplayName("Should not be equal to null")
        void shouldNotBeEqualToNull() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            
            assertNotEquals(null, request);
        }
    }

    @Nested
    @DisplayName("HashCode Tests")
    class HashCodeTests {

        @Test
        @DisplayName("Should return consistent hashCode")
        void shouldReturnConsistentHashCode() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            
            assertEquals(request.hashCode(), request.hashCode());
        }

        @Test
        @DisplayName("Should return same hashCode for equal objects")
        void shouldReturnSameHashCodeForEqualObjects() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            
            assertEquals(request1.hashCode(), request2.hashCode());
        }
    }

    @Nested
    @DisplayName("ToString Tests")
    class ToStringTests {

        @Test
        @DisplayName("Should return non-null string representation")
        void shouldReturnNonNullStringRepresentation() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            
            assertNotNull(request.toString());
        }

        @Test
        @DisplayName("Should contain amount in string representation")
        void shouldContainAmountInStringRepresentation() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            
            assertTrue(request.toString().contains("100.0"));
        }

        @Test
        @DisplayName("Should contain from currency in string representation")
        void shouldContainFromCurrencyInStringRepresentation() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            
            assertTrue(request.toString().contains("USD"));
        }

        @Test
        @DisplayName("Should contain to currency in string representation")
        void shouldContainToCurrencyInStringRepresentation() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            
            assertTrue(request.toString().contains("EUR"));
        }
    }
}
