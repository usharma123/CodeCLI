package com.example.currency.controller;

import com.example.currency.model.ConversionRequest;
import com.example.currency.model.ConversionResponse;
import com.example.currency.model.Currency;
import com.example.currency.service.ExchangeRateService;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CurrencyControllerTest {

    @Nested
    @DisplayName("Controller Injection Tests")
    class ControllerInjectionTests {

        @Test
        @DisplayName("Controller should be created with ExchangeRateService")
        void controllerShouldBeCreatedWithExchangeRateService() {
            ExchangeRateService service = new ExchangeRateService();
            CurrencyController controller = new CurrencyController(service);
            assertNotNull(controller);
        }

        @Test
        @DisplayName("Controller should accept null service without immediate exception")
        void controllerShouldAcceptNullServiceWithoutImmediateException() {
            // Controller constructor doesn't throw immediately, NPE occurs when service is used
            assertDoesNotThrow(() -> new CurrencyController(null));
        }
    }

    @Nested
    @DisplayName("Request Mapping Tests")
    class RequestMappingTests {

        @Test
        @DisplayName("Should map to /api/convert endpoint")
        void shouldMapToApiConvertEndpoint() throws Exception {
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
            ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

            ExchangeRateService mockService = org.mockito.Mockito.mock(ExchangeRateService.class);
            when(mockService.convert(any(ConversionRequest.class))).thenReturn(response);
            CurrencyController controller = new CurrencyController(mockService);

            MockMvc testMvc = MockMvcBuilders.standaloneSetup(controller).build();

            testMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(new ObjectMapper().writeValueAsString(request)))
                    .andExpect(status().isOk());
        }
    }
}
