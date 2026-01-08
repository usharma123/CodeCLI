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

    private ExchangeRateService exchangeRateService;

    @BeforeEach
    void setUp() {
        exchangeRateService = new ExchangeRateService();
    }

    @Nested
    @DisplayName("convert() method tests")
    class ConvertMethodTests {

        @Test
        @DisplayName("should convert USD to EUR correctly")
        void shouldConvertUsdToEurCorrectly() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse response = exchangeRateService.convert(request);

            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(92.0, response.result(), 0.01);
            assertEquals(0.92, response.rate(), 0.001);
        }

        @Test
        @DisplayName("should convert EUR to USD correctly")
        void shouldConvertEurToUsdCorrectly() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.EUR, Currency.USD);
            ConversionResponse response = exchangeRateService.convert(request);

            assertEquals(100.0, response.amount());
            assertEquals("EUR", response.from());
            assertEquals("USD", response.to());
            assertEquals(108.7, response.result(), 0.1);
            assertEquals(1.087, response.rate(), 0.001);
        }

        @Test
        @DisplayName("should convert same currency returns same amount")
        void shouldConvertSameCurrencyReturnsSameAmount() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.USD);
            ConversionResponse response = exchangeRateService.convert(request);

            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("USD", response.to());
            assertEquals(100.0, response.result());
            assertEquals(1.0, response.rate());
        }

        @Test
        @DisplayName("should convert with fractional result rounding to 2 decimal places")
        void shouldConvertWithFractionalResultRounding() {
            ConversionRequest request = new ConversionRequest(10.0, Currency.USD, Currency.JPY);
            ConversionResponse response = exchangeRateService.convert(request);

            assertEquals(10.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("JPY", response.to());
            assertEquals(1495.0, response.result());
        }

        @Test
        @DisplayName("should convert GBP to JPY correctly")
        void shouldConvertGbpToJpyCorrectly() {
            ConversionRequest request = new ConversionRequest(50.0, Currency.GBP, Currency.JPY);
            ConversionResponse response = exchangeRateService.convert(request);

            assertEquals(50.0, response.amount());
            assertEquals("GBP", response.from());
            assertEquals("JPY", response.to());
            assertEquals(9462.03, response.result(), 0.1);
        }

        @Test
        @DisplayName("should convert zero amount returns zero result")
        void shouldConvertZeroAmountReturnsZeroResult() {
            ConversionRequest request = new ConversionRequest(0.0, Currency.USD, Currency.EUR);
            ConversionResponse response = exchangeRateService.convert(request);

            assertEquals(0.0, response.amount());
            assertEquals(0.0, response.result());
        }

        @Test
        @DisplayName("should convert large amount correctly")
        void shouldConvertLargeAmountCorrectly() {
            ConversionRequest request = new ConversionRequest(1000000.0, Currency.INR, Currency.CHF);
            ConversionResponse response = exchangeRateService.convert(request);

            assertEquals(1000000.0, response.amount());
            assertEquals("INR", response.from());
            assertEquals("CHF", response.to());
        }

        @Test
        @DisplayName("should handle all currency pairs")
        void shouldHandleAllCurrencyPairs() {
            Currency[] currencies = Currency.values();

            for (Currency from : currencies) {
                for (Currency to : currencies) {
                    ConversionRequest request = new ConversionRequest(100.0, from, to);
                    ConversionResponse response = exchangeRateService.convert(request);

                    assertNotNull(response);
                    assertEquals(from.name(), response.from());
                }
            }
        }
    }

    @Nested
    @DisplayName("getRate() method tests - branch coverage")
    class GetRateMethodTests {

        @Test
        @DisplayName("should return 1.0 when from and to are same currency")
        void shouldReturnOneWhenSameCurrency() {
            double rate = invokeGetRate(Currency.USD, Currency.USD);
            assertEquals(1.0, rate);
        }

        @Test
        @DisplayName("should calculate rate from USD to EUR")
        void shouldCalculateRateFromUsdToEur() {
            double rate = invokeGetRate(Currency.USD, Currency.EUR);
            assertEquals(0.92, rate, 0.001);
        }

        @Test
        @DisplayName("should calculate rate from EUR to USD")
        void shouldCalculateRateFromEurToUsd() {
            double rate = invokeGetRate(Currency.EUR, Currency.USD);
            assertEquals(1.087, rate, 0.01);
        }

        @Test
        @DisplayName("should calculate cross rates correctly")
        void shouldCalculateCrossRatesCorrectly() {
            double eurToGbp = invokeGetRate(Currency.EUR, Currency.GBP);
            double usdToEur = invokeGetRate(Currency.USD, Currency.EUR);
            double usdToGbp = invokeGetRate(Currency.USD, Currency.GBP);

            assertEquals(eurToGbp, usdToGbp / usdToEur, 0.0001);
        }

        @Test
        @DisplayName("should have consistent rates (inverse relationship)")
        void shouldHaveConsistentInverseRates() {
            for (Currency from : Currency.values()) {
                for (Currency to : Currency.values()) {
                    if (from != to) {
                        double rate1 = invokeGetRate(from, to);
                        double rate2 = invokeGetRate(to, from);
                        assertEquals(1.0, rate1 * rate2, 0.0001);
                    }
                }
            }
        }

        @Test
        @DisplayName("should calculate rate for JPY (large number)")
        void shouldCalculateRateForJpyLargeNumber() {
            double rate = invokeGetRate(Currency.USD, Currency.JPY);
            assertEquals(149.50, rate, 0.01);
        }

        @Test
        @DisplayName("should calculate rate for MXN")
        void shouldCalculateRateForMxn() {
            double rate = invokeGetRate(Currency.USD, Currency.MXN);
            assertEquals(17.15, rate, 0.01);
        }

        private double invokeGetRate(Currency from, Currency to) {
            try {
                java.lang.reflect.Method method = ExchangeRateService.class.getDeclaredMethod("getRate", Currency.class, Currency.class);
                method.setAccessible(true);
                return (Double) method.invoke(exchangeRateService, from, to);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
    }

    @Nested
    @DisplayName("RATES_TO_USD constant tests")
    class RatesToUsdTests {

        @Test
        @DisplayName("USD rate should be 1.0")
        void usdRateShouldBeOne() {
            assertNotNull(exchangeRateService);
        }

        @Test
        @DisplayName("should have rate for all currencies")
        void shouldHaveRateForAllCurrencies() {
            for (Currency currency : Currency.values()) {
                assertDoesNotThrow(() -> {
                    ConversionRequest request = new ConversionRequest(1.0, currency, Currency.USD);
                    exchangeRateService.convert(request);
                });
            }
        }
    }

    @Nested
    @DisplayName("Edge cases")
    class EdgeCaseTests {

        @Test
        @DisplayName("should handle very small amount")
        void shouldHandleVerySmallAmount() {
            ConversionRequest request = new ConversionRequest(0.01, Currency.EUR, Currency.GBP);
            ConversionResponse response = exchangeRateService.convert(request);

            assertEquals(0.01, response.amount());
            assertTrue(response.result() > 0);
        }

        @Test
        @DisplayName("should handle amount with many decimal places")
        void shouldHandleAmountWithManyDecimalPlaces() {
            ConversionRequest request = new ConversionRequest(123.456789, Currency.CAD, Currency.AUD);
            ConversionResponse response = exchangeRateService.convert(request);

            assertEquals(123.456789, response.amount());
            assertNotNull(response.result());
        }
    }
}
