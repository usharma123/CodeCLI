package com.example.currency.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ConversionResponse Tests")
class ConversionResponseTest {

    @Nested
    @DisplayName("Constructor tests")
    class ConstructorTests {

        @Test
        @DisplayName("should create response with correct values")
        void shouldCreateResponseWithCorrectValues() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(92.0, response.result());
            assertEquals(0.92, response.rate());
        }

        @Test
        @DisplayName("should create response with zero values")
        void shouldCreateResponseWithZeroValues() {
            ConversionResponse response = new ConversionResponse(0.0, "USD", "USD", 0.0, 1.0);

            assertEquals(0.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("USD", response.to());
            assertEquals(0.0, response.result());
            assertEquals(1.0, response.rate());
        }

        @Test
        @DisplayName("should create response with negative values")
        void shouldCreateResponseWithNegativeValues() {
            ConversionResponse response = new ConversionResponse(-50.0, "EUR", "GBP", -42.93, 0.8587);

            assertEquals(-50.0, response.amount());
            assertEquals("EUR", response.from());
            assertEquals("GBP", response.to());
            assertEquals(-42.93, response.result());
            assertEquals(0.8587, response.rate());
        }

        @Test
        @DisplayName("should create response with large values")
        void shouldCreateResponseWithLargeValues() {
            ConversionResponse response = new ConversionResponse(999999.99, "JPY", "CHF", 12158.76, 0.012159);

            assertEquals(999999.99, response.amount());
            assertEquals("JPY", response.from());
            assertEquals("CHF", response.to());
            assertEquals(12158.76, response.result());
            assertEquals(0.012159, response.rate());
        }

        @Test
        @DisplayName("should create response with same currency conversion")
        void shouldCreateResponseWithSameCurrencyConversion() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "USD", 100.0, 1.0);

            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("USD", response.to());
            assertEquals(100.0, response.result());
            assertEquals(1.0, response.rate());
        }
    }

    @Nested
    @DisplayName("Accessor method tests")
    class AccessorTests {

        @Test
        @DisplayName("amount() should return correct value")
        void amountShouldReturnCorrectValue() {
            ConversionResponse response = new ConversionResponse(250.50, "GBP", "CAD", 230.46, 0.92);

            assertEquals(250.50, response.amount());
        }

        @Test
        @DisplayName("from() should return correct string")
        void fromShouldReturnCorrectString() {
            ConversionResponse response = new ConversionResponse(100.0, "AUD", "CNY", 456.12, 4.5612);

            assertEquals("AUD", response.from());
        }

        @Test
        @DisplayName("to() should return correct string")
        void toShouldReturnCorrectString() {
            ConversionResponse response = new ConversionResponse(100.0, "INR", "MXN", 20.62, 0.2062);

            assertEquals("MXN", response.to());
        }

        @Test
        @DisplayName("result() should return correct value")
        void resultShouldReturnCorrectValue() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            assertEquals(92.0, response.result());
        }

        @Test
        @DisplayName("rate() should return correct value")
        void rateShouldReturnCorrectValue() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            assertEquals(0.92, response.rate());
        }
    }

    @Nested
    @DisplayName("Equals and hashCode tests")
    class EqualsAndHashCodeTests {

        @Test
        @DisplayName("should be equal when same values")
        void shouldBeEqualWhenSameValues() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            assertEquals(response1, response2);
            assertEquals(response1.hashCode(), response2.hashCode());
        }

        @Test
        @DisplayName("should not be equal when different amount")
        void shouldNotBeEqualWhenDifferentAmount() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(200.0, "USD", "EUR", 184.0, 0.92);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("should not be equal when different from currency")
        void shouldNotBeEqualWhenDifferentFromCurrency() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "GBP", "EUR", 84.46, 0.8446);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("should not be equal when different to currency")
        void shouldNotBeEqualWhenDifferentToCurrency() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "GBP", 79.0, 0.79);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("should not be equal when different result")
        void shouldNotBeEqualWhenDifferentResult() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 90.0, 0.92);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("should not be equal when different rate")
        void shouldNotBeEqualWhenDifferentRate() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.90);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("should not be equal to null")
        void shouldNotBeEqualToNull() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            assertNotEquals(null, response);
        }

        @Test
        @DisplayName("should not be equal to different type")
        void shouldNotBeEqualToDifferentType() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            assertNotEquals("not a response", response);
        }
    }

    @Nested
    @DisplayName("toString tests")
    class ToStringTests {

        @Test
        @DisplayName("toString should contain all fields")
        void toStringShouldContainAllFields() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            String result = response.toString();

            assertTrue(result.contains("100.0"));
            assertTrue(result.contains("USD"));
            assertTrue(result.contains("EUR"));
            assertTrue(result.contains("92.0"));
            assertTrue(result.contains("0.92"));
        }
    }
}