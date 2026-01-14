package com.example.currency.controller;

import com.example.currency.model.ConversionRequest;
import com.example.currency.model.ConversionResponse;
import com.example.currency.model.Currency;
import com.example.currency.service.ExchangeRateService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("CurrencyController Tests")
class CurrencyControllerTest {

    @Test
    @DisplayName("Controller should use injected ExchangeRateService")
    void testServiceInjection() {
        ExchangeRateService service = new ExchangeRateService();
        CurrencyController controller = new CurrencyController(service);

        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
        ConversionResponse response = controller.convert(request);

        assertNotNull(response);
        assertEquals("USD", response.from());
        assertEquals("EUR", response.to());
        assertEquals(92.0, response.result());
    }

    @Test
    @DisplayName("Controller convert should handle same currency")
    void testConvertSameCurrency() {
        ExchangeRateService service = new ExchangeRateService();
        CurrencyController controller = new CurrencyController(service);

        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.USD);
        ConversionResponse response = controller.convert(request);

        assertNotNull(response);
        assertEquals("USD", response.from());
        assertEquals("USD", response.to());
        assertEquals(100.0, response.result());
    }

    @Test
    @DisplayName("Controller convert should handle EUR to GBP")
    void testConvertEurToGbp() {
        ExchangeRateService service = new ExchangeRateService();
        CurrencyController controller = new CurrencyController(service);

        ConversionRequest request = new ConversionRequest(100.0, Currency.EUR, Currency.GBP);
        ConversionResponse response = controller.convert(request);

        assertNotNull(response);
        assertEquals("EUR", response.from());
        assertEquals("GBP", response.to());
        assertEquals(85.87, response.result());
    }

    @Test
    @DisplayName("Controller convert should handle zero amount")
    void testConvertZeroAmount() {
        ExchangeRateService service = new ExchangeRateService();
        CurrencyController controller = new CurrencyController(service);

        ConversionRequest request = new ConversionRequest(0.0, Currency.USD, Currency.EUR);
        ConversionResponse response = controller.convert(request);

        assertNotNull(response);
        assertEquals(0.0, response.amount());
        assertEquals(0.0, response.result());
    }

    @Test
    @DisplayName("Controller should handle all currency pairs")
    void testAllCurrencyPairs() {
        ExchangeRateService service = new ExchangeRateService();
        CurrencyController controller = new CurrencyController(service);

        for (Currency from : Currency.values()) {
            for (Currency to : Currency.values()) {
                ConversionRequest request = new ConversionRequest(100.0, from, to);
                ConversionResponse response = controller.convert(request);

                assertNotNull(response);
                assertEquals(from.name(), response.from());
                assertEquals(to.name(), response.to());
            }
        }
    }

    @Test
    @DisplayName("Controller constructor should accept ExchangeRateService")
    void testConstructor() {
        ExchangeRateService service = new ExchangeRateService();
        CurrencyController controller = new CurrencyController(service);

        assertNotNull(controller);
    }

    @Test
    @DisplayName("Controller convert should delegate to service")
    void testConvertDelegation() {
        // Create a mock service
        ExchangeRateService mockService = new ExchangeRateService();
        CurrencyController controller = new CurrencyController(mockService);

        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
        ConversionResponse response = controller.convert(request);

        // Verify the service was called by checking the response
        assertNotNull(response);
        assertEquals("USD", response.from());
        assertEquals("EUR", response.to());
    }
}