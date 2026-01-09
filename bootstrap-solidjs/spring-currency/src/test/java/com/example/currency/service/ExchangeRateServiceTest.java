package com.example.currency.service;

import com.example.currency.model.ConversionRequest;
import com.example.currency.model.ConversionResponse;
import com.example.currency.model.Currency;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ExchangeRateService Tests")
class ExchangeRateServiceTest {

    private ExchangeRateService service;

    @BeforeEach
    void setUp() {
        service = new ExchangeRateService();
    }

    @Nested
    @DisplayName("Cross Currency Conversion Tests")
    class CrossCurrencyConversionTests {


        @Test
        @DisplayName("Should convert CAD to AUD correctly")
        void shouldConvertCadToAud() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.CAD, Currency.AUD);
            
            ConversionResponse response = service.convert(request);
            
            assertEquals("CAD", response.from());
            assertEquals("AUD", response.to());
            assertTrue(response.rate() > 0);
        }

        @Test
        @DisplayName("Should convert CHF to CNY correctly")
        void shouldConvertChfToCny() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.CHF, Currency.CNY);
            
            ConversionResponse response = service.convert(request);
            
            assertEquals("CHF", response.from());
            assertEquals("CNY", response.to());
            assertTrue(response.result() > 100.0);
        }

        @Test
        @DisplayName("Should convert INR to MXN correctly")
        void shouldConvertInrToMxn() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.INR, Currency.MXN);
            
            ConversionResponse response = service.convert(request);
            
            assertEquals("INR", response.from());
            assertEquals("MXN", response.to());
            assertTrue(response.rate() > 0);
        }

        @Test
        @DisplayName("Should convert EUR to GBP correctly")
        void shouldConvertEurToGbp() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.EUR, Currency.GBP);
            
            ConversionResponse response = service.convert(request);
            
            assertEquals("EUR", response.from());
            assertEquals("GBP", response.to());
            assertTrue(response.rate() > 0);
        }

        @Test
        @DisplayName("Should convert GBP to JPY correctly")
        void shouldConvertGbpToJpy() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.GBP, Currency.JPY);
            
            ConversionResponse response = service.convert(request);
            
            assertEquals("GBP", response.from());
            assertEquals("JPY", response.to());
            assertTrue(response.result() > 100.0);
        }
    }

    @Nested
    @DisplayName("All Currency Pairs Tests")
    class AllCurrencyPairsTests {

        @ParameterizedTest
        @CsvSource({
            "USD, EUR", "USD, GBP", "USD, JPY", "USD, CAD", "USD, AUD",
            "EUR, USD", "EUR, GBP", "EUR, JPY", "EUR, CAD", "EUR, AUD",
            "GBP, USD", "GBP, EUR", "GBP, JPY", "GBP, CAD", "GBP, AUD",
            "JPY, USD", "JPY, EUR", "JPY, GBP", "JPY, CAD", "JPY, AUD"
        })
        @DisplayName("Should convert between all currency pairs")
        void shouldConvertBetweenAllCurrencyPairs(Currency from, Currency to) {
            ConversionRequest request = new ConversionRequest(100.0, from, to);
            
            ConversionResponse response = service.convert(request);
            
            assertNotNull(response);
            assertEquals(100.0, response.amount());
            assertEquals(from.name(), response.from());
            assertEquals(to.name(), response.to());
            assertTrue(response.rate() > 0);
            assertTrue(response.result() > 0);
        }

        @ParameterizedTest
        @CsvSource({
            "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "MXN"
        })
        @DisplayName("Should handle same currency for all currencies")
        void shouldHandleSameCurrencyForAllCurrencies(Currency currency) {
            ConversionRequest request = new ConversionRequest(100.0, currency, currency);
            
            ConversionResponse response = service.convert(request);
            
            assertEquals(100.0, response.amount());
            assertEquals(100.0, response.result());
            assertEquals(1.0, response.rate());
        }
    }

    @Nested
    @DisplayName("Edge Case Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle very small amounts")
        void shouldHandleVerySmallAmounts() {
            ConversionRequest request = new ConversionRequest(0.01, Currency.USD, Currency.EUR);
            
            ConversionResponse response = service.convert(request);
            
            assertEquals(0.01, response.amount());
            assertTrue(response.result() >= 0);
        }

        @Test
        @DisplayName("Should handle fractional results correctly")
        void shouldHandleFractionalResultsCorrectly() {
            ConversionRequest request = new ConversionRequest(33.33, Currency.USD, Currency.EUR);
            
            ConversionResponse response = service.convert(request);
            
            assertEquals(33.33, response.amount());
            assertEquals(30.66, response.result());
        }

        @Test
        @DisplayName("Should maintain precision for small values")
        void shouldMaintainPrecisionForSmallValues() {
            ConversionRequest request = new ConversionRequest(1.0, Currency.USD, Currency.EUR);
            
            ConversionResponse response = service.convert(request);
            
            assertEquals(1.0, response.amount());
            assertEquals(0.92, response.result());
        }
    }

    @Nested
    @DisplayName("Response Validation Tests")
    class ResponseValidationTests {

        @Test
        @DisplayName("Should always return non-null response")
        void shouldAlwaysReturnNonNullResponse() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            
            ConversionResponse response = service.convert(request);
            
            assertNotNull(response);
        }

        @Test
        @DisplayName("Should preserve input amount in response")
        void shouldPreserveInputAmountInResponse() {
            double amount = 250.75;
            ConversionRequest request = new ConversionRequest(amount, Currency.USD, Currency.EUR);
            
            ConversionResponse response = service.convert(request);
            
            assertEquals(amount, response.amount());
        }

        @Test
        @DisplayName("Should preserve from currency in response")
        void shouldPreserveFromCurrencyInResponse() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.GBP, Currency.EUR);
            
            ConversionResponse response = service.convert(request);
            
            assertEquals("GBP", response.from());
        }

        @Test
        @DisplayName("Should preserve to currency in response")
        void shouldPreserveToCurrencyInResponse() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.JPY);
            
            ConversionResponse response = service.convert(request);
            
            assertEquals("JPY", response.to());
        }

        @Test
        @DisplayName("Should have consistent rate and result relationship")
        void shouldHaveConsistentRateAndResultRelationship() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            
            ConversionResponse response = service.convert(request);
            
            double expectedResult = Math.round(response.amount() * response.rate() * 100.0) / 100.0;
            assertEquals(expectedResult, response.result());
        }
    }
}
