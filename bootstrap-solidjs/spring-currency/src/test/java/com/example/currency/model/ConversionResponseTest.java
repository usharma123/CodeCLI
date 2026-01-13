package com.example.currency.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ConversionResponseTest {

    @Nested
    @DisplayName("ConstructorTests")
    class ConstructorTests {

        @Test
        @DisplayName("should create response with valid values")
        void shouldCreateResponseWithValidValues() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 85.0, 0.85);

            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(85.0, response.result());
            assertEquals(0.85, response.rate());
        }

        @Test
        @DisplayName("should create response with zero values")
        void shouldCreateResponseWithZeroValues() {
            ConversionResponse response = new ConversionResponse(0.0, "USD", "EUR", 0.0, 0.0);

            assertEquals(0.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(0.0, response.result());
            assertEquals(0.0, response.rate());
        }

        @Test
        @DisplayName("should create response with large values")
        void shouldCreateResponseWithLargeValues() {
            ConversionResponse response = new ConversionResponse(9999999.99, "USD", "JPY", 1499999.9985, 150.0);

            assertEquals(9999999.99, response.amount());
            assertEquals("USD", response.from());
            assertEquals("JPY", response.to());
            assertEquals(1499999.9985, response.result());
            assertEquals(150.0, response.rate());
        }

        @Test
        @DisplayName("should create response with decimal values")
        void shouldCreateResponseWithDecimalValues() {
            ConversionResponse response = new ConversionResponse(123.456, "USD", "GBP", 98.765, 0.8);

            assertEquals(123.456, response.amount());
            assertEquals("USD", response.from());
            assertEquals("GBP", response.to());
            assertEquals(98.765, response.result());
            assertEquals(0.8, response.rate());
        }
    }

    @Nested
    @DisplayName("AccessorMethodTests")
    class AccessorMethodTests {

        @Test
        @DisplayName("from should return correct currency string")
        void fromShouldReturnCorrectCurrencyString() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 85.0, 0.85);
            assertEquals("USD", response.from());
        }

        @Test
        @DisplayName("to should return correct currency string")
        void toShouldReturnCorrectCurrencyString() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 85.0, 0.85);
            assertEquals("EUR", response.to());
        }

        @Test
        @DisplayName("result should return correct converted amount")
        void resultShouldReturnCorrectConvertedAmount() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 85.0, 0.85);
            assertEquals(85.0, response.result());
        }

        @Test
        @DisplayName("rate should return correct exchange rate")
        void rateShouldReturnCorrectExchangeRate() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 85.0, 0.85);
            assertEquals(0.85, response.rate());
        }

        @Test
        @DisplayName("amount should return correct value")
        void amountShouldReturnCorrectValue() {
            ConversionResponse response = new ConversionResponse(250.75, "USD", "EUR", 230.69, 0.92);
            assertEquals(250.75, response.amount());
        }
    }

    @Nested
    @DisplayName("EqualityTests")
    class EqualityTests {

        @Test
        @DisplayName("should be equal to another response with same values")
        void shouldBeEqualToAnotherResponseWithSameValues() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 85.0, 0.85);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 85.0, 0.85);

            assertEquals(response1, response2);
        }

        @Test
        @DisplayName("should not be equal to response with different amount")
        void shouldNotBeEqualToResponseWithDifferentAmount() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 85.0, 0.85);
            ConversionResponse response2 = new ConversionResponse(200.0, "USD", "EUR", 85.0, 0.85);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("should not be equal to response with different from currency")
        void shouldNotBeEqualToResponseWithDifferentFromCurrency() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 85.0, 0.85);
            ConversionResponse response2 = new ConversionResponse(100.0, "GBP", "EUR", 85.0, 0.85);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("should not be equal to response with different to currency")
        void shouldNotBeEqualToResponseWithDifferentToCurrency() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 85.0, 0.85);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "GBP", 85.0, 0.85);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("should not be equal to response with different result")
        void shouldNotBeEqualToResponseWithDifferentResult() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 85.0, 0.85);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 95.0, 0.85);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("should not be equal to response with different rate")
        void shouldNotBeEqualToResponseWithDifferentRate() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 85.0, 0.85);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 85.0, 0.95);

            assertNotEquals(response1, response2);
        }
    }

    @Nested
    @DisplayName("HashCodeTests")
    class HashCodeTests {

        @Test
        @DisplayName("should have same hash code for equal responses")
        void shouldHaveSameHashCodeForEqualResponses() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 85.0, 0.85);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 85.0, 0.85);

            assertEquals(response1.hashCode(), response2.hashCode());
        }
    }

    @Nested
    @DisplayName("ToStringTests")
    class ToStringTests {

        @Test
        @DisplayName("should contain result in string representation")
        void shouldContainResultInStringRepresentation() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 85.0, 0.85);
            String str = response.toString();

            assertTrue(str.contains("85.0"));
        }

        @Test
        @DisplayName("should contain rate in string representation")
        void shouldContainRateInStringRepresentation() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 85.0, 0.85);
            String str = response.toString();

            assertTrue(str.contains("0.85"));
        }
    }

    @Nested
    @DisplayName("ResponseConsistencyTests")
    class ResponseConsistencyTests {

        @Test
        @DisplayName("should have consistent rate and result relationship")
        void shouldHaveConsistentRateAndResultRelationship() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            double expectedResult = Math.round(response.amount() * response.rate() * 100.0) / 100.0;
            assertEquals(expectedResult, response.result());
        }

        @Test
        @DisplayName("should preserve from currency string in response")
        void shouldPreserveFromCurrencyString() {
            ConversionResponse response = new ConversionResponse(100.0, "GBP", "EUR", 85.0, 0.85);
            assertEquals("GBP", response.from());
        }

        @Test
        @DisplayName("should preserve to currency string in response")
        void shouldPreserveToCurrencyString() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "JPY", 15000.0, 150.0);
            assertEquals("JPY", response.to());
        }
    }
}

