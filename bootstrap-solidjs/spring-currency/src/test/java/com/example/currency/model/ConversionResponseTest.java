package com.example.currency.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ConversionResponse Tests")
class ConversionResponseTest {

    @Nested
    @DisplayName("ConstructorAccessorTests")
    class ConstructorAccessorTests {

        @Test
        @DisplayName("constructor should create record with correct values")
        void constructorShouldCreateRecordWithCorrectValues() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(92.0, response.result());
            assertEquals(0.92, response.rate());
        }

        @Test
        @DisplayName("accessor methods should return correct values for edge cases")
        void accessorMethodsShouldReturnCorrectValuesForEdgeCases() {
            ConversionResponse zeroResponse = new ConversionResponse(0.0, "USD", "EUR", 0.0, 0.92);
            assertEquals(0.0, zeroResponse.amount());
            assertEquals(0.0, zeroResponse.result());

            ConversionResponse largeValues = new ConversionResponse(
                Double.MAX_VALUE, "USD", "EUR", Double.MAX_VALUE * 0.92, 0.92);
            assertEquals(Double.MAX_VALUE, largeValues.amount());
        }

        @Test
        @DisplayName("from and to should be string representations of currencies")
        void fromAndToShouldBeStringRepresentationsOfCurrencies() {
            for (Currency from : Currency.values()) {
                for (Currency to : Currency.values()) {
                    ConversionResponse response = new ConversionResponse(
                        1.0, from.name(), to.name(), 1.0, 1.0);
                    assertEquals(from.name(), response.from());
                    assertEquals(to.name(), response.to());
                }
            }
        }

        @Test
        @DisplayName("should handle same currency conversion with rate 1.0")
        void shouldHandleSameCurrencyConversionWithRateOne() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "USD", 100.0, 1.0);

            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("USD", response.to());
            assertEquals(100.0, response.result());
            assertEquals(1.0, response.rate());
        }
    }

    @Nested
    @DisplayName("EqualsHashCodeTests")
    class EqualsHashCodeTests {

        @Test
        @DisplayName("equals should return true for identical responses")
        void equalsShouldReturnTrueForIdenticalResponses() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            assertEquals(response1, response2);
        }

        @Test
        @DisplayName("equals should return false for different amounts")
        void equalsShouldReturnFalseForDifferentAmounts() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(200.0, "USD", "EUR", 184.0, 0.92);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("equals should return false for different from currencies")
        void equalsShouldReturnFalseForDifferentFromCurrencies() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "EUR", "EUR", 100.0, 1.0);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("equals should return false for different to currencies")
        void equalsShouldReturnFalseForDifferentToCurrencies() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "GBP", 79.0, 0.79);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("equals should return false for different results")
        void equalsShouldReturnFalseForDifferentResults() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 91.0, 0.92);

            assertNotEquals(response1, response2);
        }

        @Test
        @DisplayName("equals should return false for different rates")
        void equalsShouldReturnFalseForDifferentRates() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.91);

            assertNotEquals(response1, response2);
        }

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

            assertEquals(response1, response2);
            assertEquals(response2, response1);
        }

        @Test
        @DisplayName("hashCode should be equal for equal objects")
        void hashCodeShouldBeEqualForEqualObjects() {
            ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            assertEquals(response1.hashCode(), response2.hashCode());
        }

        @Test
        @DisplayName("equals with null should return false")
        void equalsWithNullShouldReturnFalse() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            assertNotEquals(null, response);
        }

        @Test
        @DisplayName("equals with different type should return false")
        void equalsWithDifferentTypeShouldReturnFalse() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            assertNotEquals("string", response);
        }
    }

    @Nested
    @DisplayName("ToStringTests")
    class ToStringTests {

        @Test
        @DisplayName("toString should contain all field values")
        void toStringShouldContainAllFieldValues() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            String str = response.toString();

            assertTrue(str.contains("100.0"), "Should contain amount");
            assertTrue(str.contains("USD"), "Should contain from currency");
            assertTrue(str.contains("EUR"), "Should contain to currency");
            assertTrue(str.contains("92.0"), "Should contain result");
            assertTrue(str.contains("0.92"), "Should contain rate");
        }

        @Test
        @DisplayName("toString should be consistent")
        void toStringShouldBeConsistent() {
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            assertEquals(response.toString(), response.toString());
        }
    }

    @Nested
    @DisplayName("EqualsCanonicalTests")
    class EqualsCanonicalTests {

        @Test
        @DisplayName("equals should follow contract with all zero values")
        void equalsShouldFollowContractWithAllZeroValues() {
            ConversionResponse zero1 = new ConversionResponse(0.0, "USD", "USD", 0.0, 1.0);
            ConversionResponse zero2 = new ConversionResponse(0.0, "USD", "USD", 0.0, 1.0);

            assertEquals(zero1, zero2);
            assertEquals(zero1.hashCode(), zero2.hashCode());
        }

        @Test
        @DisplayName("equals should distinguish different currency pairs")
        void equalsShouldDistinguishDifferentCurrencyPairs() {
            ConversionResponse usdToEur = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
            ConversionResponse eurToUsd = new ConversionResponse(100.0, "EUR", "USD", 108.7, 1.087);

            assertNotEquals(usdToEur, eurToUsd);
        }
    }
}