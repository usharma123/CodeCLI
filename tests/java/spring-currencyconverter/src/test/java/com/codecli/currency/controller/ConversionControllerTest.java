package com.codecli.currency.controller;

import com.codecli.currency.model.ConversionResponse;
import com.codecli.currency.service.ConversionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for ConversionController using standalone MockMvc
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConversionController Tests")
class ConversionControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ConversionService conversionService;

    @InjectMocks
    private ConversionController conversionController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(conversionController).build();
    }

    @Nested
    @DisplayName("GET /api/convert endpoint tests")
    class ConvertEndpointTests {

        @Test
        @DisplayName("Should return successful conversion response")
        void shouldReturnSuccessfulConversionResponse() throws Exception {
            when(conversionService.convert(eq("USD"), eq("EUR"), any(BigDecimal.class)))
                    .thenReturn(new BigDecimal("92.00"));
            when(conversionService.rate(eq("USD"), eq("EUR")))
                    .thenReturn(new BigDecimal("0.92"));

            mockMvc.perform(get("/api/convert")
                            .param("from", "USD")
                            .param("to", "EUR")
                            .param("amount", "100")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$.from").value("USD"))
                    .andExpect(jsonPath("$.to").value("EUR"))
                    .andExpect(jsonPath("$.amount").value(100))
                    .andExpect(jsonPath("$.convertedAmount").value(92.00))
                    .andExpect(jsonPath("$.rate").value(0.92));
        }

        @Test
        @DisplayName("Should handle case-insensitive currency codes")
        void shouldHandleCaseInsensitiveCurrencyCodes() throws Exception {
            when(conversionService.convert(eq("usd"), eq("eur"), any(BigDecimal.class)))
                    .thenReturn(new BigDecimal("92.00"));
            when(conversionService.rate(eq("usd"), eq("eur")))
                    .thenReturn(new BigDecimal("0.92"));

            mockMvc.perform(get("/api/convert")
                            .param("from", "usd")
                            .param("to", "eur")
                            .param("amount", "100")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.from").value("USD"))
                    .andExpect(jsonPath("$.to").value("EUR"));
        }

        @Test
        @DisplayName("Should handle conversion to GBP")
        void shouldHandleConversionToGbp() throws Exception {
            when(conversionService.convert(eq("USD"), eq("GBP"), any(BigDecimal.class)))
                    .thenReturn(new BigDecimal("79.00"));
            when(conversionService.rate(eq("USD"), eq("GBP")))
                    .thenReturn(new BigDecimal("0.79"));

            mockMvc.perform(get("/api/convert")
                            .param("from", "USD")
                            .param("to", "GBP")
                            .param("amount", "100")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.from").value("USD"))
                    .andExpect(jsonPath("$.to").value("GBP"))
                    .andExpect(jsonPath("$.convertedAmount").value(79.00));
        }

        @Test
        @DisplayName("Should handle decimal amounts")
        void shouldHandleDecimalAmounts() throws Exception {
            when(conversionService.convert(eq("USD"), eq("EUR"), any(BigDecimal.class)))
                    .thenReturn(new BigDecimal("46.00"));
            when(conversionService.rate(eq("USD"), eq("EUR")))
                    .thenReturn(new BigDecimal("0.92"));

            mockMvc.perform(get("/api/convert")
                            .param("from", "USD")
                            .param("to", "EUR")
                            .param("amount", "50.50")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").value(50.50))
                    .andExpect(jsonPath("$.convertedAmount").value(46.00));
        }

        @Test
        @DisplayName("Should return correct conversion response structure")
        void shouldReturnCorrectConversionResponseStructure() throws Exception {
            when(conversionService.convert(eq("EUR"), eq("JPY"), any(BigDecimal.class)))
                    .thenReturn(new BigDecimal("16292.68"));
            when(conversionService.rate(eq("EUR"), eq("JPY")))
                    .thenReturn(new BigDecimal("162.9268"));

            mockMvc.perform(get("/api/convert")
                            .param("from", "EUR")
                            .param("to", "JPY")
                            .param("amount", "100")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").isNotEmpty())
                    .andExpect(jsonPath("$.from").exists())
                    .andExpect(jsonPath("$.to").exists())
                    .andExpect(jsonPath("$.amount").exists())
                    .andExpect(jsonPath("$.convertedAmount").exists())
                    .andExpect(jsonPath("$.rate").exists());
        }

        @Test
        @DisplayName("Should convert from JPY to INR correctly")
        void shouldConvertJpyToInr() throws Exception {
            when(conversionService.convert(eq("JPY"), eq("INR"), any(BigDecimal.class)))
                    .thenReturn(new BigDecimal("55.33"));
            when(conversionService.rate(eq("JPY"), eq("INR")))
                    .thenReturn(new BigDecimal("0.553333"));

            mockMvc.perform(get("/api/convert")
                            .param("from", "JPY")
                            .param("to", "INR")
                            .param("amount", "100")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.from").value("JPY"))
                    .andExpect(jsonPath("$.to").value("INR"))
                    .andExpect(jsonPath("$.convertedAmount").value(55.33));
        }
    }
}
