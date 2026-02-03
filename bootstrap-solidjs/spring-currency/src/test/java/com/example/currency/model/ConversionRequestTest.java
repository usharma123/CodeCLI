package com.example.currency.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ConversionRequest Tests")
class ConversionRequestTest {

    @Nested
    @DisplayName("ConstructorAccessorTests")
    class ConstructorAccessorTests {

        @Test
        @DisplayName("constructor should create record with correct values")
        void constructorShouldCreateRecordWithCorrectValues() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            assertEquals(100.0, request.amount());
            assertEquals(Currency.USD, request.from());
            assertEquals(Currency.EUR, request.to());
        }

        @Test
        @DisplayName("accessor methods should return correct values for edge cases")
        void accessorMethodsShouldReturnCorrectValuesForEdgeCases() {
            ConversionRequest zeroAmount = new ConversionRequest(0.0, Currency.USD, Currency.EUR);
            assertEquals(0.0, zeroAmount.amount());

            ConversionRequest largeAmount = new ConversionRequest(Double.MAX_VALUE, Currency.JPY, Currency.GBP);
            assertEquals(Double.MAX_VALUE, largeAmount.amount());

            ConversionRequest sameCurrency = new ConversionRequest(50.0, Currency.EUR, Currency.EUR);
            assertEquals(Currency.EUR, sameCurrency.from());
            assertEquals(Currency.EUR, sameCurrency.to());
        }

        @Test
        @DisplayName("all currencies should be usable in request")
        void allCurrenciesShouldBeUsableInRequest() {
            for (Currency from : Currency.values()) {
                for (Currency to : Currency.values()) {
                    ConversionRequest request = new ConversionRequest(1.0, from, to);
                    assertEquals(from, request.from());
                    assertEquals(to, request.to());
                }
            }
        }
    }

    @Nested
    @DisplayName("EqualsHashCodeTests")
    class EqualsHashCodeTests {

        @Test
        @DisplayName("equals should return true for identical requests")
        void equalsShouldReturnTrueForIdenticalRequests() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            assertEquals(request1, request2);
        }

        @Test
        @DisplayName("equals should return false for different amounts")
        void equalsShouldReturnFalseForDifferentAmounts() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(200.0, Currency.USD, Currency.EUR);

            assertNotEquals(request1, request2);
        }

        @Test
        @DisplayName("equals should return false for different from currencies")
        void equalsShouldReturnFalseForDifferentFromCurrencies() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(100.0, Currency.EUR, Currency.EUR);

            assertNotEquals(request1, request2);
        }

        @Test
        @DisplayName("equals should return false for different to currencies")
        void equalsShouldReturnFalseForDifferentToCurrencies() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(100.0, Currency.USD, Currency.GBP);

            assertNotEquals(request1, request2);
        }

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

            assertEquals(request1, request2);
            assertEquals(request2, request1);
        }

        @Test
        @DisplayName("hashCode should be equal for equal objects")
        void hashCodeShouldBeEqualForEqualObjects() {
            ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest request2 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            assertEquals(request1.hashCode(), request2.hashCode());
        }

        @Test
        @DisplayName("equals with null should return false")
        void equalsWithNullShouldReturnFalse() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            assertNotEquals(null, request);
        }

        @Test
        @DisplayName("equals with different type should return false")
        void equalsWithDifferentTypeShouldReturnFalse() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            assertNotEquals("string", request);
        }
    }

    @Nested
    @DisplayName("ToStringTests")
    class ToStringTests {

        @Test
        @DisplayName("toString should contain all field values")
        void toStringShouldContainAllFieldValues() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            String str = request.toString();

            assertTrue(str.contains("100.0"), "Should contain amount");
            assertTrue(str.contains("USD"), "Should contain from currency");
            assertTrue(str.contains("EUR"), "Should contain to currency");
        }

        @Test
        @DisplayName("toString should be consistent")
        void toStringShouldBeConsistent() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            assertEquals(request.toString(), request.toString());
        }
    }

    @Nested
    @DisplayName("EqualsCanonicalTests")
    class EqualsCanonicalTests {

        @Test
        @DisplayName("equals should follow contract with all zero values")
        void equalsShouldFollowContractWithAllZeroValues() {
            ConversionRequest zero1 = new ConversionRequest(0.0, Currency.USD, Currency.USD);
            ConversionRequest zero2 = new ConversionRequest(0.0, Currency.USD, Currency.USD);

            assertEquals(zero1, zero2);
            assertEquals(zero1.hashCode(), zero2.hashCode());
        }

        @Test
        @DisplayName("equals should distinguish different currency pairs")
        void equalsShouldDistinguishDifferentCurrencyPairs() {
            ConversionRequest usdToEur = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionRequest eurToUsd = new ConversionRequest(100.0, Currency.EUR, Currency.USD);

            assertNotEquals(usdToEur, eurToUsd);
        }
    }
}