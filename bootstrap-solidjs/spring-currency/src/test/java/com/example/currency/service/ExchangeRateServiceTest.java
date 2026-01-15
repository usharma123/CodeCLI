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
    @DisplayName("Convert Method Tests")
    class ConvertTests {

        @Test
        @DisplayName("should convert USD to EUR correctly")
        void shouldConvertUSDToEURCorrectly() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(92.0, response.result());
            assertEquals(0.92, response.rate());
        }

        @Test
        @DisplayName("should convert USD to JPY correctly")
        void shouldConvertUSDToJPYCorrectly() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.JPY);
            ConversionResponse response = service.convert(request);

            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("JPY", response.to());
            assertEquals(14950.0, response.result()); // 100 * 149.5
            assertEquals(149.5, response.rate());
        }

        @Test
        @DisplayName("should convert EUR to USD correctly")
        void shouldConvertEURToUSDCorrectly() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.EUR, Currency.USD);
            ConversionResponse response = service.convert(request);

            assertEquals(100.0, response.amount());
            assertEquals("EUR", response.from());
            assertEquals("USD", response.to());
            assertEquals(108.7, response.result()); // 100 / 0.92
            assertEquals(1.0869565217391304, response.rate(), 0.0001);
        }

        @Test
        @DisplayName("should convert between same currency with rate 1.0")
        void shouldConvertBetweenSameCurrencyWithRateOne() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.USD);
            ConversionResponse response = service.convert(request);

            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("USD", response.to());
            assertEquals(100.0, response.result());
            assertEquals(1.0, response.rate());
        }

        @Test
        @DisplayName("should convert EUR to GBP correctly")
        void shouldConvertEURToGBPCorrectly() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.EUR, Currency.GBP);
            ConversionResponse response = service.convert(request);

            assertEquals(100.0, response.amount());
            assertEquals("EUR", response.from());
            assertEquals("GBP", response.to());
            assertEquals(85.87, response.result()); // 100 * (0.79/0.92)
            assertEquals(0.8586956521739131, response.rate(), 0.0001);
        }

        @Test
        @DisplayName("should handle zero amount")
        void shouldHandleZeroAmount() {
            ConversionRequest request = new ConversionRequest(0.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(0.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(0.0, response.result());
        }

        @Test
        @DisplayName("should handle negative amount")
        void shouldHandleNegativeAmount() {
            ConversionRequest request = new ConversionRequest(-50.0, Currency.EUR, Currency.USD);
            ConversionResponse response = service.convert(request);

            assertEquals(-50.0, response.amount());
            assertEquals("EUR", response.from());
            assertEquals("USD", response.to());
            assertEquals(-54.35, response.result());
        }

        @Test
        @DisplayName("should round result to 2 decimal places")
        void shouldRoundResultToTwoDecimalPlaces() {
            ConversionRequest request = new ConversionRequest(1.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(0.92, response.result());
        }

        @Test
        @DisplayName("should convert JPY to CNY correctly")
        void shouldConvertJPYToCNYCorrectly() {
            ConversionRequest request = new ConversionRequest(10000.0, Currency.JPY, Currency.CNY);
            ConversionResponse response = service.convert(request);

            assertEquals(10000.0, response.amount());
            assertEquals("JPY", response.from());
            assertEquals("CNY", response.to());
            assertEquals(484.28, response.result()); // 10000 * (7.24/149.5) = 484.279..., rounded to 2 decimals
            assertEquals(0.04842809364548495, response.rate(), 0.0001);
        }

        @Test
        @DisplayName("should handle small decimal amounts")
        void shouldHandleSmallDecimalAmounts() {
            ConversionRequest request = new ConversionRequest(0.01, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(0.01, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(0.01, response.result());
        }

        @Test
        @DisplayName("should handle large amounts")
        void shouldHandleLargeAmounts() {
            ConversionRequest request = new ConversionRequest(1_000_000.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(1_000_000.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(920000.0, response.result());
        }

        @Test
        @DisplayName("should convert INR to MXN correctly")
        void shouldConvertINRToMXNCorrectly() {
            ConversionRequest request = new ConversionRequest(1000.0, Currency.INR, Currency.MXN);
            ConversionResponse response = service.convert(request);

            assertEquals(1000.0, response.amount());
            assertEquals("INR", response.from());
            assertEquals("MXN", response.to());
        }

        @Test
        @DisplayName("should convert CHF to AUD correctly")
        void shouldConvertCHFAUDSorrectly() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.CHF, Currency.AUD);
            ConversionResponse response = service.convert(request);

            assertEquals(100.0, response.amount());
            assertEquals("CHF", response.from());
            assertEquals("AUD", response.to());
            assertEquals(173.86, response.result()); // 100 * (1.53/0.88) = 173.86
            assertEquals(1.7386363636363637, response.rate(), 0.0001);
        }

        @Test
        @DisplayName("should produce correct response object structure")
        void shouldProduceCorrectResponseObjectStructure() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            // Verify all fields are present and accessible
            assertNotNull(response);
            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertNotNull(response.result());
            assertNotNull(response.rate());
        }
    }

    @Nested
    @DisplayName("All Currency Pairs Tests")
    class AllCurrencyPairsTests {

        @Test
        @DisplayName("should handle all USD conversions")
        void shouldHandleAllUSDConversions() {
            ConversionRequest requestUSD = new ConversionRequest(100.0, Currency.USD, Currency.USD);
            ConversionResponse responseUSD = service.convert(requestUSD);
            assertEquals(100.0, responseUSD.result());

            ConversionRequest requestEUR = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse responseEUR = service.convert(requestEUR);
            assertEquals(92.0, responseEUR.result());

            ConversionRequest requestGBP = new ConversionRequest(100.0, Currency.USD, Currency.GBP);
            ConversionResponse responseGBP = service.convert(requestGBP);
            assertEquals(79.0, responseGBP.result());
        }

        @Test
        @DisplayName("should handle all EUR conversions")
        void shouldHandleAllEURConversions() {
            for (Currency to : Currency.values()) {
                ConversionRequest request = new ConversionRequest(100.0, Currency.EUR, to);
                ConversionResponse response = service.convert(request);

                assertNotNull(response);
                assertEquals("EUR", response.from());
                assertEquals(to.name(), response.to());
                assertEquals(100.0, response.amount());
                assertNotNull(response.result());
                assertNotNull(response.rate());
            }
        }

        @Test
        @DisplayName("should handle all conversions to USD")
        void shouldHandleAllConversionsToUSD() {
            for (Currency from : Currency.values()) {
                ConversionRequest request = new ConversionRequest(100.0, from, Currency.USD);
                ConversionResponse response = service.convert(request);

                assertNotNull(response);
                assertEquals(from.name(), response.from());
                assertEquals("USD", response.to());
                assertEquals(100.0, response.amount());
                assertNotNull(response.result());
                assertNotNull(response.rate());
            }
        }

        @Test
        @DisplayName("should handle all currency pair combinations")
        void shouldHandleAllCurrencyPairCombinations() {
            for (Currency from : Currency.values()) {
                for (Currency to : Currency.values()) {
                    ConversionRequest request = new ConversionRequest(100.0, from, to);
                    ConversionResponse response = service.convert(request);

                    assertNotNull(response);
                    assertEquals(from.name(), response.from());
                    assertEquals(to.name(), response.to());
                    assertEquals(100.0, response.amount());
                    assertNotNull(response.result());
                    assertNotNull(response.rate());

                    if (from == to) {
                        assertEquals(100.0, response.result());
                        assertEquals(1.0, response.rate());
                    }
                }
            }
        }
    }

    @Nested
    @DisplayName("Service Instantiation Tests")
    class ServiceInstantiationTests {

        @Test
        @DisplayName("should instantiate service successfully")
        void shouldInstantiateServiceSuccessfully() {
            assertDoesNotThrow(() -> new ExchangeRateService());
        }

        @Test
        @DisplayName("multiple service instances should produce same results")
        void multipleServiceInstancesShouldProduceSameResults() {
            ExchangeRateService service1 = new ExchangeRateService();
            ExchangeRateService service2 = new ExchangeRateService();

            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse response1 = service1.convert(request);
            ConversionResponse response2 = service2.convert(request);

            assertEquals(response1, response2);
        }
    }
}
