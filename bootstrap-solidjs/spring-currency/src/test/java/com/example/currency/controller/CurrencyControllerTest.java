package com.example.currency.controller;

import com.example.currency.model.ConversionRequest;
import com.example.currency.model.ConversionResponse;
import com.example.currency.model.Currency;
import com.example.currency.service.ExchangeRateService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
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

    private CurrencyController controller;

    @BeforeEach
    void setUp() {
        controller = new CurrencyController(exchangeRateService);
    }

    @Nested
    @DisplayName("Convert Endpoint Tests")
    class ConvertEndpointTests {

        @Test
        @DisplayName("should return 200 and correct response for valid request")
        void shouldReturn200AndCorrectResponseForValidRequest() throws Exception {
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
        }

        @Test
        @DisplayName("should handle same currency conversion")
        void shouldHandleSameCurrencyConversion() throws Exception {
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
        @DisplayName("should handle EUR to GBP conversion")
        void shouldHandleEURToGBPConversion() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.EUR, Currency.GBP);
            ConversionResponse expectedResponse = new ConversionResponse(100.0, "EUR", "GBP", 85.87, 0.8587);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(expectedResponse);

            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").value(100.0))
                    .andExpect(jsonPath("$.from").value("EUR"))
                    .andExpect(jsonPath("$.to").value("GBP"))
                    .andExpect(jsonPath("$.result").value(85.87));
        }

        @Test
        @DisplayName("should handle zero amount")
        void shouldHandleZeroAmount() throws Exception {
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
        @DisplayName("should handle large amount")
        void shouldHandleLargeAmount() throws Exception {
            ConversionRequest request = new ConversionRequest(1000000.0, Currency.USD, Currency.EUR);
            ConversionResponse expectedResponse = new ConversionResponse(1000000.0, "USD", "EUR", 920000.0, 0.92);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(expectedResponse);

            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").value(1000000.0))
                    .andExpect(jsonPath("$.result").value(920000.0));
        }

        @Test
        @DisplayName("should handle negative amount")
        void shouldHandleNegativeAmount() throws Exception {
            ConversionRequest request = new ConversionRequest(-50.0, Currency.EUR, Currency.USD);
            ConversionResponse expectedResponse = new ConversionResponse(-50.0, "EUR", "USD", -54.35, 1.087);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(expectedResponse);

            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").value(-50.0))
                    .andExpect(jsonPath("$.result").value(-54.35));
        }

        @Test
        @DisplayName("should handle JPY to CNY conversion")
        void shouldHandleJPYToCNYConversion() throws Exception {
            ConversionRequest request = new ConversionRequest(10000.0, Currency.JPY, Currency.CNY);
            ConversionResponse expectedResponse = new ConversionResponse(10000.0, "JPY", "CNY", 500.0, 0.05);

            when(exchangeRateService.convert(any(ConversionRequest.class))).thenReturn(expectedResponse);

            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").value(10000.0))
                    .andExpect(jsonPath("$.from").value("JPY"))
                    .andExpect(jsonPath("$.to").value("CNY"));
        }
    }

    @Nested
    @DisplayName("Controller Instantiation Tests")
    class ControllerInstantiationTests {

        @Test
        @DisplayName("should instantiate controller with service")
        void shouldInstantiateControllerWithService() {
            ExchangeRateService service = new ExchangeRateService();
            CurrencyController localController = new CurrencyController(service);

            assertNotNull(localController);
        }

        @Test
        @DisplayName("should throw NullPointerException when service is null during convert call")
        void shouldThrowNullPointerExceptionWhenServiceIsNullDuringConvertCall() {
            CurrencyController controllerWithNullService = new CurrencyController(null);
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            assertThrows(NullPointerException.class, () -> {
                controllerWithNullService.convert(request);
            });
        }
    }
}
