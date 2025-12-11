package com.codecli.currency.controller;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("ConversionController Integration Tests")
class ConversionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Should convert USD to EUR via API")
    void testConvertUsdToEurApi() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "USD")
                .param("to", "EUR")
                .param("amount", "100.00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").value("USD"))
                .andExpect(jsonPath("$.to").value("EUR"))
                .andExpect(jsonPath("$.amount").value(100.00))
                .andExpect(jsonPath("$.convertedAmount").value(92.00))
                .andExpect(jsonPath("$.rate").value(0.920000));
    }

    @Test
    @DisplayName("Should convert EUR to USD via API")
    void testConvertEurToUsdApi() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "EUR")
                .param("to", "USD")
                .param("amount", "92.00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").value("EUR"))
                .andExpect(jsonPath("$.to").value("USD"))
                .andExpect(jsonPath("$.amount").value(92.00))
                .andExpect(jsonPath("$.convertedAmount").value(100.00));
    }

    @Test
    @DisplayName("Should convert GBP to JPY via API")
    void testConvertGbpToJpyApi() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "GBP")
                .param("to", "JPY")
                .param("amount", "100.00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").value("GBP"))
                .andExpect(jsonPath("$.to").value("JPY"))
                .andExpect(jsonPath("$.amount").value(100.00))
                .andExpect(jsonPath("$.convertedAmount").exists())
                .andExpect(jsonPath("$.rate").exists());
    }

    @Test
    @DisplayName("Should handle lowercase currency codes")
    void testConvertWithLowercaseCodes() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "usd")
                .param("to", "eur")
                .param("amount", "100.00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").value("USD"))
                .andExpect(jsonPath("$.to").value("EUR"));
    }

    @Test
    @DisplayName("Should handle zero amount")
    void testConvertZeroAmount() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "USD")
                .param("to", "EUR")
                .param("amount", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.convertedAmount").value(0.00));
    }

    @Test
    @DisplayName("Should handle decimal amounts")
    void testConvertDecimalAmount() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "USD")
                .param("to", "EUR")
                .param("amount", "123.45"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(123.45))
                .andExpect(jsonPath("$.convertedAmount").exists());
    }

    @Test
    @DisplayName("Should handle same currency conversion")
    void testConvertSameCurrency() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "USD")
                .param("to", "USD")
                .param("amount", "100.00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").value("USD"))
                .andExpect(jsonPath("$.to").value("USD"))
                .andExpect(jsonPath("$.amount").value(100.00))
                .andExpect(jsonPath("$.convertedAmount").value(100.00))
                .andExpect(jsonPath("$.rate").value(1.000000));
    }

    @Test
    @DisplayName("Should return 400 for negative amount")
    void testConvertNegativeAmount() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "USD")
                .param("to", "EUR")
                .param("amount", "-100.00"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 400 for unsupported from currency")
    void testConvertUnsupportedFromCurrency() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "XXX")
                .param("to", "EUR")
                .param("amount", "100.00"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 400 for unsupported to currency")
    void testConvertUnsupportedToCurrency() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "USD")
                .param("to", "XXX")
                .param("amount", "100.00"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 400 for missing from parameter")
    void testConvertMissingFromParameter() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("to", "EUR")
                .param("amount", "100.00"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 400 for missing to parameter")
    void testConvertMissingToParameter() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "USD")
                .param("amount", "100.00"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should return 400 for missing amount parameter")
    void testConvertMissingAmountParameter() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "USD")
                .param("to", "EUR"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should convert CAD to AUD via API")
    void testConvertCadToAud() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "CAD")
                .param("to", "AUD")
                .param("amount", "100.00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").value("CAD"))
                .andExpect(jsonPath("$.to").value("AUD"))
                .andExpect(jsonPath("$.amount").value(100.00))
                .andExpect(jsonPath("$.convertedAmount").value(112.59));
    }

    @Test
    @DisplayName("Should convert INR to GBP via API")
    void testConvertInrToGbp() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "INR")
                .param("to", "GBP")
                .param("amount", "1000.00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from").value("INR"))
                .andExpect(jsonPath("$.to").value("GBP"))
                .andExpect(jsonPath("$.amount").value(1000.00))
                .andExpect(jsonPath("$.convertedAmount").exists())
                .andExpect(jsonPath("$.rate").exists());
    }

    @Test
    @DisplayName("Should handle large amounts")
    void testConvertLargeAmount() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "USD")
                .param("to", "JPY")
                .param("amount", "1000000.00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(1000000.00))
                .andExpect(jsonPath("$.convertedAmount").value(150000000.00));
    }

    @Test
    @DisplayName("Should handle very small amounts")
    void testConvertVerySmallAmount() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "USD")
                .param("to", "EUR")
                .param("amount", "0.01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(0.01))
                .andExpect(jsonPath("$.convertedAmount").exists());
    }
}
