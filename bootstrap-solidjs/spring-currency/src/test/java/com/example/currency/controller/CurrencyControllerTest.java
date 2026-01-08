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

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
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
    @DisplayName("POST /api/convert tests")
    class ConvertEndpointTests {

        @Test
        @DisplayName("should return 200 and conversion response for valid request")
        void shouldReturnConversionResponseForValidRequest() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse expectedResponse = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(expectedResponse);

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

            verify(exchangeRateService).convert(any(ConversionRequest.class));
        }

        @Test
        @DisplayName("should return 200 for same currency conversion")
        void shouldReturnOkForSameCurrencyConversion() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.USD);
            ConversionResponse expectedResponse = new ConversionResponse(100.0, "USD", "USD", 100.0, 1.0);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(expectedResponse);

            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").value(100.0))
                    .andExpect(jsonPath("$.from").value("USD"))
                    .andExpect(jsonPath("$.to").value("USD"))
                    .andExpect(jsonPath("$.result").value(100.0))
                    .andExpect(jsonPath("$.rate").value(1.0));
        }

        @Test
        @DisplayName("should return 200 for EUR to JPY conversion")
        void shouldReturnOkForEurToJpyConversion() throws Exception {
            ConversionRequest request = new ConversionRequest(50.0, Currency.EUR, Currency.JPY);
            ConversionResponse expectedResponse = new ConversionResponse(50.0, "EUR", "JPY", 8114.13, 162.2826);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(expectedResponse);

            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").value(50.0))
                    .andExpect(jsonPath("$.from").value("EUR"))
                    .andExpect(jsonPath("$.to").value("JPY"))
                    .andExpect(jsonPath("$.result").value(8114.13));
        }

        @Test
        @DisplayName("should return 200 for zero amount")
        void shouldReturnOkForZeroAmount() throws Exception {
            ConversionRequest request = new ConversionRequest(0.0, Currency.USD, Currency.EUR);
            ConversionResponse expectedResponse = new ConversionResponse(0.0, "USD", "EUR", 0.0, 0.92);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(expectedResponse);

            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").value(0.0))
                    .andExpect(jsonPath("$.result").value(0.0));
        }

        @Test
        @DisplayName("should call ExchangeService with correct request")
        void shouldCallExchangeServiceWithCorrectRequest() throws Exception {
            ConversionRequest request = new ConversionRequest(75.50, Currency.GBP, Currency.CHF);

            when(exchangeRateService.convert(any(ConversionRequest.class)))
                    .thenReturn(new ConversionResponse(75.50, "GBP", "CHF", 66.55, 0.881));

            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            verify(exchangeRateService).convert(any(ConversionRequest.class));
        }
    }

    @Nested
    @DisplayName("Request mapping tests")
    class RequestMappingTests {

        @Test
        @DisplayName("should be mapped to /api/convert")
        void shouldBeMappedToApiConvert() throws Exception {
            ConversionRequest request = new ConversionRequest(10.0, Currency.USD, Currency.EUR);
            ConversionResponse response = new ConversionResponse(10.0, "USD", "EUR", 9.2, 0.92);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(response);

            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("Constructor injection tests")
    class ConstructorInjectionTests {

        @Test
        @DisplayName("should be constructable with ExchangeRateService")
        void shouldBeConstructableWithExchangeRateService() {
            ExchangeRateService service = new ExchangeRateService();
            CurrencyController controller = new CurrencyController(service);

            assertNotNull(controller);
        }
    }
}
