package com.codecli.currency.controller;

import com.codecli.currency.controller.ConversionController;
import com.codecli.currency.model.ConversionResponse;
import com.codecli.currency.service.ConversionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for ConversionController.
 * Tests the REST API endpoints and request/response handling.
 */
class ConversionControllerTest {

    private ConversionController conversionController;
    private ConversionService conversionService;

    @BeforeEach
    void setUp() {
        conversionService = new ConversionService();
        conversionController = new ConversionController(conversionService);
    }

    @Nested
    @DisplayName("Successful Conversion Tests")
    class SuccessfulConversionTests {

        @Test
        @DisplayName("Should return successful conversion response for USD to EUR")
        void successfulUsdToEurConversion() {
            ConversionResponse response = conversionController.convert(
                    "USD", "EUR", new BigDecimal("100.00")
            );
            
            assertNotNull(response);
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(new BigDecimal("100.00"), response.amount());
            assertEquals(new BigDecimal("92.00"), response.convertedAmount());
            assertEquals(new BigDecimal("0.920000"), response.rate());
        }

        @Test
        @DisplayName("Should return successful conversion response for EUR to USD")
        void successfulEurToUsdConversion() {
            ConversionResponse response = conversionController.convert(
                    "EUR", "USD", new BigDecimal("92.00")
            );
            
            assertNotNull(response);
            assertEquals("EUR", response.from());
            assertEquals("USD", response.to());
            assertEquals(new BigDecimal("92.00"), response.amount());
            assertEquals(new BigDecimal("100.00"), response.convertedAmount());
        }

        @Test
        @DisplayName("Should handle lowercase currency codes in request")
        void lowercaseCurrencyCodes() {
            ConversionResponse response = conversionController.convert(
                    "usd", "eur", new BigDecimal("100.00")
            );
            
            assertNotNull(response);
            // Controller normalizes to uppercase in response
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
        }

        @Test
        @DisplayName("Should return correct conversion for large amount")
        void largeAmountConversion() {
            ConversionResponse response = conversionController.convert(
                    "USD", "JPY", new BigDecimal("1000000.00")
            );
            
            assertNotNull(response);
            assertEquals(new BigDecimal("150000000.00"), response.convertedAmount());
        }

        @Test
        @DisplayName("Should return correct conversion for small amount")
        void smallAmountConversion() {
            ConversionResponse response = conversionController.convert(
                    "USD", "GBP", new BigDecimal("0.01")
            );
            
            assertNotNull(response);
            assertTrue(response.convertedAmount().compareTo(BigDecimal.ZERO) > 0);
        }

        @Test
        @DisplayName("Should handle zero amount conversion")
        void zeroAmountConversion() {
            ConversionResponse response = conversionController.convert(
                    "USD", "EUR", BigDecimal.ZERO
            );
            
            assertNotNull(response);
            assertEquals(0, response.convertedAmount().compareTo(BigDecimal.ZERO));
            assertEquals(new BigDecimal("0.920000"), response.rate());
        }

        @Test
        @DisplayName("Should convert between all supported currencies")
        void allCurrencyConversions() {
            String[] currencies = {"USD", "EUR", "GBP", "JPY", "INR", "CAD", "AUD"};
            
            for (String from : currencies) {
                for (String to : currencies) {
                    ConversionResponse response = conversionController.convert(
                            from, to, new BigDecimal("100.00")
                    );
                    
                    assertNotNull(response);
                    assertEquals(from.toUpperCase(), response.from());
                    assertEquals(to.toUpperCase(), response.to());
                    assertEquals(new BigDecimal("100.00"), response.amount());
                    assertNotNull(response.convertedAmount());
                    assertNotNull(response.rate());
                }
            }
        }
    }

    @Nested
    @DisplayName("Error Response Tests")
    class ErrorResponseTests {

        @Test
        @DisplayName("Should throw exception for unsupported source currency")
        void unsupportedSourceCurrency() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionController.convert("XYZ", "USD", new BigDecimal("100.00"))
            );
            
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }

        @Test
        @DisplayName("Should throw exception for unsupported target currency")
        void unsupportedTargetCurrency() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionController.convert("USD", "XYZ", new BigDecimal("100.00"))
            );
            
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }

        @Test
        @DisplayName("Should throw exception for negative amount")
        void negativeAmount() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionController.convert("USD", "EUR", new BigDecimal("-100.00"))
            );
            
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("amount must be non-negative"));
        }

        @Test
        @DisplayName("Should throw exception for null amount")
        void nullAmount() {
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionController.convert("USD", "EUR", null)
            );
            
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        }
    }

    @Nested
    @DisplayName("Response Structure Tests")
    class ResponseStructureTests {

        @Test
        @DisplayName("Should return proper ConversionResponse record structure")
        void responseStructure() {
            ConversionResponse response = conversionController.convert(
                    "USD", "EUR", new BigDecimal("100.00")
            );
            
            // Verify all fields are present and correctly typed
            assertNotNull(response.from());
            assertNotNull(response.to());
            assertNotNull(response.amount());
            assertNotNull(response.convertedAmount());
            assertNotNull(response.rate());
        }

        @Test
        @DisplayName("Should normalize currency codes to uppercase in response")
        void currencyCodeNormalization() {
            ConversionResponse response = conversionController.convert(
                    "usd", "eur", new BigDecimal("100.00")
            );
            
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
        }

        @Test
        @DisplayName("Should include correct rate in response")
        void rateInResponse() {
            ConversionResponse response = conversionController.convert(
                    "USD", "EUR", new BigDecimal("100.00")
            );
            
            assertEquals(new BigDecimal("0.920000"), response.rate());
            // Verify rate is consistent with conversion
            BigDecimal expectedConverted = response.amount().multiply(response.rate());
            assertEquals(expectedConverted.setScale(2, java.math.RoundingMode.HALF_UP), 
                         response.convertedAmount());
        }

        @Test
        @DisplayName("Should preserve amount precision in response")
        void amountPrecision() {
            BigDecimal amount = new BigDecimal("123.456789");
            ConversionResponse response = conversionController.convert(
                    "USD", "EUR", amount
            );
            
            assertEquals(amount, response.amount());
        }
    }

    @Nested
    @DisplayName("Special Scenario Tests")
    class SpecialScenarioTests {

        @Test
        @DisplayName("Should handle same currency conversion")
        void sameCurrencyConversion() {
            ConversionResponse response = conversionController.convert(
                    "USD", "USD", new BigDecimal("100.00")
            );
            
            assertNotNull(response);
            assertEquals(0, response.convertedAmount().compareTo(new BigDecimal("100.00")));
            assertEquals(0, response.rate().compareTo(BigDecimal.ONE));
        }

        @Test
        @DisplayName("Should handle conversion with trailing zeros in amount")
        void trailingZeros() {
            ConversionResponse response = conversionController.convert(
                    "USD", "EUR", new BigDecimal("100.00")
            );
            
            assertNotNull(response.convertedAmount());
            // Verify trailing zeros are handled correctly
            assertEquals(new BigDecimal("92.00"), response.convertedAmount());
        }

        @Test
        @DisplayName("Should handle INR to AUD conversion correctly")
        void inrToAudConversion() {
            ConversionResponse response = conversionController.convert(
                    "INR", "AUD", new BigDecimal("8300.00")
            );
            
            // INR rate: 83.00, AUD rate: 1.52
            // 8300 / 83 * 1.52 = 152.00
            assertNotNull(response);
            assertEquals(new BigDecimal("152.00"), response.convertedAmount());
        }
    }
}
