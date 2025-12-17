package com.codecli.currency.controller;

import com.codecli.currency.service.ConversionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ConversionController.class)
@Import(ConversionService.class)
class ConversionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testConvertEndpoint() throws Exception {
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
    void testConvertEndpointInvalidCurrency() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "INVALID")
                .param("to", "EUR")
                .param("amount", "100"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testConvertEndpointMissingParams() throws Exception {
        mockMvc.perform(get("/api/convert")
                .param("from", "USD")
                .param("to", "EUR"))
                .andExpect(status().isBadRequest());
    }
}
