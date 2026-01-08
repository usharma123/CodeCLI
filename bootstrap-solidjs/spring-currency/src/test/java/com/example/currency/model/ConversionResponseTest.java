package com.example.currency.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ConversionResponse Record Tests")
class ConversionResponseTest {

    @Nested
    @DisplayName("Constructor Tests")
    class ConstructorTests {

        @Test
        @DisplayName("Should create response with valid values")
        void shouldCreateResponseWithValidValues() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            
            assertNotNull(response);
            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(92.0, response.result());
            assertEquals(0.92, response.rate());
        }

        @Test
        @DisplayName("Should create response with zero values")
        void shouldCreateResponseWithZeroValues() {
            ConversionResponse response = new ConversionResponse(0.0, "USD", "EUR", 0.0, 0.0);
            
            assertEquals(0.0, response.amount());
            assertEquals(0.0, response.result());
            assertEquals(0.0, response.rate());
        }

        @Test
        @DisplayName("Should create response with large values")
        void shouldCreateResponseWithLargeValues() {
            ConversionResponse response = new ConversionResponse(1_000_000.0, "USD", "JPY", 149_500_000.0, 149.50);
            
            assertEquals(1_000_000.0, response.amount());
            assertEquals(149_500_000.0, response.result());
        }

        @Test
        @DisplayName("Should create response with decimal values")
        void shouldCreateResponseWithDecimalValues() {
            ConversionResponse response = new ConversionResponse(123.45, "USD", "EUR", 113.57, 0.92);
            
            assertEquals(123.45, response.amount());
            assertEquals(113.57, response.result());
        }
    }

    @Nested
    @DisplayName("Accessor Method Tests")
    class AccessorMethodTests {

        @Test
        @DisplayName("amount() should return correct value")
        void amountShouldReturnCorrectValue() {
            ConversionResponse response = new ConversionResponse(250.0, "GBP", "JPY", 46875.0, 187.50);
            
            assertEquals(250.0, response.amount());
        }

        @Test
        @DisplayName("from() should return correct currency string")
        void fromShouldReturnCorrectCurrencyString() {
            ConversionResponse response = new ConversionResponse(100.0, "CAD", "AUD", 113.33, 1.1333);
            
            assertEquals("CAD", response.from());
        }

        @Test
        @DisplayName("to() should return correct currency string")
        void toShouldReturnCorrectCurrencyString() {
            ConversionResponse response = new ConversionResponse(100.0, "CHF", "CNY", 822.73, 8.2273);
            
            assertEquals("CNY", response.to());
        }

        @Test
        @DisplayName("result() should return correct converted amount")
        void resultShouldReturnCorrectConvertedAmount() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            
            assertEquals(92.0, response.result());
        }

        @Test
        @DisplayName("rate() should return correct exchange rate")
        void rateShouldReturnCorrectExchangeRate() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            
            assertEquals(0.92, response.rate());
        }
    }

    @Nested
    @DisplayName("Equality Tests")
    class EqualityTests {

        @Test
        @DisplayName("Should be equal to itself")
        void shouldBeEqualToItself() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            
            assertEquals(response, response);
        }

        @Test
        @DisplayName("Should be equal to another response with same values")
        void shouldBeEqualToAnotherResponseWithSameValues() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            
            assertEquals(response1, response2);
        }

        @Test
        @DisplayName("Should not be equal to response with different amount")
        void shouldNotBeEqualToResponseWithDifferentAmount() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(200.0, "USD", "EUR", 92.0, 0.92);
            
            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("Should not be equal to response with different from currency")
        void shouldNotBeEqualToResponseWithDifferentFromCurrency() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "GBP", "EUR", 92.0, 0.92);
            
            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("Should not be equal to response with different to currency")
        void shouldNotBeEqualToResponseWithDifferentToCurrency() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "GBP", 92.0, 0.92);
            
            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("Should not be equal to response with different result")
        void shouldNotBeEqualToResponseWithDifferentResult() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 93.0, 0.92);
            
            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("Should not be equal to response with different rate")
        void shouldNotBeEqualToResponseWithDifferentRate() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.93);
            
            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("Should not be equal to null")
        void shouldNotBeEqualToNull() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            
            assertNotEquals(null, response);
        }
    }

    @Nested
    @DisplayName("HashCode Tests")
    class HashCodeTests {

        @Test
        @DisplayName("Should return consistent hashCode")
        void shouldReturnConsistentHashCode() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            
            assertEquals(response.hashCode(), response.hashCode());
        }

        @Test
        @DisplayName("Should return same hashCode for equal objects")
        void shouldReturnSameHashCodeForEqualObjects() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            
            assertEquals(response1.hashCode(), response2.hashCode());
        }
    }

    @Nested
    @DisplayName("ToString Tests")
    class ToStringTests {

        @Test
        @DisplayName("Should return non-null string representation")
        void shouldReturnNonNullStringRepresentation() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            
            assertNotNull(response.toString());
        }

        @Test
        @DisplayName("Should contain amount in string representation")
        void shouldContainAmountInStringRepresentation() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            
            assertTrue(response.toString().contains("100.0"));
        }

        @Test
        @DisplayName("Should contain from currency in string representation")
        void shouldContainFromCurrencyInStringRepresentation() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            
            assertTrue(response.toString().contains("USD"));
        }

        @Test
        @DisplayName("Should contain to currency in string representation")
        void shouldContainToCurrencyInStringRepresentation() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            
            assertTrue(response.toString().contains("EUR"));
        }

        @Test
        @DisplayName("Should contain result in string representation")
        void shouldContainResultInStringRepresentation() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            
            assertTrue(response.toString().contains("92.0"));
        }

        @Test
        @DisplayName("Should contain rate in string representation")
        void shouldContainRateInStringRepresentation() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            
            assertTrue(response.toString().contains("0.92"));
        }
    }
}
