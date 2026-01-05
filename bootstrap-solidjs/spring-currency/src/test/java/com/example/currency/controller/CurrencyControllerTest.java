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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("CurrencyController Tests")
class CurrencyControllerTest {

    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    private ExchangeRateService exchangeRateService;

    private CurrencyController currencyController;

    @BeforeEach
    void setUp() {
        exchangeRateService = new ExchangeRateService();
        currencyController = new CurrencyController(exchangeRateService);
        mockMvc = MockMvcBuilders.standaloneSetup(currencyController).build();
        objectMapper = new ObjectMapper();
    }

    @Nested
    @DisplayName("POST /api/convert endpoint tests")
    class ConvertEndpointTests {

        @Test
        @DisplayName("Should return 200 OK for valid conversion request")
        void shouldReturnOkForValidRequest() throws Exception {
            // Arrange
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            // Act & Assert
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
        @DisplayName("Should convert USD to EUR correctly")
        void shouldConvertUsdToEur() throws Exception {
            // Arrange
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            // Act & Assert
            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.from").value("USD"))
                    .andExpect(jsonPath("$.to").value("EUR"))
                    .andExpect(jsonPath("$.result").value(92.0));
        }

        @Test
        @DisplayName("Should handle same currency conversion with rate 1.0")
        void shouldHandleSameCurrencyConversion() throws Exception {
            // Arrange
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.USD);

            // Act & Assert
            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.from").value("USD"))
                    .andExpect(jsonPath("$.to").value("USD"))
                    .andExpect(jsonPath("$.result").value(100.0))
                    .andExpect(jsonPath("$.rate").value(1.0));
        }

        @Test
        @DisplayName("Should convert USD to GBP correctly")
        void shouldConvertUsdToGbp() throws Exception {
            // Arrange
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.GBP);

            // Act & Assert
            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.from").value("USD"))
                    .andExpect(jsonPath("$.to").value("GBP"))
                    .andExpect(jsonPath("$.result").value(79.0))
                    .andExpect(jsonPath("$.rate").value(0.79));
        }

        @Test
        @DisplayName("Should convert EUR to JPY correctly")
        void shouldConvertEurToJpy() throws Exception {
            // Arrange
            ConversionRequest request = new ConversionRequest(100.0, Currency.EUR, Currency.JPY);

            // Act & Assert
            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.from").value("EUR"))
                    .andExpect(jsonPath("$.to").value("JPY"))
                    .andExpect(jsonPath("$.result").value(16250.0))
                    .andExpect(jsonPath("$.rate").value(162.5));
        }

        @Test
        @DisplayName("Should convert decimal amounts correctly")
        void shouldConvertDecimalAmounts() throws Exception {
            // Arrange
            ConversionRequest request = new ConversionRequest(99.99, Currency.USD, Currency.EUR);

            // Act & Assert
            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").value(99.99))
                    .andExpect(jsonPath("$.result").value(91.99));
        }

        @Test
        @DisplayName("Should convert large amounts correctly")
        void shouldConvertLargeAmounts() throws Exception {
            // Arrange
            ConversionRequest request = new ConversionRequest(1000000.0, Currency.USD, Currency.EUR);

            // Act & Assert
            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").value(1000000.0))
                    .andExpect(jsonPath("$.result").value(920000.0));
        }

        @Test
        @DisplayName("Should convert small amounts correctly")
        void shouldConvertSmallAmounts() throws Exception {
            // Arrange
            ConversionRequest request = new ConversionRequest(0.01, Currency.USD, Currency.EUR);

            // Act & Assert
            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.amount").value(0.01))
                    .andExpect(jsonPath("$.result").value(0.01));
        }
    }

    @Nested
    @DisplayName("Request mapping tests")
    class RequestMappingTests {

        @Test
        @DisplayName("Should respond to POST /api/convert endpoint")
        void shouldRespondToConvertEndpoint() throws Exception {
            // Arrange
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            // Act & Assert
            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("Service integration tests")
    class ServiceIntegrationTests {

        @Test
        @DisplayName("Should delegate conversion to ExchangeRateService")
        void shouldDelegateConversionToService() throws Exception {
            // Arrange
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            // Act & Assert
            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.from").value("USD"))
                    .andExpect(jsonPath("$.to").value("EUR"))
                    .andExpect(jsonPath("$.rate").value(0.92));
        }

        @Test
        @DisplayName("Should handle all supported currencies")
        void shouldHandleAllSupportedCurrencies() throws Exception {
            // Test all supported currencies
            Currency[] currencies = {Currency.USD, Currency.EUR, Currency.GBP, Currency.JPY,
                    Currency.CAD, Currency.AUD, Currency.CHF, Currency.CNY, Currency.INR, Currency.MXN};

            for (Currency from : currencies) {
                for (Currency to : currencies) {
                    ConversionRequest request = new ConversionRequest(100.0, from, to);

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
        @DisplayName("Should return JSON content type")
        void shouldReturnJsonContentType() throws Exception {
            // Arrange
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            // Act & Assert
            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON));
        }

        @Test
        @DisplayName("Should accept JSON content type in request")
        void shouldAcceptJsonContentTypeInRequest() throws Exception {
            // Arrange
            ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

            // Act & Assert
            mockMvc.perform(post("/api/convert")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("Controller instantiation tests")
    class ControllerInstantiationTests {

        @Test
        @DisplayName("Should create CurrencyController with ExchangeRateService")
        void shouldCreateControllerWithService() {
            // Arrange & Act
            ExchangeRateService service = new ExchangeRateService();
            CurrencyController controller = new CurrencyController(service);

            // Assert
            assertNotNull(controller);
        }

        @Test
        @DisplayName("Should allow null service in constructor (NPE on use)")
        void shouldAllowNullServiceInConstructor() {
            // Arrange & Act
            CurrencyController controller = new CurrencyController(null);

            // Assert - null service is allowed but will cause NPE when used
            assertNotNull(controller);
        }
    }
}
