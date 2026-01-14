package com.example.currency.service;

import com.example.currency.model.ConversionRequest;
import com.example.currency.model.ConversionResponse;
import com.example.currency.model.Currency;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.params.provider.Arguments.arguments;

@DisplayName("ExchangeRateService Tests")
class ExchangeRateServiceTest {

    private ExchangeRateService service;

    @BeforeEach
    void setUp() {
        service = new ExchangeRateService();
    }

    @Test
    @DisplayName("Service should be instantiated successfully")
    void testServiceInstantiation() {
        assertNotNull(service);
    }

    @Test
    @DisplayName("Convert USD to EUR should return correct result")
    void testConvertUsdToEur() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
        ConversionResponse response = service.convert(request);

        assertEquals(100.0, response.amount());
        assertEquals("USD", response.from());
        assertEquals("EUR", response.to());
        assertEquals(92.0, response.result());
        assertEquals(0.92, response.rate());
    }

    @Test
    @DisplayName("Convert EUR to USD should return correct result")
    void testConvertEurToUsd() {
        ConversionRequest request = new ConversionRequest(92.0, Currency.EUR, Currency.USD);
        ConversionResponse response = service.convert(request);

        assertEquals(100.0, response.result());
        assertEquals(1.0869565217391304, response.rate());
    }

    @Test
    @DisplayName("Convert same currency should return same amount with rate 1.0")
    void testConvertSameCurrency() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.USD);
        ConversionResponse response = service.convert(request);

        assertEquals(100.0, response.amount());
        assertEquals("USD", response.from());
        assertEquals("USD", response.to());
        assertEquals(100.0, response.result());
        assertEquals(1.0, response.rate());
    }

    @Test
    @DisplayName("Convert USD to JPY should return correct result")
    void testConvertUsdToJpy() {
        ConversionRequest request = new ConversionRequest(1.0, Currency.USD, Currency.JPY);
        ConversionResponse response = service.convert(request);

        assertEquals(149.50, response.result());
        assertEquals(149.50, response.rate());
    }

    @Test
    @DisplayName("Convert JPY to USD should return correct result")
    void testConvertJpyToUsd() {
        ConversionRequest request = new ConversionRequest(149.50, Currency.JPY, Currency.USD);
        ConversionResponse response = service.convert(request);

        assertEquals(1.0, response.result());
        assertEquals(0.00668896, response.rate(), 0.0001);
    }

    @Test
    @DisplayName("Convert with zero amount should return zero result")
    void testConvertZeroAmount() {
        ConversionRequest request = new ConversionRequest(0.0, Currency.USD, Currency.EUR);
        ConversionResponse response = service.convert(request);

        assertEquals(0.0, response.amount());
        assertEquals(0.0, response.result());
        assertEquals(0.92, response.rate());
    }

    @Test
    @DisplayName("Convert with large amount should calculate correctly")
    void testConvertLargeAmount() {
        ConversionRequest request = new ConversionRequest(10000.0, Currency.USD, Currency.EUR);
        ConversionResponse response = service.convert(request);

        assertEquals(9200.0, response.result());
    }

    @Test
    @DisplayName("Convert USD to GBP should return correct result")
    void testConvertUsdToGbp() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.GBP);
        ConversionResponse response = service.convert(request);

        assertEquals(79.0, response.result());
        assertEquals(0.79, response.rate());
    }

    @Test
    @DisplayName("Convert GBP to USD should return correct result")
    void testConvertGbpToUsd() {
        ConversionRequest request = new ConversionRequest(79.0, Currency.GBP, Currency.USD);
        ConversionResponse response = service.convert(request);

        assertEquals(100.0, response.result());
        assertEquals(1.26582, response.rate(), 0.0001);
    }

    @Test
    @DisplayName("Convert USD to CAD should return correct result")
    void testConvertUsdToCad() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.CAD);
        ConversionResponse response = service.convert(request);

        assertEquals(135.0, response.result());
        assertEquals(1.35, response.rate());
    }

    @Test
    @DisplayName("Convert USD to AUD should return correct result")
    void testConvertUsdToAud() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.AUD);
        ConversionResponse response = service.convert(request);

        assertEquals(153.0, response.result());
        assertEquals(1.53, response.rate());
    }

    @Test
    @DisplayName("Convert USD to CHF should return correct result")
    void testConvertUsdToChf() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.CHF);
        ConversionResponse response = service.convert(request);

        assertEquals(88.0, response.result());
        assertEquals(0.88, response.rate());
    }

    @Test
    @DisplayName("Convert USD to CNY should return correct result")
    void testConvertUsdToCny() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.CNY);
        ConversionResponse response = service.convert(request);

        assertEquals(724.0, response.result());
        assertEquals(7.24, response.rate());
    }

    @Test
    @DisplayName("Convert USD to INR should return correct result")
    void testConvertUsdToInr() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.INR);
        ConversionResponse response = service.convert(request);

        assertEquals(8312.0, response.result());
        assertEquals(83.12, response.rate());
    }

    @Test
    @DisplayName("Convert USD to MXN should return correct result")
    void testConvertUsdToMxn() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.MXN);
        ConversionResponse response = service.convert(request);

        assertEquals(1715.0, response.result());
        assertEquals(17.15, response.rate());
    }

    @Test
    @DisplayName("Cross currency conversion (EUR to GBP) should be correct")
    void testCrossCurrencyConversion() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.EUR, Currency.GBP);
        ConversionResponse response = service.convert(request);

        // EUR to GBP: (0.79 / 0.92) * 100 = 85.87
        assertEquals(85.87, response.result());
        assertEquals(0.8587, response.rate(), 0.0001);
    }

    @Test
    @DisplayName("Cross currency conversion (JPY to EUR) should be correct")
    void testJpyToEurConversion() {
        ConversionRequest request = new ConversionRequest(10000.0, Currency.JPY, Currency.EUR);
        ConversionResponse response = service.convert(request);

        // JPY to EUR: (0.92 / 149.50) * 10000 = 61.54
        assertEquals(61.54, response.result());
        assertEquals(0.006153, response.rate(), 0.000001);
    }

    @Test
    @DisplayName("Convert should round result to two decimal places")
    void testResultRounding() {
        // 1 USD to JPY = 149.50 exactly, no rounding needed
        ConversionRequest request = new ConversionRequest(1.0, Currency.USD, Currency.JPY);
        ConversionResponse response = service.convert(request);

        assertEquals(149.50, response.result());
    }

    @Test
    @DisplayName("Response should contain correct currency names as strings")
    void testResponseCurrencyNames() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.EUR, Currency.GBP);
        ConversionResponse response = service.convert(request);

        assertEquals("EUR", response.from());
        assertEquals("GBP", response.to());
    }

    @ParameterizedTest
    @MethodSource("provideAllCurrencyConversionScenarios")
    @DisplayName("All currency conversions should return valid responses")
    void testAllCurrencyConversions(ConversionRequest request, String expectedFrom, String expectedTo) {
        ConversionResponse response = service.convert(request);

        assertEquals(request.amount(), response.amount());
        assertEquals(expectedFrom, response.from());
        assertEquals(expectedTo, response.to());
        assertNotNull(response.result());
        assertTrue(response.rate() > 0, "Rate should be positive");
    }

    static Stream<Arguments> provideAllCurrencyConversionScenarios() {
        Stream.Builder<Arguments> builder = Stream.builder();
        for (Currency from : Currency.values()) {
            for (Currency to : Currency.values()) {
                builder.add(arguments(
                        new ConversionRequest(100.0, from, to),
                        from.name(),
                        to.name()
                ));
            }
        }
        return builder.build();
    }
}