package com.example.currency.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ConversionResponse Record Tests")
class ConversionResponseTest {

    @Nested
    @DisplayName("Constructor and Accessor Tests")
    class ConstructorAccessorTests {

        @Test
        @DisplayName("should create record with correct values")
        void shouldCreateRecordWithCorrectValues() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(92.0, response.result());
            assertEquals(0.92, response.rate());
        }

        @Test
        @DisplayName("should handle zero values")
        void shouldHandleZeroValues() {
            ConversionResponse response = new ConversionResponse(0.0, "USD", "USD", 0.0, 1.0);

            assertEquals(0.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("USD", response.to());
            assertEquals(0.0, response.result());
            assertEquals(1.0, response.rate());
        }

        @Test
        @DisplayName("should handle negative result")
        void shouldHandleNegativeResult() {
            ConversionResponse response = new ConversionResponse(-100.0, "USD", "EUR", -92.0, 0.92);

            assertEquals(-100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(-92.0, response.result());
            assertEquals(0.92, response.rate());
        }

        @Test
        @DisplayName("should handle large values")
        void shouldHandleLargeValues() {
            ConversionResponse response = new ConversionResponse(1_000_000.0, "USD", "JPY", 149_500_000.0, 149.5);

            assertEquals(1_000_000.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("JPY", response.to());
            assertEquals(149_500_000.0, response.result()); // After rounding
            assertEquals(149.5, response.rate());
        }

        @Test
        @DisplayName("should handle same currency conversion")
        void shouldHandleSameCurrencyConversion() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "USD", 100.0, 1.0);

            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("USD", response.to());
            assertEquals(100.0, response.result());
            assertEquals(1.0, response.rate());
        }

        @Test
        @DisplayName("should handle decimal values")
        void shouldHandleDecimalValues() {
            ConversionResponse response = new ConversionResponse(99.99, "EUR", "GBP", 85.49, 0.855);

            assertEquals(99.99, response.amount());
            assertEquals("EUR", response.from());
            assertEquals("GBP", response.to());
            assertEquals(85.49, response.result());
            assertEquals(0.855, response.rate());
        }

        @Test
        @DisplayName("should handle different currency strings")
        void shouldHandleDifferentCurrencyStrings() {
            ConversionResponse response = new ConversionResponse(100.0, "JPY", "CNY", 4.39, 0.0439);

            assertEquals(100.0, response.amount());
            assertEquals("JPY", response.from());
            assertEquals("CNY", response.to());
            assertEquals(4.39, response.result());
            assertEquals(0.0439, response.rate());
        }
    }

    @Nested
    @DisplayName("Equals and HashCode Tests")
    class EqualsHashCodeTests {

        @Test
        @DisplayName("equals should return true for identical records")
        void equalsShouldReturnTrueForIdenticalRecords() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            assertEquals(response1, response2);
            assertEquals(response1.hashCode(), response2.hashCode());
        }

        @Test
        @DisplayName("equals should return false for different amounts")
        void equalsShouldReturnFalseForDifferentAmounts() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(200.0, "USD", "EUR", 92.0, 0.92);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("equals should return false for different from currencies")
        void equalsShouldReturnFalseForDifferentFromCurrencies() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "EUR", "EUR", 92.0, 0.92);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("equals should return false for different to currencies")
        void equalsShouldReturnFalseForDifferentToCurrencies() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "GBP", 92.0, 0.92);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("equals should return false for different results")
        void equalsShouldReturnFalseForDifferentResults() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 93.0, 0.92);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("equals should return false for different rates")
        void equalsShouldReturnFalseForDifferentRates() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.93);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("equals should return false for null")
        void equalsShouldReturnFalseForNull() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            assertNotEquals(null, response);
        }

        @Test
        @DisplayName("equals should return false for different type")
        void equalsShouldReturnFalseForDifferentType() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            assertNotEquals("string", response);
            assertNotEquals(100, response);
        }

        @Test
        @DisplayName("hashCode should be consistent")
        void hashCodeShouldBeConsistent() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            int firstHash = response.hashCode();
            int secondHash = response.hashCode();

            assertEquals(firstHash, secondHash);
        }

        @Test
        @DisplayName("hashCode consistency with equals")
        void hashCodeConsistencyWithEquals() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            if (response1.equals(response2)) {
                assertEquals(response1.hashCode(), response2.hashCode());
            }
        }
    }

    @Nested
    @DisplayName("ToString Tests")
    class ToStringTests {

        @Test
        @DisplayName("toString should contain all field values")
        void toStringShouldContainAllFieldValues() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            String str = response.toString();

            assertTrue(str.contains("100.0"));
            assertTrue(str.contains("USD"));
            assertTrue(str.contains("EUR"));
            assertTrue(str.contains("92.0"));
            assertTrue(str.contains("0.92"));
        }

        @Test
        @DisplayName("toString should be consistent")
        void toStringShouldBeConsistent() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            assertEquals(response.toString(), response.toString());
        }

        @Test
        @DisplayName("toString for different records should be different")
        void toStringForDifferentRecordsShouldBeDifferent() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "GBP", 79.0, 0.79);

            assertNotEquals(response1.toString(), response2.toString());
        }
    }

    @Nested
    @DisplayName("Equals Canonical Tests")
    class EqualsCanonicalTests {

        @Test
        @DisplayName("equals should be reflexive")
        void equalsShouldBeReflexive() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            assertEquals(response, response);
        }

        @Test
        @DisplayName("equals should be symmetric")
        void equalsShouldBeSymmetric() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            assertEquals(response1.equals(response2), response2.equals(response1));
        }

        @Test
        @DisplayName("equals should be transitive")
        void equalsShouldBeTransitive() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response3 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            assertEquals(response1.equals(response2), response2.equals(response3));
            assertEquals(response1.equals(response2), response1.equals(response3));
        }
    }
}
