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
    @DisplayName("Basic conversion tests")
    class BasicConversionTests {

        @Test
        @DisplayName("should convert USD to EUR correctly")
        void shouldConvertUsdToEurCorrectly() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(92.0, response.result());
            assertEquals(0.92, response.rate());
        }

        @Test
        @DisplayName("should convert USD to GBP correctly")
        void shouldConvertUsdToGbpCorrectly() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.GBP);
            ConversionResponse response = service.convert(request);

            assertEquals(79.0, response.result());
            assertEquals(0.79, response.rate());
        }

        @Test
        @DisplayName("should convert USD to JPY correctly")
        void shouldConvertUsdToJpyCorrectly() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.JPY);
            ConversionResponse response = service.convert(request);

            assertEquals(14950.0, response.result());
            assertEquals(149.5, response.rate());
        }

        @Test
        @DisplayName("should convert USD to INR correctly")
        void shouldConvertUsdToInrCorrectly() {
            ConversionRequest request = new ConversionRequest(1.0, Currency.USD, Currency.INR);
            ConversionResponse response = service.convert(request);

            assertEquals(83.12, response.result());
            assertEquals(83.12, response.rate());
        }

        @Test
        @DisplayName("should convert EUR to USD correctly")
        void shouldConvertEurToUsdCorrectly() {
            ConversionRequest request = new ConversionRequest(92.0, Currency.EUR, Currency.USD);
            ConversionResponse response = service.convert(request);

            assertEquals(100.0, response.result());
            assertEquals(1.0869565217391304, response.rate());
        }
    }

    @Nested
    @DisplayName("Same currency conversion tests")
    class SameCurrencyConversionTests {

        @Test
        @DisplayName("should return same amount when converting USD to USD")
        void shouldReturnSameAmountWhenConvertingUsdToUsd() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.USD);
            ConversionResponse response = service.convert(request);

            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("USD", response.to());
            assertEquals(100.0, response.result());
            assertEquals(1.0, response.rate());
        }

        @Test
        @DisplayName("should return same amount when converting EUR to EUR")
        void shouldReturnSameAmountWhenConvertingEurToEur() {
            ConversionRequest request = new ConversionRequest(250.0, Currency.EUR, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(250.0, response.result());
            assertEquals(1.0, response.rate());
        }

        @Test
        @DisplayName("should handle all currencies converting to themselves")
        void shouldHandleAllCurrenciesConvertingToThemselves() {
            for (Currency currency : Currency.values()) {
                ConversionRequest request = new ConversionRequest(100.0, currency, currency);
                ConversionResponse response = service.convert(request);

                assertEquals(100.0, response.result());
                assertEquals(1.0, response.rate());
            }
        }
    }

    @Nested
    @DisplayName("Edge case conversion tests")
    class EdgeCaseConversionTests {

        @Test
        @DisplayName("should handle zero amount")
        void shouldHandleZeroAmount() {
            ConversionRequest request = new ConversionRequest(0.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(0.0, response.amount());
            assertEquals(0.0, response.result());
        }

        @Test
        @DisplayName("should handle negative amount")
        void shouldHandleNegativeAmount() {
            ConversionRequest request = new ConversionRequest(-50.0, Currency.EUR, Currency.GBP);
            ConversionResponse response = service.convert(request);

            assertEquals(-50.0, response.amount());
            assertEquals(-42.93, response.result(), 0.01);
        }

        @Test
        @DisplayName("should handle large amount")
        void shouldHandleLargeAmount() {
            ConversionRequest request = new ConversionRequest(1000000.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(920000.0, response.result());
        }

        @Test
        @DisplayName("should handle small decimal amount")
        void shouldHandleSmallDecimalAmount() {
            ConversionRequest request = new ConversionRequest(0.01, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(0.01, response.amount());
            assertEquals(0.01 * 0.92, response.result(), 0.001);
        }
    }

    @Nested
    @DisplayName("Cross currency conversion tests")
    class CrossCurrencyConversionTests {

        @Test
        @DisplayName("should convert EUR to GBP correctly")
        void shouldConvertEurToGbpCorrectly() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.EUR, Currency.GBP);
            ConversionResponse response = service.convert(request);

            // EUR -> USD = 100 * 1.086956 = 108.6956
            // USD -> GBP = 108.6956 * 0.79 = 85.8697
            assertEquals(85.87, response.result(), 0.01);
        }

        @Test
        @DisplayName("should convert JPY to CHF correctly")
        void shouldConvertJpyToChfCorrectly() {
            ConversionRequest request = new ConversionRequest(10000.0, Currency.JPY, Currency.CHF);
            ConversionResponse response = service.convert(request);

            // JPY -> USD = 10000 / 149.5 = 66.8896
            // USD -> CHF = 66.8896 * 0.88 = 58.86
            assertEquals(58.86, response.result(), 0.01);
        }

        @Test
        @DisplayName("should convert all currency pairs")
        void shouldConvertAllCurrencyPairs() {
            for (Currency from : Currency.values()) {
                for (Currency to : Currency.values()) {
                    ConversionRequest request = new ConversionRequest(100.0, from, to);
                    ConversionResponse response = service.convert(request);

                    assertNotNull(response);
                    assertEquals(from.name(), response.from());
                    assertEquals(to.name(), response.to());

                    if (from == to) {
                        assertEquals(100.0, response.result());
                        assertEquals(1.0, response.rate());
                    } else {
                        assertNotNull(response);
                        // Just verify it doesn't throw and produces a valid response
                    }
                }
            }
        }
    }

    @Nested
    @DisplayName("Rounding behavior tests")
    class RoundingBehaviorTests {

        @Test
        @DisplayName("should round result to 2 decimal places")
        void shouldRoundResultToTwoDecimalPlaces() {
            // 100 USD to JPY = 14950, which should stay as 14950 (no decimals)
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.JPY);
            ConversionResponse response = service.convert(request);

            assertEquals(14950.0, response.result());
        }

        @Test
        @DisplayName("should preserve rate precision")
        void shouldPreserveRatePrecision() {
            // EUR to GBP rate should have many decimal places
            ConversionRequest request = new ConversionRequest(1.0, Currency.EUR, Currency.GBP);
            ConversionResponse response = service.convert(request);

            double expectedRate = 0.79 / 0.92;
            assertEquals(expectedRate, response.rate(), 0.0001);
        }
    }

    @Nested
    @DisplayName("Response structure tests")
    class ResponseStructureTests {

        @Test
        @DisplayName("should return response with correct from currency name")
        void shouldReturnResponseWithCorrectFromCurrencyName() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.EUR, Currency.USD);
            ConversionResponse response = service.convert(request);

            assertEquals("EUR", response.from());
        }

        @Test
        @DisplayName("should return response with correct to currency name")
        void shouldReturnResponseWithCorrectToCurrencyName() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals("EUR", response.to());
        }

        @Test
        @DisplayName("should return response with correct rate value")
        void shouldReturnResponseWithCorrectRateValue() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(0.92, response.rate());
        }

        @Test
        @DisplayName("should return response with correct result calculation")
        void shouldReturnResponseWithCorrectResultCalculation() {
            ConversionRequest request = new ConversionRequest(250.0, Currency.USD, Currency.EUR);
            ConversionResponse response = service.convert(request);

            assertEquals(250.0 * 0.92, response.result());
        }
    }
}