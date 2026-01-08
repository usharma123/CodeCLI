package com.example.currency.controller;

import com.example.currency.model.ConversionRequest;
import com.example.currency.model.ConversionResponse;
import com.example.currency.model.Currency;
import com.example.currency.service.ExchangeRateService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CurrencyController.class)
@DisplayName("CurrencyController Tests")
class CurrencyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ExchangeRateService exchangeRateService;

    @Nested
    @DisplayName("Convert Endpoint Tests")
    class ConvertEndpointTests {

        @Test
        @DisplayName("Should successfully convert USD to EUR")
        void shouldSuccessfullyConvertUsdToEur() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.amount").value(100.0))
                    .andExpect(jsonPath("$.from").value("USD"))
                    .andExpect(jsonPath("$.to").value("EUR"))
                    .andExpect(jsonPath("$.result").value(92.0))
                    .andExpect(jsonPath("$.rate").value(0.92));

            verify(exchangeRateService, times(1)).convert(any(ConversionRequest.class));
        }

        @Test
        @DisplayName("Should successfully convert EUR to USD")
        void shouldSuccessfullyConvertEurToUsd() throws Exception {
            ConversionRequest request = new ConversionRequest(92.0, Currency.EUR, Currency.USD);
            ConversionResponse response = new ConversionResponse(92.0, "EUR", "USD", 100.0, 1.087);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").value(92.0))
                    .andExpect(jsonPath("$.from").value("EUR"))
                    .andExpect(jsonPath("$.to").value("USD"))
                    .andExpect(jsonPath("$.result").value(100.0));

            verify(exchangeRateService, times(1)).convert(any(ConversionRequest.class));
        }

        @Test
        @DisplayName("Should handle zero amount conversion")
        void shouldHandleZeroAmountConversion() throws Exception {
            ConversionRequest request = new ConversionRequest(0.0, Currency.USD, Currency.EUR);
            ConversionResponse response = new ConversionResponse(0.0, "USD", "EUR", 0.0, 0.92);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").value(0.0))
                    .andExpect(jsonPath("$.result").value(0.0));

            verify(exchangeRateService, times(1)).convert(any(ConversionRequest.class));
        }

        @Test
        @DisplayName("Should handle large amount conversion")
        void shouldHandleLargeAmountConversion() throws Exception {
            ConversionRequest request = new ConversionRequest(1000000.0, Currency.USD, Currency.EUR);
            ConversionResponse response = new ConversionResponse(1000000.0, "USD", "EUR", 920000.0, 0.92);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").value(1000000.0))
                    .andExpect(jsonPath("$.result").value(920000.0));

            verify(exchangeRateService, times(1)).convert(any(ConversionRequest.class));
        }

        @Test
        @DisplayName("Should handle decimal amount conversion")
        void shouldHandleDecimalAmountConversion() throws Exception {
            ConversionRequest request = new ConversionRequest(123.45, Currency.USD, Currency.EUR);
            ConversionResponse response = new ConversionResponse(123.45, "USD", "EUR", 113.57, 0.92);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").value(123.45))
                    .andExpect(jsonPath("$.result").value(113.57));

            verify(exchangeRateService, times(1)).convert(any(ConversionRequest.class));
        }

        @Test
        @DisplayName("Should handle same currency conversion")
        void shouldHandleSameCurrencyConversion() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.USD);
            ConversionResponse response = new ConversionResponse(100.0, "USD", "USD", 100.0, 1.0);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.rate").value(1.0))
                    .andExpect(jsonPath("$.result").value(100.0));

            verify(exchangeRateService, times(1)).convert(any(ConversionRequest.class));
        }
    }

    @Nested
    @DisplayName("All Currency Conversion Tests")
    class AllCurrencyConversionTests {

        @Test
        @DisplayName("Should convert GBP to JPY")
        void shouldConvertGbpToJpy() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.GBP, Currency.JPY);
            ConversionResponse response = new ConversionResponse(100.0, "GBP", "JPY", 18924.05, 189.24);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.from").value("GBP"))
                    .andExpect(jsonPath("$.to").value("JPY"));

            verify(exchangeRateService, times(1)).convert(any(ConversionRequest.class));
        }

        @Test
        @DisplayName("Should convert CAD to AUD")
        void shouldConvertCadToAud() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.CAD, Currency.AUD);
            ConversionResponse response = new ConversionResponse(100.0, "CAD", "AUD", 113.33, 1.1333);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.from").value("CAD"))
                    .andExpect(jsonPath("$.to").value("AUD"));

            verify(exchangeRateService, times(1)).convert(any(ConversionRequest.class));
        }

        @Test
        @DisplayName("Should convert CHF to CNY")
        void shouldConvertChfToCny() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.CHF, Currency.CNY);
            ConversionResponse response = new ConversionResponse(100.0, "CHF", "CNY", 822.73, 8.2273);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.from").value("CHF"))
                    .andExpect(jsonPath("$.to").value("CNY"));

            verify(exchangeRateService, times(1)).convert(any(ConversionRequest.class));
        }

        @Test
        @DisplayName("Should convert INR to MXN")
        void shouldConvertInrToMxn() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.INR, Currency.MXN);
            ConversionResponse response = new ConversionResponse(100.0, "INR", "MXN", 20.63, 0.2063);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.from").value("INR"))
                    .andExpect(jsonPath("$.to").value("MXN"));

            verify(exchangeRateService, times(1)).convert(any(ConversionRequest.class));
        }
    }

    @Nested
    @DisplayName("Service Integration Tests")
    class ServiceIntegrationTests {

        @Test
        @DisplayName("Should call exchange rate service exactly once")
        void shouldCallExchangeRateServiceExactlyOnce() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            verify(exchangeRateService, times(1)).convert(any(ConversionRequest.class));
            verifyNoMoreInteractions(exchangeRateService);
        }

        @Test
        @DisplayName("Should pass correct request to service")
        void shouldPassCorrectRequestToService() throws Exception {
            ConversionRequest request = new ConversionRequest(250.50, Currency.GBP, Currency.EUR);
            ConversionResponse response = new ConversionResponse(250.50, "GBP", "EUR", 291.79, 1.1647);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            verify(exchangeRateService).convert(argThat(req ->
                    req.amount() == 250.50 &&
                    req.from() == Currency.GBP &&
                    req.to() == Currency.EUR
            ));
        }
    }

    @Nested
    @DisplayName("Request Validation Tests")
    class RequestValidationTests {

        @Test
        @DisplayName("Should return 400 for malformed JSON")
        void shouldReturn400ForMalformedJson() throws Exception {
            mockMvc.perform(post("/api/convert")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{invalid json}"))
                    .andExpect(status().isBadRequest());

            verify(exchangeRateService, never()).convert(any(ConversionRequest.class));
        }

        @Test
        @DisplayName("Should return 400 for missing request body")
        void shouldReturn400ForMissingRequestBody() throws Exception {
            mockMvc.perform(post("/api/convert")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());

            verify(exchangeRateService, never()).convert(any(ConversionRequest.class));
        }
    }

    @Nested
    @DisplayName("Response Format Tests")
    class ResponseFormatTests {

        @Test
        @DisplayName("Should return JSON content type")
        void shouldReturnJsonContentType() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON));
        }

        @Test
        @DisplayName("Should return all required fields in response")
        void shouldReturnAllRequiredFieldsInResponse() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").exists())
                    .andExpect(jsonPath("$.from").exists())
                    .andExpect(jsonPath("$.to").exists())
                    .andExpect(jsonPath("$.result").exists())
                    .andExpect(jsonPath("$.rate").exists());
        }
    }
}
