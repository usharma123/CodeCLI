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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ConversionController.
 * Tests cover controller behavior with mocked service layer.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConversionController Tests")
class ConversionControllerTest {

    @Mock
    private ConversionService conversionService;

    @InjectMocks
    private ConversionController conversionController;

    @Nested
    @DisplayName("Happy Path Controller Tests")
    class HappyPathTests {

        @Test
        @DisplayName("Should return successful conversion response")
        void shouldReturnSuccessfulConversionResponse() {
            // Arrange
            when(conversionService.convert("USD", "EUR", BigDecimal.valueOf(100)))
                    .thenReturn(BigDecimal.valueOf(92.00));
            when(conversionService.rate("USD", "EUR"))
                    .thenReturn(BigDecimal.valueOf(0.92));

            // Act
            ConversionResponse response = conversionController.convert(
                    "USD", "EUR", BigDecimal.valueOf(100));

            // Assert
            assertNotNull(response);
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
            assertEquals(BigDecimal.valueOf(100), response.amount());
            assertEquals(BigDecimal.valueOf(92.00), response.convertedAmount());
            assertEquals(BigDecimal.valueOf(0.92), response.rate());

            verify(conversionService).convert("USD", "EUR", BigDecimal.valueOf(100));
            verify(conversionService).rate("USD", "EUR");
        }

        @Test
        @DisplayName("Should handle case conversion in response")
        void shouldHandleCaseConversionInResponse() {
            // Arrange
            when(conversionService.convert("usd", "eur", BigDecimal.valueOf(100)))
                    .thenReturn(BigDecimal.valueOf(92.00));
            when(conversionService.rate("usd", "eur"))
                    .thenReturn(BigDecimal.valueOf(0.92));

            // Act
            ConversionResponse response = conversionController.convert(
                    "usd", "eur", BigDecimal.valueOf(100));

            // Assert
            assertEquals("USD", response.from());
            assertEquals("EUR", response.to());
        }

        @Test
        @DisplayName("Should call service with correct parameters")
        void shouldCallServiceWithCorrectParameters() {
            // Arrange
            BigDecimal amount = BigDecimal.valueOf(250.50);
            when(conversionService.convert("GBP", "JPY", amount))
                    .thenReturn(BigDecimal.valueOf(47458.54));
            when(conversionService.rate("GBP", "JPY"))
                    .thenReturn(BigDecimal.valueOf(189.873));

            // Act
            ConversionResponse response = conversionController.convert("GBP", "JPY", amount);

            // Assert
            verify(conversionService).convert("GBP", "JPY", amount);
            verify(conversionService).rate("GBP", "JPY");
            assertNotNull(response);
        }
    }

    @Nested
    @DisplayName("Error Handling Controller Tests")
    class ErrorHandlingTests {

        @Test
        @DisplayName("Should propagate service exception for invalid amount")
        void shouldPropagateServiceExceptionForInvalidAmount() {
            // Arrange
            when(conversionService.convert("USD", "EUR", BigDecimal.valueOf(-100)))
                    .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount must be non-negative"));

            // Act & Assert
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionController.convert("USD", "EUR", BigDecimal.valueOf(-100))
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("amount must be non-negative"));
        }

        @Test
        @DisplayName("Should propagate service exception for unsupported currency")
        void shouldPropagateServiceExceptionForUnsupportedCurrency() {
            // Arrange
            when(conversionService.convert("XYZ", "EUR", BigDecimal.valueOf(100)))
                    .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "unsupported currency"));

            // Act & Assert
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionController.convert("XYZ", "EUR", BigDecimal.valueOf(100))
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
            assertTrue(exception.getReason().contains("unsupported currency"));
        }

        @Test
        @DisplayName("Should propagate service exception for null from currency")
        void shouldPropagateServiceExceptionForNullFromCurrency() {
            // Arrange
            when(conversionService.convert(null, "EUR", BigDecimal.valueOf(100)))
                    .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "unsupported currency"));

            // Act & Assert
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionController.convert(null, "EUR", BigDecimal.valueOf(100))
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        }

        @Test
        @DisplayName("Should propagate service exception for null to currency")
        void shouldPropagateServiceExceptionForNullToCurrency() {
            // Arrange
            when(conversionService.convert("USD", null, BigDecimal.valueOf(100)))
                    .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "unsupported currency"));

            // Act & Assert
            ResponseStatusException exception = assertThrows(
                    ResponseStatusException.class,
                    () -> conversionController.convert("USD", null, BigDecimal.valueOf(100))
            );
            assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        }
    }

    @Nested
    @DisplayName("Controller Dependency Tests")
    class DependencyTests {

        @Test
        @DisplayName("Should use injected ConversionService")
        void shouldUseInjectedConversionService() {
            // This test verifies that the controller properly uses the injected service
            ConversionService customService = new ConversionService();
            ConversionController customController = new ConversionController(customService);

            // No mocking needed - using real service
            ConversionResponse response = customController.convert("USD", "EUR", BigDecimal.valueOf(100));

            assertNotNull(response);
            assertEquals(0, BigDecimal.valueOf(92.00).compareTo(response.convertedAmount()));
        }

        @Test
        @DisplayName("Should call both convert and rate methods")
        void shouldCallBothConvertAndRateMethods() {
            // Arrange
            when(conversionService.convert("USD", "GBP", BigDecimal.valueOf(100)))
                    .thenReturn(BigDecimal.valueOf(79.00));
            when(conversionService.rate("USD", "GBP"))
                    .thenReturn(BigDecimal.valueOf(0.79));

            // Act
            ConversionResponse response = conversionController.convert("USD", "GBP", BigDecimal.valueOf(100));

            // Assert
            verify(conversionService).convert("USD", "GBP", BigDecimal.valueOf(100));
            verify(conversionService).rate("USD", "GBP");
            assertNotNull(response);
        }
    }

    @Nested
    @DisplayName("Response Construction Tests")
    class ResponseConstructionTests {

        @Test
        @DisplayName("Should construct response with correct values")
        void shouldConstructResponseWithCorrectValues() {
            // Arrange
            BigDecimal amount = BigDecimal.valueOf(123.45);
            BigDecimal convertedAmount = BigDecimal.valueOf(113.57);
            BigDecimal rate = BigDecimal.valueOf(0.92);

            when(conversionService.convert("USD", "EUR", amount))
                    .thenReturn(convertedAmount);
            when(conversionService.rate("USD", "EUR"))
                    .thenReturn(rate);

            // Act
            ConversionResponse response = conversionController.convert("USD", "EUR", amount);

            // Assert
            assertAll("Response fields",
                    () -> assertEquals("USD", response.from()),
                    () -> assertEquals("EUR", response.to()),
                    () -> assertEquals(amount, response.amount()),
                    () -> assertEquals(convertedAmount, response.convertedAmount()),
                    () -> assertEquals(rate, response.rate())
            );
        }

        @Test
        @DisplayName("Should handle zero conversion result")
        void shouldHandleZeroConversionResult() {
            // Arrange
            when(conversionService.convert("USD", "EUR", BigDecimal.ZERO))
                    .thenReturn(BigDecimal.ZERO.setScale(2));
            when(conversionService.rate("USD", "EUR"))
                    .thenReturn(BigDecimal.valueOf(0.92));

            // Act
            ConversionResponse response = conversionController.convert("USD", "EUR", BigDecimal.ZERO);

            // Assert
            assertNotNull(response);
            assertEquals(BigDecimal.ZERO.setScale(2), response.convertedAmount());
        }

        @Test
        @DisplayName("Should handle large conversion result")
        void shouldHandleLargeConversionResult() {
            // Arrange
            BigDecimal amount = BigDecimal.valueOf(1000000);
            BigDecimal convertedAmount = BigDecimal.valueOf(150000000.00);

            when(conversionService.convert("USD", "JPY", amount))
                    .thenReturn(convertedAmount);
            when(conversionService.rate("USD", "JPY"))
                    .thenReturn(BigDecimal.valueOf(150.00));

            // Act
            ConversionResponse response = conversionController.convert("USD", "JPY", amount);

            // Assert
            assertNotNull(response);
            assertEquals(convertedAmount, response.convertedAmount());
        }
    }
}