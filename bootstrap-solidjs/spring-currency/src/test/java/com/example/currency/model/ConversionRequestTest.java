package com.example.currency.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ConversionRequest Tests")
class ConversionRequestTest {

    @Nested
    @DisplayName("Constructor tests")
    class ConstructorTests {

        @Test
        @DisplayName("should create request with correct values")
        void shouldCreateRequestWithCorrectValues() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            assertEquals(100.0, request.amount());
            assertEquals(Currency.USD, request.from());
            assertEquals(Currency.EUR, request.to());
        }

        @Test
        @DisplayName("should create request with zero amount")
        void shouldCreateRequestWithZeroAmount() {
            ConversionRequest request = new ConversionRequest(0.0, Currency.USD, Currency.EUR);

            assertEquals(0.0, request.amount());
            assertEquals(Currency.USD, request.from());
            assertEquals(Currency.EUR, request.to());
        }

        @Test
        @DisplayName("should create request with negative amount")
        void shouldCreateRequestWithNegativeAmount() {
            ConversionRequest request = new ConversionRequest(-50.0, Currency.JPY, Currency.CHF);

            assertEquals(-50.0, request.amount());
            assertEquals(Currency.JPY, request.from());
            assertEquals(Currency.CHF, request.to());
        }

        @Test
        @DisplayName("should create request with large amount")
        void shouldCreateRequestWithLargeAmount() {
            ConversionRequest request = new ConversionRequest(999999.99, Currency.CAD, Currency.AUD);

            assertEquals(999999.99, request.amount());
            assertEquals(Currency.CAD, request.from());
            assertEquals(Currency.AUD, request.to());
        }

        @Test
        @DisplayName("should create request with same currency")
        void shouldCreateRequestWithSameCurrency() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.USD);

            assertEquals(100.0, request.amount());
            assertEquals(Currency.USD, request.from());
            assertEquals(Currency.USD, request.to());
        }
    }

    @Nested
    @DisplayName("Accessor method tests")
    class AccessorTests {

        

        @Test
        @DisplayName("to() should return correct currency")
        void toShouldReturnCorrectCurrency() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.CHF, Currency.MXN);

            assertEquals(Currency.MXN, request.to());
        }
    }

    @Nested
    @DisplayName("Equals and hashCode tests")
    
    class EqualsAndHashCodeTests {

        @Test
        @DisplayName("should be equal when same values")
        void shouldBeEqualWhenSameValues() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            assertEquals(request1, request2);
            assertEquals(request1.hashCode(), request2.hashCode());
        }

        @Test
        @DisplayName("should not be equal when different amount")
        void shouldNotBeEqualWhenDifferentAmount() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(200.0, Currency.USD, Currency.EUR);

            assertNotEquals(request1, request2);
        }

        @Test
        @DisplayName("should not be equal when different from currency")
        void shouldNotBeEqualWhenDifferentFromCurrency() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(100.0, Currency.GBP, Currency.EUR);

            assertNotEquals(request1, request2);
        }

        @Test
        @DisplayName("should not be equal when different to currency")
        void shouldNotBeEqualWhenDifferentToCurrency() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(100.0, Currency.USD, Currency.GBP);

            assertNotEquals(request1, request2);
        }

        @Test
        @DisplayName("should not be equal to null")
        void shouldNotBeEqualToNull() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            assertNotEquals(null, request);
        }

        @Test
        @DisplayName("should not be equal to different type")
        void shouldNotBeEqualToDifferentType() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            assertNotEquals("not a request", request);
        }
    }

    @Nested
    @DisplayName("toString tests")
    class ToStringTests {

        @Test
        @DisplayName("toString should contain all fields")
        void toStringShouldContainAllFields() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            String result = request.toString();

            assertTrue(result.contains("100.0"));
            assertTrue(result.contains("USD"));
            assertTrue(result.contains("EUR"));
        }
    }

    @Nested
    @DisplayName("Record accessor tests")
    
    class RecordAccessorTests {

        @Test
        @DisplayName("should support record accessors with positional arguments")
        void shouldSupportRecordAccessorsWithPositionalArguments() {
            ConversionRequest request = new ConversionRequest(42.5, Currency.JPY, Currency.CHF);

            assertEquals(42.5, request.amount());
            assertEquals(Currency.JPY, request.from());
            assertEquals(Currency.CHF, request.to());
        }

        @Test
        @DisplayName("should allow multiple currency types")
        void shouldAllowMultipleCurrencyTypes() {
            ConversionRequest usdEur = new ConversionRequest(50.0, Currency.USD, Currency.EUR);
            ConversionRequest gbpJpy = new ConversionRequest(75.0, Currency.GBP, Currency.JPY);
            ConversionRequest cnyMxn = new ConversionRequest(30.0, Currency.CNY, Currency.MXN);

            assertEquals(Currency.EUR, usdEur.to());
            assertEquals(Currency.JPY, gbpJpy.to());
            assertEquals(Currency.MXN, cnyMxn.to());
        }
    }
}
