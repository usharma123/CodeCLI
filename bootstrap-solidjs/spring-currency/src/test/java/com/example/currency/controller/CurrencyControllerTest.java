package com.example.currency.controller;

import com.example.currency.model.ConversionRequest;
import com.example.currency.model.ConversionResponse;
import com.example.currency.model.Currency;
import com.example.currency.service.ExchangeRateService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CurrencyController Tests")
class CurrencyControllerTest {

    @Mock
    private ExchangeRateService exchangeRateService;

    @InjectMocks
    private CurrencyController controller;

    @Nested
    @DisplayName("ControllerInstantiationTests")
    class ControllerInstantiationTests {

        @Test
        @DisplayName("controller should be instantiable with ExchangeRateService")
        void controllerShouldBeInstantiableWithExchangeRateService() {
            assertNotNull(controller);
        }

        @Test
        @DisplayName("controller should use injected ExchangeRateService")
        void controllerShouldUseInjectedExchangeRateService() {
            CurrencyController testController = new CurrencyController(exchangeRateService);
            assertNotNull(testController);
        }

        @Test
        @DisplayName("controller should accept null service without throwing")
        void controllerShouldAcceptNullServiceWithoutThrowing() {
            // Controller constructor accepts null without throwing
            // NullPointerException would occur when methods are called
            assertDoesNotThrow(() -> new CurrencyController(null));
        }
    }

    @Nested
    @DisplayName("ConvertEndpointTests")
    class ConvertEndpointTests {

        @Test
        @DisplayName("convert should delegate to ExchangeRateService")
        void convertShouldDelegateToExchangeRateService() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse expectedResponse = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            when(exchangeRateService.convert(any(ConversionRequest.class)))
                .thenReturn(expectedResponse);

            ConversionResponse response = controller.convert(request);

            assertNotNull(response);
            assertEquals(100.0, response.amount());
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(92.0, response.result());

            verify(exchangeRateService, times(1)).convert(request);
        }

        @Test
        @DisplayName("convert should return same response from service")
        void convertShouldReturnSameResponseFromService() {
            ConversionRequest request = new ConversionRequest(50.0, Currency.EUR, Currency.GBP);
            ConversionResponse expectedResponse = new ConversionResponse(50.0, "EUR", "GBP", 42.93, 0.8586);

            when(exchangeRateService.convert(any(ConversionRequest.class)))
                .thenReturn(expectedResponse);

            ConversionResponse response = controller.convert(request);

            assertEquals(expectedResponse, response);
        }

        @Test
        @DisplayName("convert should pass through all request fields")
        void convertShouldPassThroughAllRequestFields() {
            ConversionRequest request = new ConversionRequest(75.5, Currency.JPY, Currency.CHF);
            ConversionResponse expectedResponse = new ConversionResponse(75.5, "JPY", "CHF", 0.44, 0.0058);

            when(exchangeRateService.convert(any(ConversionRequest.class)))
                .thenReturn(expectedResponse);

            ConversionResponse response = controller.convert(request);

            assertEquals(75.5, response.amount());
            assertEquals("JPY", response.from());
            assertEquals("CHF", response.to());
        }

        @Test
        @DisplayName("convert should handle zero amount")
        void convertShouldHandleZeroAmount() {
            ConversionRequest request = new ConversionRequest(0.0, Currency.USD, Currency.EUR);
            ConversionResponse expectedResponse = new ConversionResponse(0.0, "USD", "EUR", 0.0, 0.92);

            when(exchangeRateService.convert(any(ConversionRequest.class)))
                .thenReturn(expectedResponse);

            ConversionResponse response = controller.convert(request);

            assertEquals(0.0, response.amount());
            assertEquals(0.0, response.result());
        }

        @Test
        @DisplayName("convert should handle same currency")
        void convertShouldHandleSameCurrency() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.USD);
            ConversionResponse expectedResponse = new ConversionResponse(100.0, "USD", "USD", 100.0, 1.0);

            when(exchangeRateService.convert(any(ConversionRequest.class)))
                .thenReturn(expectedResponse);

            ConversionResponse response = controller.convert(request);

            assertEquals(100.0, response.result());
            assertEquals(1.0, response.rate());
        }

        @Test
        @DisplayName("convert should call service for all currency pairs")
        void convertShouldCallServiceForAllCurrencyPairs() {
            for (Currency from : Currency.values()) {
                for (Currency to : Currency.values()) {
                    ConversionRequest request = new ConversionRequest(100.0, from, to);
                    ConversionResponse expectedResponse = new ConversionResponse(
                        100.0, from.name(), to.name(), 100.0, 1.0);

                    when(exchangeRateService.convert(any(ConversionRequest.class)))
                        .thenReturn(expectedResponse);

                    ConversionResponse response = controller.convert(request);

                    verify(exchangeRateService, times(1)).convert(request);
                }
            }
        }

        @Test
        @DisplayName("convert should propagate service exceptions")
        void convertShouldPropagateServiceExceptions() {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            when(exchangeRateService.convert(any(ConversionRequest.class)))
                .thenThrow(new RuntimeException("Service error"));

            assertThrows(RuntimeException.class, () -> controller.convert(request));
        }

        @Test
        @DisplayName("convert should work with large decimal amounts")
        void convertShouldWorkWithLargeDecimalAmounts() {
            ConversionRequest request = new ConversionRequest(999999.99, Currency.GBP, Currency.JPY);
            ConversionResponse expectedResponse = new ConversionResponse(
                999999.99, "GBP", "JPY", 189246.22, 189.2464);

            when(exchangeRateService.convert(any(ConversionRequest.class)))
                .thenReturn(expectedResponse);

            ConversionResponse response = controller.convert(request);

            assertEquals(999999.99, response.amount());
        }
    }
}