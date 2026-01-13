package com.example.currency.service;

import com.example.currency.model.ConversionRequest;
import com.example.currency.model.ConversionResponse;
import com.example.currency.model.Currency;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.params.provider.Arguments.arguments;

@DisplayName("ExchangeRateService Tests")
class ExchangeRateServiceTest {

    // Test constants - match ExchangeRateService.RATES_TO_USD values
    private static final double TEST_AMOUNT = 100.0;
    private static final double USD_TO_EUR_RATE = 0.92;
    private static final double USD_TO_GBP_RATE = 0.79;
    private static final double USD_TO_JPY_RATE = 149.50;
    private static final double USD_TO_CAD_RATE = 1.35;
    private static final double USD_TO_AUD_RATE = 1.53;
    private static final double USD_TO_CHF_RATE = 0.88;
    private static final double USD_TO_CNY_RATE = 7.24;
    private static final double USD_TO_INR_RATE = 83.12;
    private static final double USD_TO_MXN_RATE = 17.15;
    private static final double DELTA = 0.0001;

    private ExchangeRateService service;

    @BeforeEach
    void setUp() {
        service = new ExchangeRateService();
    }

    @Nested
    @DisplayName("Same Currency Conversion Tests")
    class SameCurrencyTests {

        @ParameterizedTest
        @EnumSource(Currency.class)
        @DisplayName("Converting same currency should return rate of 1.0")
        void sameCurrencyShouldReturnRateOfOne(Currency currency) {
            ConversionRequest request = new ConversionRequest(TEST_AMOUNT, currency, currency);
            ConversionResponse response = service.convert(request);

            assertEquals(TEST_AMOUNT, response.amount());
            assertEquals(currency.name(), response.from());
            assertEquals(currency.name(), response.to());
            assertEquals(TEST_AMOUNT, response.result());
            assertEquals(1.0, response.rate());
        }

        @Test
        @DisplayName("Converting USD to USD with zero amount should return zero result")
        void usdToUsdZeroAmount() {
            ConversionRequest request = new ConversionRequest(0.0, Currency.USD, Currency.USD);
            ConversionResponse response = service.convert(request);

            assertEquals(0.0, response.amount());
            assertEquals(0.0, response.result());
            assertEquals(1.0, response.rate());
        }

        @Test
        @DisplayName("Converting EUR to EUR with large amount should preserve value")
        void eurToEurLargeAmount() {
            ConversionRequest request = new ConversionRequest(999999.99, Currency.EUR, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(999999.99, response.amount());
            assertEquals(999999.99, response.result());
            assertEquals(1.0, response.rate());
        }
    }

    @Nested
    @DisplayName("USD Conversion Tests")
    class UsdConversionTests {

        @Test
        @DisplayName("Converting USD to EUR should apply correct exchange rate")
        void usdToEurShouldApplyCorrectRate() {
            ConversionRequest request = new ConversionRequest(TEST_AMOUNT, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(TEST_AMOUNT, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(TEST_AMOUNT * USD_TO_EUR_RATE, response.result());
            assertEquals(USD_TO_EUR_RATE, response.rate());
        }

        @Test
        @DisplayName("Converting USD to GBP should apply correct exchange rate")
        void usdToGbpShouldApplyCorrectRate() {
            ConversionRequest request = new ConversionRequest(TEST_AMOUNT, Currency.USD, Currency.GBP);
            ConversionResponse response = service.convert(request);

            assertEquals(TEST_AMOUNT * USD_TO_GBP_RATE, response.result());
            assertEquals(USD_TO_GBP_RATE, response.rate());
        }

        @Test
        @DisplayName("Converting USD to JPY should apply correct exchange rate")
        void usdToJpyShouldApplyCorrectRate() {
            ConversionRequest request = new ConversionRequest(TEST_AMOUNT, Currency.USD, Currency.JPY);
            ConversionResponse response = service.convert(request);

            assertEquals(TEST_AMOUNT * USD_TO_JPY_RATE, response.result());
            assertEquals(USD_TO_JPY_RATE, response.rate());
        }

        @Test
        @DisplayName("Converting EUR to USD should apply correct inverse rate")
        void eurToUsdShouldApplyInverseRate() {
            double eurAmount = 92.0;
            ConversionRequest request = new ConversionRequest(eurAmount, Currency.EUR, Currency.USD);
            ConversionResponse response = service.convert(request);

            assertEquals(100.0, response.result());
            assertEquals(1.0 / USD_TO_EUR_RATE, response.rate(), DELTA);
        }

        @Test
        @DisplayName("Converting GBP to USD should apply correct inverse rate")
        void gbpToUsdShouldApplyInverseRate() {
            double gbpAmount = 79.0;
            ConversionRequest request = new ConversionRequest(gbpAmount, Currency.GBP, Currency.USD);
            ConversionResponse response = service.convert(request);

            assertEquals(100.0, response.result());
            assertEquals(1.0 / USD_TO_GBP_RATE, response.rate(), DELTA);
        }
    }

    @Nested
    @DisplayName("Cross Currency Conversion Tests")
    class CrossCurrencyTests {

        @Test
        @DisplayName("Converting EUR to GBP should use cross-rate through USD")
        void eurToGbpShouldUseCrossRate() {
            ConversionRequest request = new ConversionRequest(TEST_AMOUNT, Currency.EUR, Currency.GBP);
            ConversionResponse response = service.convert(request);

            double expectedResult = TEST_AMOUNT * (USD_TO_GBP_RATE / USD_TO_EUR_RATE);
            assertEquals(Math.round(expectedResult * 100.0) / 100.0, response.result());
            assertEquals(USD_TO_GBP_RATE / USD_TO_EUR_RATE, response.rate(), DELTA);
        }

        @Test
        @DisplayName("Converting JPY to CAD should use cross-rate through USD")
        void jpyToCadShouldUseCrossRate() {
            double jpyAmount = 10000.0;
            ConversionRequest request = new ConversionRequest(jpyAmount, Currency.JPY, Currency.CAD);
            ConversionResponse response = service.convert(request);

            double expectedRate = USD_TO_CAD_RATE / USD_TO_JPY_RATE;
            assertEquals(expectedRate, response.rate(), DELTA);
        }

        @Test
        @DisplayName("Converting CHF to CNY should use cross-rate through USD")
        void chfToCnyShouldUseCrossRate() {
            ConversionRequest request = new ConversionRequest(TEST_AMOUNT, Currency.CHF, Currency.CNY);
            ConversionResponse response = service.convert(request);

            double expectedRate = USD_TO_CNY_RATE / USD_TO_CHF_RATE;
            assertEquals(expectedRate, response.rate(), DELTA);
        }

        @Test
        @DisplayName("Converting AUD to INR should use cross-rate through USD")
        void audToInrShouldUseCrossRate() {
            ConversionRequest request = new ConversionRequest(TEST_AMOUNT, Currency.AUD, Currency.INR);
            ConversionResponse response = service.convert(request);

            double expectedRate = USD_TO_INR_RATE / USD_TO_AUD_RATE;
            assertEquals(expectedRate, response.rate(), DELTA);
        }

        @Test
        @DisplayName("Converting MXN to EUR should use cross-rate through USD")
        void mxnToEurShouldUseCrossRate() {
            double mxnAmount = 1000.0;
            ConversionRequest request = new ConversionRequest(mxnAmount, Currency.MXN, Currency.EUR);
            ConversionResponse response = service.convert(request);

            double expectedRate = USD_TO_EUR_RATE / USD_TO_MXN_RATE;
            assertEquals(expectedRate, response.rate(), DELTA);
        }

        @Test
        @DisplayName("Converting CAD to CHF should use cross-rate through USD")
        void cadToChfShouldUseCrossRate() {
            ConversionRequest request = new ConversionRequest(TEST_AMOUNT, Currency.CAD, Currency.CHF);
            ConversionResponse response = service.convert(request);

            double expectedRate = USD_TO_CHF_RATE / USD_TO_CAD_RATE;
            assertEquals(expectedRate, response.rate(), DELTA);
        }
    }

    @Nested
    @DisplayName("All Currency Pairs Tests")
    class AllCurrencyPairsTests {

        private static Stream<Arguments> allCurrencyPairs() {
            Stream.Builder<Arguments> builder = Stream.builder();
            for (Currency from : Currency.values()) {
                for (Currency to : Currency.values()) {
                    builder.accept(arguments(from, to));
                }
            }
            return builder.build();
        }

        @ParameterizedTest
        @MethodSource("allCurrencyPairs")
        @DisplayName("All currency pair conversions should return valid response")
        void allCurrencyPairsShouldReturnValidResponse(Currency from, Currency to) {
            ConversionRequest request = new ConversionRequest(TEST_AMOUNT, from, to);
            ConversionResponse response = service.convert(request);

            assertNotNull(response);
            assertEquals(TEST_AMOUNT, response.amount());
            assertEquals(from.name(), response.from());
            assertEquals(to.name(), response.to());
            assertNotNull(response.result());
        }

        @ParameterizedTest
        @MethodSource("allCurrencyPairs")
        @DisplayName("Same currency conversion should return rate of 1.0")
        void sameCurrencyRateShouldBeOne(Currency from, Currency to) {
            Assumptions.assumeTrue(from == to);

            ConversionRequest request = new ConversionRequest(TEST_AMOUNT, from, to);
            ConversionResponse response = service.convert(request);

            assertEquals(1.0, response.rate());
        }

        @ParameterizedTest
        @MethodSource("allCurrencyPairs")
        @DisplayName("Cross currency conversion should have positive rate")
        void crossCurrencyRateShouldBePositive(Currency from, Currency to) {
            Assumptions.assumeTrue(from != to);

            ConversionRequest request = new ConversionRequest(TEST_AMOUNT, from, to);
            ConversionResponse response = service.convert(request);

            assertTrue(response.rate() > 0, "Rate should be positive for " + from + " to " + to);
        }
    }

    @Nested
    @DisplayName("Edge Case Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Converting with zero amount should return zero result")
        void zeroAmountShouldReturnZeroResult() {
            ConversionRequest request = new ConversionRequest(0.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(0.0, response.amount());
            assertEquals(0.0, response.result());
            assertEquals(USD_TO_EUR_RATE, response.rate());
        }

        @Test
        @DisplayName("Converting with very small amount should work correctly")
        void verySmallAmountShouldWork() {
            ConversionRequest request = new ConversionRequest(0.01, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(0.01, response.amount());
            assertTrue(response.result() > 0);
            assertEquals(USD_TO_EUR_RATE, response.rate());
        }

        @Test
        @DisplayName("Converting with very large amount should work correctly")
        void veryLargeAmountShouldWork() {
            ConversionRequest request = new ConversionRequest(999999999.99, Currency.EUR, Currency.GBP);
            ConversionResponse response = service.convert(request);

            assertEquals(999999999.99, response.amount());
            assertTrue(response.result() > 0);
            assertTrue(response.rate() > 0);
        }

        @Test
        @DisplayName("Converting with negative amount should work (no validation)")
        void negativeAmountShouldWork() {
            ConversionRequest request = new ConversionRequest(-100.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(-100.0, response.amount());
            assertEquals(-92.0, response.result());
            assertEquals(USD_TO_EUR_RATE, response.rate());
        }
    }

    @Nested
    @DisplayName("Round Trip Conversion Tests")
    class RoundTripTests {

        @Test
        @DisplayName("USD -> EUR -> USD should return approximately original amount")
        void roundTripShouldReturnApproximateOriginal() {
            double originalAmount = 100.0;

            ConversionRequest toEur = new ConversionRequest(originalAmount, Currency.USD, Currency.EUR);
            ConversionResponse intermediate = service.convert(toEur);

            ConversionRequest backToUsd = new ConversionRequest(
                    intermediate.result(), Currency.EUR, Currency.USD
            );

            ConversionResponse finalResult = service.convert(backToUsd);

            // Allow for rounding errors (2 decimal places)
            assertEquals(Math.round(originalAmount * 100.0) / 100.0, finalResult.result(), 0.01);
        }

        @Test
        @DisplayName("USD -> JPY -> USD should return approximately original amount")
        void roundTripJpyShouldReturnApproximateOriginal() {
            double originalAmount = 100.0;

            ConversionRequest toJpy = new ConversionRequest(originalAmount, Currency.USD, Currency.JPY);
            ConversionResponse intermediate = service.convert(toJpy);

            ConversionRequest backToUsd = new ConversionRequest(
                    intermediate.result(), Currency.JPY, Currency.USD
            );

            ConversionResponse finalResult = service.convert(backToUsd);

            assertEquals(Math.round(originalAmount * 100.0) / 100.0, finalResult.result(), 0.02);
        }

        @Test
        @DisplayName("GBP -> CAD -> GBP should return approximately original amount")
        void roundTripGbpCadShouldReturnApproximateOriginal() {
            double originalAmount = 50.0;

            ConversionRequest toCad = new ConversionRequest(originalAmount, Currency.GBP, Currency.CAD);
            ConversionResponse intermediate = service.convert(toCad);

            ConversionRequest backToGbp = new ConversionRequest(
                    intermediate.result(), Currency.CAD, Currency.GBP
            );

            ConversionResponse finalResult = service.convert(backToGbp);

            assertEquals(Math.round(originalAmount * 100.0) / 100.0, finalResult.result(), 0.02);
        }
    }

    @Nested
    @DisplayName("Response Validation Tests")
    class ResponseValidationTests {

        @Test
        @DisplayName("Response should have correct from and to currency strings")
        void responseShouldHaveCorrectCurrencyStrings() {
            ConversionRequest request = new ConversionRequest(TEST_AMOUNT, Currency.EUR, Currency.JPY);
            ConversionResponse response = service.convert(request);

            assertEquals("EUR", response.from());
            assertEquals("JPY", response.to());
        }

        @Test
        @DisplayName("Response rate should match calculated rate")
        void responseRateShouldMatchCalculated() {
            ConversionRequest request = new ConversionRequest(TEST_AMOUNT, Currency.CHF, Currency.AUD);
            ConversionResponse response = service.convert(request);

            double expectedRate = USD_TO_AUD_RATE / USD_TO_CHF_RATE;
            assertEquals(expectedRate, response.rate(), DELTA);
        }

        @Test
        @DisplayName("Response result should be amount multiplied by rate, rounded to 2 decimals")
        void responseResultShouldBeRounded() {
            // Using amounts that create repeating decimals
            ConversionRequest request = new ConversionRequest(1.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            double expectedResult = Math.round(USD_TO_EUR_RATE * 100.0) / 100.0;
            assertEquals(expectedResult, response.result());
        }
    }
}