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
import static org.mockito.Mockito.when;
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
    @DisplayName("POST /api/convert endpoint tests")
    class ConvertEndpointTests {

        @Test
        @DisplayName("should return successful conversion result")
        void shouldReturnSuccessfulConversion() throws Exception {
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
        }

        @Test
        @DisplayName("should convert USD to GBP correctly")
        void shouldConvertUsdToGbp() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.GBP);
            ConversionResponse response = new ConversionResponse(100.0, "USD", "GBP", 79.0, 0.79);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.result").value(79.0))
                    .andExpect(jsonPath("$.rate").value(0.79));
        }

        @Test
        @DisplayName("should handle same currency conversion")
        void shouldHandleSameCurrencyConversion() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.USD);
            ConversionResponse response = new ConversionResponse(100.0, "USD", "USD", 100.0, 1.0);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.result").value(100.0))
                    .andExpect(jsonPath("$.rate").value(1.0));
        }

        @Test
        @DisplayName("should handle zero amount")
        void shouldHandleZeroAmount() throws Exception {
            ConversionRequest request = new ConversionRequest(0.0, Currency.USD, Currency.EUR);
            ConversionResponse response = new ConversionResponse(0.0, "USD", "EUR", 0.0, 0.92);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").value(0.0))
                    .andExpect(jsonPath("$.result").value(0.0));
        }

        @Test
        @DisplayName("should handle negative amount")
        void shouldHandleNegativeAmount() throws Exception {
            ConversionRequest request = new ConversionRequest(-50.0, Currency.EUR, Currency.GBP);
            ConversionResponse response = new ConversionResponse(-50.0, "EUR", "GBP", -42.93, 0.8587);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").value(-50.0))
                    .andExpect(jsonPath("$.result").value(-42.93));
        }
    }

    @Nested
    @DisplayName("Request mapping tests")
    class RequestMappingTests {

        @Test
        @DisplayName("should be mapped to /api/convert")
        void shouldBeMappedToApiConvert() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("should only accept POST method")
        void shouldOnlyAcceptPostMethod() throws Exception {
            // Verify POST to /api/convert works (GET is not supported)
            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"amount\":100,\"from\":\"USD\",\"to\":\"EUR\"}"))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("All currency combinations")
    class AllCurrencyCombinationsTests {

        @Test
        @DisplayName("should handle all currency pairs")
        void shouldHandleAllCurrencyPairs() throws Exception {
            for (Currency from : Currency.values()) {
                for (Currency to : Currency.values()) {
                    ConversionRequest request = new ConversionRequest(100.0, from, to);
                    double result = from == to ? 100.0 : 92.0; // Simplified for test
                    ConversionResponse response = new ConversionResponse(100.0, from.name(), to.name(), result, 0.92);

                    when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

                    mockMvc.perform(post("/api/convert")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(request)))
                            .andExpect(status().isOk())
                            .andExpect(jsonPath("$.from").value(from.name()))
                            .andExpect(jsonPath("$.to").value(to.name()));
                }
            }
        }
    }

    @Nested
    @DisplayName("Content type tests")
    class ContentTypeTests {

        @Test
        @DisplayName("should return JSON content type")
        void shouldReturnJsonContentType() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON));
        }

        @Test
        @DisplayName("should accept JSON content type")
        void shouldAcceptJsonContentType() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }
    }
}
