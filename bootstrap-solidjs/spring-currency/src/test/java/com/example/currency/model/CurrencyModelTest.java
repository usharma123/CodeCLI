package com.example.currency.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Model tests - covers Currency enum, ConversionRequest, and ConversionResponse.
 */
@DisplayName("Currency Model Tests")
class CurrencyModelTest {

    // ============ Currency Enum Tests ============

    @Test
    @DisplayName("Should have all expected currency values")
    void shouldHaveAllCurrencyValues() {
        Currency[] values = Currency.values();
        assertEquals(10, values.length, "Should have 10 currencies");
    }

    @Test
    @DisplayName("Should find currency by name")
    void shouldFindCurrencyByName() {
        assertEquals(Currency.USD, Currency.valueOf("USD"));
        assertEquals(Currency.EUR, Currency.valueOf("EUR"));
        assertEquals(Currency.GBP, Currency.valueOf("GBP"));
        assertEquals(Currency.JPY, Currency.valueOf("JPY"));
    }

    @Test
    @DisplayName("Should throw exception for invalid currency name")
    void shouldThrowForInvalidCurrencyName() {
        assertThrows(IllegalArgumentException.class, () -> Currency.valueOf("INVALID"));
    }

    @ParameterizedTest
    @EnumSource(Currency.class)
    @DisplayName("All currencies should have name() method work correctly")
    void allCurrenciesShouldHaveName(Currency currency) {
        String name = currency.name();
        assertNotNull(name);
        assertFalse(name.isEmpty());
    }

    @ParameterizedTest
    @EnumSource(Currency.class)
    @DisplayName("All currencies should have ordinal() method work correctly")
    void allCurrenciesShouldHaveOrdinal(Currency currency) {
        int ordinal = currency.ordinal();
        assertTrue(ordinal >= 0);
    }

    @Test
    @DisplayName("USD currency should have correct ordinal")
    void usdShouldHaveCorrectOrdinal() {
        assertEquals(0, Currency.USD.ordinal());
    }

    @Test
    @DisplayName("Should compare currencies using equals")
    void shouldCompareCurrenciesUsingEquals() {
        Currency usd1 = Currency.USD;
        Currency usd2 = Currency.valueOf("USD");
        assertEquals(usd1, usd2);
        assertSame(usd1, usd2);
    }

    @Test
    @DisplayName("Should support compareTo for currencies")
    void shouldSupportCompareTo() {
        assertTrue(Currency.USD.compareTo(Currency.EUR) < 0);
        assertTrue(Currency.EUR.compareTo(Currency.USD) > 0);
        assertEquals(0, Currency.USD.compareTo(Currency.USD));
    }

    // ============ ConversionRequest Tests ============

    @Test
    @DisplayName("Should create ConversionRequest with all fields")
    void shouldCreateConversionRequestWithAllFields() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

        assertEquals(100.0, request.amount());
        assertEquals(Currency.USD, request.from());
        assertEquals(Currency.EUR, request.to());
    }

    @Test
    @DisplayName("Should access all fields via accessors for ConversionRequest")
    void shouldAccessAllRequestFieldsViaAccessors() {
        ConversionRequest request = new ConversionRequest(50.5, Currency.GBP, Currency.JPY);

        assertEquals(50.5, request.amount());
        assertEquals(Currency.GBP, request.from());
        assertEquals(Currency.JPY, request.to());
    }

    @Test
    @DisplayName("Should handle zero amount in ConversionRequest")
    void shouldHandleZeroAmount() {
        ConversionRequest request = new ConversionRequest(0.0, Currency.USD, Currency.EUR);

        assertEquals(0.0, request.amount());
    }

    @Test
    @DisplayName("Should handle negative amount in ConversionRequest")
    void shouldHandleNegativeAmount() {
        ConversionRequest request = new ConversionRequest(-100.0, Currency.USD, Currency.EUR);

        assertEquals(-100.0, request.amount());
    }

    @Test
    @DisplayName("Should handle same currency in ConversionRequest")
    void shouldHandleSameCurrency() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.USD);

        assertEquals(Currency.USD, request.from());
        assertEquals(Currency.USD, request.to());
    }

    @Test
    @DisplayName("ConversionRequest should be equal to itself")
    void conversionRequestShouldBeEqualToItself() {
        ConversionRequest request1 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
        ConversionRequest request2 = new ConversionRequest(100.0, Currency.USD, Currency.EUR);

        assertEquals(request1, request2);
        assertEquals(request1.hashCode(), request2.hashCode());
    }

    @Test
    @DisplayName("ConversionRequest toString should not be empty")
    void conversionRequestToStringShouldNotBeEmpty() {
        ConversionRequest request = new ConversionRequest(100.0, Currency.USD, Currency.EUR);
        String str = request.toString();

        assertNotNull(str);
        assertTrue(str.contains("100"));
    }

    // ============ ConversionResponse Tests ============

    @Test
    @DisplayName("Should create ConversionResponse with all fields")
    void shouldCreateConversionResponseWithAllFields() {
        ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

        assertEquals(100.0, response.amount());
        assertEquals("USD", response.from());
        assertEquals("EUR", response.to());
        assertEquals(92.0, response.result());
        assertEquals(0.92, response.rate());
    }

    @Test
    @DisplayName("Should access all fields via accessors for ConversionResponse")
    void shouldAccessAllResponseFieldsViaAccessors() {
        ConversionResponse response = new ConversionResponse(50.5, "GBP", "JPY", 7500.0, 148.5);

        assertEquals(50.5, response.amount());
        assertEquals("GBP", response.from());
        assertEquals("JPY", response.to());
        assertEquals(7500.0, response.result());
        assertEquals(148.5, response.rate());
    }

    @Test
    @DisplayName("Should handle zero result in ConversionResponse")
    void shouldHandleZeroResult() {
        ConversionResponse response = new ConversionResponse(0.0, "USD", "EUR", 0.0, 0.92);

        assertEquals(0.0, response.result());
    }

    @Test
    @DisplayName("Should handle negative result in ConversionResponse")
    void shouldHandleNegativeResult() {
        ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", -50.0, -0.5);

        assertEquals(-50.0, response.result());
    }

    @Test
    @DisplayName("Should handle unit rate in ConversionResponse")
    void shouldHandleUnitRate() {
        ConversionResponse response = new ConversionResponse(100.0, "USD", "USD", 100.0, 1.0);

        assertEquals(1.0, response.rate());
    }

    @Test
    @DisplayName("ConversionResponse should be equal to itself")
    void conversionResponseShouldBeEqualToItself() {
        ConversionResponse response1 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
        ConversionResponse response2 = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);

        assertEquals(response1, response2);
        assertEquals(response1.hashCode(), response2.hashCode());
    }

    @Test
    @DisplayName("ConversionResponse toString should not be empty")
    void conversionResponseToStringShouldNotBeEmpty() {
        ConversionResponse response = new ConversionResponse(100.0, "USD", "EUR", 92.0, 0.92);
        String str = response.toString();

        assertNotNull(str);
        assertTrue(str.contains("USD"));
    }

    @Test
    @DisplayName("Should handle long currency code strings")
    void shouldHandleLongCurrencyCodeStrings() {
        ConversionResponse response = new ConversionResponse(100.0, "VERYLONGCURRENCY", "ANOTHERLONGCURRENCY", 92.0, 0.92);

        assertEquals("VERYLONGCURRENCY", response.from());
        assertEquals("ANOTHERLONGCURRENCY", response.to());
    }
}