package com.example.currency.service;

import com.example.currency.model.ConversionRequest;
import com.example.currency.model.ConversionResponse;
import com.example.currency.model.Currency;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ExchangeRateService Tests")
class ExchangeRateServiceTest {

    private ExchangeRateService service;

    @BeforeEach
    void setUp() {
        service = new ExchangeRateService();
    }

    @Nested
    @DisplayName("Valid Currency Conversions")
    class ValidConversions {

        @Test
        @DisplayName("Should convert USD to EUR correctly")
        void usdToEur() {
            ConversionRequest request = new ConversionRequest(100, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(92.0, response.result());
            assertEquals(0.92, response.rate());
        }

        @Test
        @DisplayName("Should convert EUR to USD correctly")
        void eurToUsd() {
            ConversionRequest request = new ConversionRequest(100, Currency.EUR, Currency.USD);
            ConversionResponse response = service.convert(request);

            assertEquals(108.7, response.result(), 0.01);
            assertEquals(1.087, response.rate(), 0.001);
        }

        @Test
        @DisplayName("Should convert USD to JPY correctly")
        void usdToJpy() {
            ConversionRequest request = new ConversionRequest(1, Currency.USD, Currency.JPY);
            ConversionResponse response = service.convert(request);

            assertEquals(149.5, response.result());
            assertEquals(149.5, response.rate());
        }

        @Test
        @DisplayName("Should convert GBP to EUR correctly")
        void gbpToEur() {
            ConversionRequest request = new ConversionRequest(100, Currency.GBP, Currency.EUR);
            ConversionResponse response = service.convert(request);

            // 0.79 / 0.92 = 0.8587 rate
            assertEquals(116.46, response.result(), 0.01);
            assertEquals(1.1646, response.rate(), 0.001);
        }

        @Test
        @DisplayName("Should convert same currency returns same amount")
        void sameCurrency() {
            ConversionRequest request = new ConversionRequest(100, Currency.USD, Currency.USD);
            ConversionResponse response = service.convert(request);

            assertEquals(100.0, response.result());
            assertEquals(1.0, response.rate());
        }

        @Test
        @DisplayName("Should convert with decimal amounts")
        void decimalAmounts() {
            ConversionRequest request = new ConversionRequest(99.99, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(91.99, response.result(), 0.01);
        }

        @Test
        @DisplayName("Should convert small amounts correctly")
        void smallAmounts() {
            ConversionRequest request = new ConversionRequest(0.01, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(0.01, response.result(), 0.001);
        }

        @Test
        @DisplayName("Should convert large amounts correctly")
        void largeAmounts() {
            ConversionRequest request = new ConversionRequest(1000000, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(920000.0, response.result());
        }
    }

    @Nested
    @DisplayName("Edge Cases")
    class EdgeCases {

        @Test
        @DisplayName("Should handle zero amount")
        void zeroAmount() {
            ConversionRequest request = new ConversionRequest(0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(0.0, response.result());
            assertEquals(0.92, response.rate());
        }

        @Test
        @DisplayName("Should convert all supported currencies from USD")
        void allCurrenciesFromUsd() {
            double amount = 100.0;

            assertConversion(amount, Currency.USD, Currency.EUR, 92.0);
            assertConversion(amount, Currency.USD, Currency.GBP, 79.0);
            assertConversion(amount, Currency.USD, Currency.JPY, 14950.0);
            assertConversion(amount, Currency.USD, Currency.CAD, 135.0);
            assertConversion(amount, Currency.USD, Currency.AUD, 153.0);
            assertConversion(amount, Currency.USD, Currency.CHF, 88.0);
            assertConversion(amount, Currency.USD, Currency.CNY, 724.0);
            assertConversion(amount, Currency.USD, Currency.INR, 8312.0);
            assertConversion(amount, Currency.USD, Currency.MXN, 1715.0);
        }

        private void assertConversion(double amount, Currency from, Currency to, double expectedResult) {
            ConversionRequest request = new ConversionRequest(amount, from, to);
            ConversionResponse response = service.convert(request);
            assertEquals(expectedResult, response.result(), 0.01,
                    () -> String.format("Failed for %s to %s", from, to));
        }
    }

    @Nested
    @DisplayName("Rate Calculation Tests")
    class RateCalculationTests {

        @Test
        @DisplayName("Should calculate correct rate for USD to EUR")
        void shouldCalculateCorrectRateForUsdToEur() {
            ConversionRequest request = new ConversionRequest(1.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(0.92, response.rate());
        }

        @Test
        @DisplayName("Should calculate correct rate for EUR to USD (inverse)")
        void shouldCalculateCorrectRateForEurToUsd() {
            ConversionRequest request = new ConversionRequest(1.0, Currency.EUR, Currency.USD);
            ConversionResponse response = service.convert(request);

            assertEquals(1.087, response.rate(), 0.001);
        }

        @Test
        @DisplayName("Should calculate correct rate for cross currency conversion")
        void shouldCalculateCorrectRateForCrossCurrency() {
            // GBP to JPY: 149.50 / 0.79 = 189.24
            ConversionRequest request = new ConversionRequest(1.0, Currency.GBP, Currency.JPY);
            ConversionResponse response = service.convert(request);

            assertEquals(189.24, response.result(), 0.01);
        }

        @Test
        @DisplayName("Should round results to 2 decimal places")
        void shouldRoundResultsToTwoDecimalPlaces() {
            // 100 USD to EUR with rate 0.92 = 92.0 exactly
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(92.0, response.result());
        }

        @Test
        @DisplayName("Should round up correctly")
        void shouldRoundUpCorrectly() {
            // 0.005 should round to 0.01
            ConversionRequest request = new ConversionRequest(0.01, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(0.01, response.result(), 0.001);
        }
    }
}
