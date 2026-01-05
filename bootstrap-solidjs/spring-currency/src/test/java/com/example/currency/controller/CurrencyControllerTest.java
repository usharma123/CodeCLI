package com.example.currency.controller;

import com.example.currency.model.ConversionRequest;
import com.example.currency.model.ConversionResponse;
import com.example.currency.model.Currency;
import com.example.currency.service.ExchangeRateService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * CurrencyController tests using MockMvc with the real ExchangeRateService.
 * Uses standalone MockMvc setup - no Spring context or Mockito required.
 * Compatible with Java 25.
 */
@DisplayName("CurrencyController Tests")
class CurrencyControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private ExchangeRateService service;

    @BeforeEach
    void setUp() {
        service = new ExchangeRateService();
        CurrencyController controller = new CurrencyController(service);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Should return successful conversion response")
    void convertSuccess() throws Exception {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

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
    @DisplayName("Should handle JPY conversion")
    void convertJpy() throws Exception {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.JPY);

        mockMvc.perform(post("/api/convert")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value(14950.0))
                .andExpect(jsonPath("$.rate").value(149.5));
    }

    @Test
    @DisplayName("Should handle same currency conversion")
    void sameCurrency() throws Exception {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.USD);

        mockMvc.perform(post("/api/convert")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result").value(100.0))
                .andExpect(jsonPath("$.rate").value(1.0));
    }

    @Test
    @DisplayName("Should handle GBP to EUR conversion")
    void gbpToEur() throws Exception {
        ConversionRequest request = new ConversionRequest(100.0, Currency.GBP, Currency.EUR);

        mockMvc.perform(post("/api/convert")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").value("GBP"))
                .andExpect(jsonPath("$.to").value("EUR"))
                .andExpect(jsonPath("$.result").value(116.46));
    }
}
