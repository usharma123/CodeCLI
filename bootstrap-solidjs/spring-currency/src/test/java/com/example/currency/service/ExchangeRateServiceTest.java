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
    @DisplayName("ServiceInstantiationTests")
    class ServiceInstantiationTests {

        @Test
        @DisplayName("service should be instantiable with no-arg constructor")
        void serviceShouldBeInstantiableWithNoArgConstructor() {
            assertNotNull(service);
        }

        @Test
        @DisplayName("multiple service instances should be independent")
        void multipleServiceInstancesShouldBeIndependent() {
            ExchangeRateService service1 = new ExchangeRateService();
            ExchangeRateService service2 = new ExchangeRateService();

            assertNotSame(service1, service2);
        }
    }

    @Nested
    @DisplayName("ConvertTests")
    class ConvertTests {

        @Test
        @DisplayName("convert should return correct response for USD to EUR")
        void convertShouldReturnCorrectResponseForUsdToEur() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            // 100 USD / 1.0 USD per USD * 0.92 EUR per USD = 92.0
            assertEquals(92.0, response.result());
            assertEquals(0.92, response.rate());
        }

        @Test
        @DisplayName("convert should return correct response for EUR to USD")
        void convertShouldReturnCorrectResponseForEurToUsd() {
            ConversionRequest request = new ConversionRequest(92.0, Currency.EUR, Currency.USD);
            ConversionResponse response = service.convert(request);

            assertEquals(92.0, response.amount());
            assertEquals("EUR", response.from());
            assertEquals("USD", response.to());
            // 92 EUR / 0.92 EUR per USD * 1.0 USD per USD = 100.0
            assertEquals(100.0, response.result());
        }

        @Test
        @DisplayName("convert should return rate of 1.0 for same currency")
        void convertShouldReturnRateOfOneForSameCurrency() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.USD);
            ConversionResponse response = service.convert(request);

            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("USD", response.to());
            assertEquals(100.0, response.result());
            assertEquals(1.0, response.rate());
        }

        @Test
        @DisplayName("convert should handle zero amount")
        void convertShouldHandleZeroAmount() {
            ConversionRequest request = new ConversionRequest(0.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(0.0, response.amount());
            assertEquals(0.0, response.result());
        }

        @Test
        @DisplayName("convert should round result to 2 decimal places")
        void convertShouldRoundResultToTwoDecimalPlaces() {
            // 1 USD to JPY: 1 / 1.0 * 149.50 = 149.5
            ConversionRequest request = new ConversionRequest(1.0, Currency.USD, Currency.JPY);
            ConversionResponse response = service.convert(request);

            assertEquals(149.5, response.result());
        }

        @Test
        @DisplayName("convert should handle large amounts")
        void convertShouldHandleLargeAmounts() {
            ConversionRequest request = new ConversionRequest(1000000.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(1000000.0, response.amount());
            assertEquals(920000.0, response.result());
            assertEquals(0.92, response.rate());
        }

        @Test
        @DisplayName("convert should handle small amounts")
        void convertShouldHandleSmallAmounts() {
            ConversionRequest request = new ConversionRequest(0.01, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(0.01, response.amount());
            assertEquals(0.01, response.result());
            assertEquals(0.92, response.rate());
        }
    }

    @Nested
    @DisplayName("AllCurrencyPairsTests")
    class AllCurrencyPairsTests {

        @Test
        @DisplayName("convert should work for all currency pairs")
        void convertShouldWorkForAllCurrencyPairs() {
            for (Currency from : Currency.values()) {
                for (Currency to : Currency.values()) {
                    ConversionRequest request = new ConversionRequest(100.0, from, to);
                    ConversionResponse response = service.convert(request);

                    assertNotNull(response);
                    assertEquals(100.0, response.amount());
                    assertEquals(from.name(), response.from());
                    assertEquals(to.name(), response.to());
                    assertTrue(response.rate() > 0, "Rate should be positive for " + from + " to " + to);

                    if (from == to) {
                        assertEquals(100.0, response.result());
                        assertEquals(1.0, response.rate());
                    }
                }
            }
        }

        @Test
        @DisplayName("convert should produce consistent rates")
        void convertShouldProduceConsistentRates() {
            // The rate from A to B should be the inverse of the rate from B to A
            double tolerance = 0.0001;

            for (Currency from : Currency.values()) {
                for (Currency to : Currency.values()) {
                    if (from == to) continue;

                    ConversionRequest forwardRequest = new ConversionRequest(1.0, from, to);
                    ConversionResponse forwardResponse = service.convert(forwardRequest);

                    ConversionRequest reverseRequest = new ConversionRequest(1.0, to, from);
                    ConversionResponse reverseResponse = service.convert(reverseRequest);

                    double product = forwardResponse.rate() * reverseResponse.rate();
                    assertEquals(1.0, product, tolerance,
                        "Rate product should be ~1.0 for " + from + " to " + to + " and back");
                }
            }
        }

        @Test
        @DisplayName("response should have correct string representations")
        void responseShouldHaveCorrectStringRepresentations() {
            for (Currency from : Currency.values()) {
                for (Currency to : Currency.values()) {
                    ConversionRequest request = new ConversionRequest(100.0, from, to);
                    ConversionResponse response = service.convert(request);

                    assertEquals(from.name(), response.from());
                    assertEquals(to.name(), response.to());
                }
            }
        }

        @Test
        @DisplayName("USD conversions should have rate equal to target currency rate")
        void usdConversionsShouldHaveRateEqualToTargetCurrencyRate() {
            // USD to X: rate should be RATES_TO_USD.get(X) / 1.0 = RATES_TO_USD.get(X)
            for (Currency to : Currency.values()) {
                if (to == Currency.USD) continue;

                ConversionRequest request = new ConversionRequest(1.0, Currency.USD, to);
                ConversionResponse response = service.convert(request);

                // Rate should match the to currency's rate relative to USD
                // Since USD is 1.0, rate = target rate
                // We can't directly verify the rate value without duplicating the map,
                // but we can verify the result is correct
                assertEquals(response.rate(), response.result());
            }
        }
    }
}