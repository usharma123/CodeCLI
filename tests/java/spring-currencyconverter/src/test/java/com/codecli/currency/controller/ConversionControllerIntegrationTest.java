package com.codecli.currency.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ConversionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testConvertEndpointSuccess() throws Exception {
        mockMvc.perform(get("/api/convert")
                        .param("from", "USD")
                        .param("to", "EUR")
                        .param("amount", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").value("USD"))
                .andExpect(jsonPath("$.to").value("EUR"))
                .andExpect(jsonPath("$.amount").value(100))
                .andExpect(jsonPath("$.convertedAmount").value(92.00))
                .andExpect(jsonPath("$.rate").value(0.92));
    }

    @Test
    void testConvertEndpointCaseInsensitive() throws Exception {
        mockMvc.perform(get("/api/convert")
                        .param("from", "usd")
                        .param("to", "eur")
                        .param("amount", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").value("USD"))
                .andExpect(jsonPath("$.to").value("EUR"));
    }

    @Test
    void testConvertEndpointUSDToGBP() throws Exception {
        mockMvc.perform(get("/api/convert")
                        .param("from", "USD")
                        .param("to", "GBP")
                        .param("amount", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").value("USD"))
                .andExpect(jsonPath("$.to").value("GBP"))
                .andExpect(jsonPath("$.convertedAmount").value(79.00));
    }

    @Test
    void testConvertEndpointUSDToJPY() throws Exception {
        mockMvc.perform(get("/api/convert")
                        .param("from", "USD")
                        .param("to", "JPY")
                        .param("amount", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.convertedAmount").value(15000.00));
    }

    @Test
    void testConvertEndpointWithDecimalAmount() throws Exception {
        mockMvc.perform(get("/api/convert")
                        .param("from", "USD")
                        .param("to", "EUR")
                        .param("amount", "123.45"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(123.45))
                .andExpect(jsonPath("$.convertedAmount").value(113.57));
    }

    @Test
    void testConvertEndpointWithZeroAmount() throws Exception {
        mockMvc.perform(get("/api/convert")
                        .param("from", "USD")
                        .param("to", "EUR")
                        .param("amount", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.convertedAmount").value(0.00));
    }

    @Test
    void testConvertEndpointWithNegativeAmount() throws Exception {
        mockMvc.perform(get("/api/convert")
                        .param("from", "USD")
                        .param("to", "EUR")
                        .param("amount", "-100"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testConvertEndpointWithUnsupportedFromCurrency() throws Exception {
        mockMvc.perform(get("/api/convert")
                        .param("from", "XXX")
                        .param("to", "EUR")
                        .param("amount", "100"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testConvertEndpointWithUnsupportedToCurrency() throws Exception {
        mockMvc.perform(get("/api/convert")
                        .param("from", "USD")
                        .param("to", "XXX")
                        .param("amount", "100"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testConvertEndpointMissingFromParameter() throws Exception {
        mockMvc.perform(get("/api/convert")
                        .param("to", "EUR")
                        .param("amount", "100"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testConvertEndpointMissingToParameter() throws Exception {
        mockMvc.perform(get("/api/convert")
                        .param("from", "USD")
                        .param("amount", "100"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testConvertEndpointMissingAmountParameter() throws Exception {
        mockMvc.perform(get("/api/convert")
                        .param("from", "USD")
                        .param("to", "EUR"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testConvertEndpointInvalidAmountFormat() throws Exception {
        mockMvc.perform(get("/api/convert")
                        .param("from", "USD")
                        .param("to", "EUR")
                        .param("amount", "invalid"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testConvertEndpointAllSupportedCurrencies() throws Exception {
        String[] currencies = {"USD", "EUR", "GBP", "JPY", "INR", "CAD", "AUD"};
        
        for (String currency : currencies) {
            mockMvc.perform(get("/api/convert")
                            .param("from", "USD")
                            .param("to", currency)
                            .param("amount", "100"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.from").value("USD"))
                    .andExpect(jsonPath("$.to").value(currency));
        }
    }

    @Test
    void testConvertEndpointSameCurrency() throws Exception {
        mockMvc.perform(get("/api/convert")
                        .param("from", "USD")
                        .param("to", "USD")
                        .param("amount", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.convertedAmount").value(100.00))
                .andExpect(jsonPath("$.rate").value(1.0));
    }

    @Test
    void testConvertEndpointEURToGBP() throws Exception {
        mockMvc.perform(get("/api/convert")
                        .param("from", "EUR")
                        .param("to", "GBP")
                        .param("amount", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").value("EUR"))
                .andExpect(jsonPath("$.to").value("GBP"))
                .andExpect(jsonPath("$.convertedAmount").exists())
                .andExpect(jsonPath("$.rate").exists());
    }
}
