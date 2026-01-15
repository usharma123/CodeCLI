package com.example.currency.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Objects;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ConversionRequest Record Tests")
class ConversionRequestTest {

    @Nested
    @DisplayName("Constructor and Accessor Tests")
    class ConstructorAccessorTests {

        @Test
        @DisplayName("should create record with correct values")
        void shouldCreateRecordWithCorrectValues() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            assertEquals(100.0, request.amount());
            assertEquals(Currency.USD, request.from());
            assertEquals(Currency.EUR, request.to());
        }

        @Test
        @DisplayName("should handle zero amount")
        void shouldHandleZeroAmount() {
            ConversionRequest request = new ConversionRequest(0.0, Currency.USD, Currency.EUR);

            assertEquals(0.0, request.amount());
            assertEquals(Currency.USD, request.from());
            assertEquals(Currency.EUR, request.to());
        }

        @Test
        @DisplayName("should handle negative amount")
        void shouldHandleNegativeAmount() {
            ConversionRequest request = new ConversionRequest(-50.0, Currency.EUR, Currency.GBP);

            assertEquals(-50.0, request.amount());
            assertEquals(Currency.EUR, request.from());
            assertEquals(Currency.GBP, request.to());
        }

        @Test
        @DisplayName("should handle large amount")
        void shouldHandleLargeAmount() {
            ConversionRequest request = new ConversionRequest(1_000_000.0, Currency.JPY, Currency.CHF);

            assertEquals(1_000_000.0, request.amount());
            assertEquals(Currency.JPY, request.from());
            assertEquals(Currency.CHF, request.to());
        }

        @Test
        @DisplayName("should handle same source and target currency")
        void shouldHandleSameSourceAndTargetCurrency() {
            ConversionRequest request = new ConversionRequest(50.0, Currency.USD, Currency.USD);

            assertEquals(50.0, request.amount());
            assertEquals(Currency.USD, request.from());
            assertEquals(Currency.USD, request.to());
        }

        @Test
        @DisplayName("should handle decimal amounts")
        void shouldHandleDecimalAmounts() {
            ConversionRequest request = new ConversionRequest(99.99, Currency.GBP, Currency.CAD);

            assertEquals(99.99, request.amount());
            assertEquals(Currency.GBP, request.from());
            assertEquals(Currency.CAD, request.to());
        }
    }

    @Nested
    @DisplayName("Equals and HashCode Tests")
    class EqualsHashCodeTests {

        @Test
        @DisplayName("equals should return true for identical records")
        void equalsShouldReturnTrueForIdenticalRecords() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            assertEquals(request1, request2);
            assertEquals(request1.hashCode(), request2.hashCode());
        }

        @Test
        @DisplayName("equals should return false for different amounts")
        void equalsShouldReturnFalseForDifferentAmounts() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(200.0, Currency.USD, Currency.EUR);

            assertNotEquals(request1, request2);
        }

        @Test
        @DisplayName("equals should return false for different source currencies")
        void equalsShouldReturnFalseForDifferentSourceCurrencies() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(100.0, Currency.EUR, Currency.EUR);

            assertNotEquals(request1, request2);
        }

        @Test
        @DisplayName("equals should return false for different target currencies")
        void equalsShouldReturnFalseForDifferentTargetCurrencies() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(100.0, Currency.USD, Currency.GBP);

            assertNotEquals(request1, request2);
        }

        @Test
        @DisplayName("equals should return false for null")
        void equalsShouldReturnFalseForNull() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            assertNotEquals(null, request);
        }

        @Test
        @DisplayName("equals should return false for different type")
        void equalsShouldReturnFalseForDifferentType() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            assertNotEquals("string", request);
            assertNotEquals(100, request);
        }

        @Test
        @DisplayName("hashCode should be consistent")
        void hashCodeShouldBeConsistent() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            int firstHash = request.hashCode();
            int secondHash = request.hashCode();

            assertEquals(firstHash, secondHash);
        }

        @Test
        @DisplayName("hashCode consistency with equals")
        void hashCodeConsistencyWithEquals() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            if (request1.equals(request2)) {
                assertEquals(request1.hashCode(), request2.hashCode());
            }
        }
    }

    @Nested
    @DisplayName("ToString Tests")
    class ToStringTests {

        @Test
        @DisplayName("toString should contain all field values")
        void toStringShouldContainAllFieldValues() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            String str = request.toString();

            assertTrue(str.contains("100.0"));
            assertTrue(str.contains("USD"));
            assertTrue(str.contains("EUR"));
        }

        @Test
        @DisplayName("toString should be consistent")
        void toStringShouldBeConsistent() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            assertEquals(request.toString(), request.toString());
        }

        @Test
        @DisplayName("toString for different records should be different")
        void toStringForDifferentRecordsShouldBeDifferent() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(200.0, Currency.USD, Currency.EUR);

            assertNotEquals(request1.toString(), request2.toString());
        }
    }

    @Nested
    @DisplayName("Equals Canonical Tests")
    class EqualsCanonicalTests {

        @Test
        @DisplayName("equals should be reflexive")
        void equalsShouldBeReflexive() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            assertEquals(request, request);
        }

        @Test
        @DisplayName("equals should be symmetric")
        void equalsShouldBeSymmetric() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            assertEquals(request1.equals(request2), request2.equals(request1));
        }

        @Test
        @DisplayName("equals should be transitive")
        void equalsShouldBeTransitive() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request3 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            assertEquals(request1.equals(request2), request2.equals(request3));
            assertEquals(request1.equals(request2), request1.equals(request3));
        }
    }
}
