import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import java.util.Map;

/**
 * Unit tests for CurrencyConverter class
 */
public class CurrencyConverterTest {
    
    private CurrencyConverter converter;
    
    @BeforeEach
    public void setUp() {
        converter = new CurrencyConverter();
    }
    
    // Test basic conversions
    
    @Test
    @DisplayName("Convert USD to EUR")
    public void testConvertUsdToEur() {
        double result = converter.convert(100.0, "USD", "EUR");
        assertEquals(90.91, result, 0.01);
    }
    
    @Test
    @DisplayName("Convert EUR to USD")
    public void testConvertEurToUsd() {
        double result = converter.convert(100.0, "EUR", "USD");
        assertEquals(110.0, result, 0.01);
    }
    
    @Test
    @DisplayName("Convert USD to GBP")
    public void testConvertUsdToGbp() {
        double result = converter.convert(100.0, "USD", "GBP");
        assertEquals(80.0, result, 0.01);
    }
    
    @Test
    @DisplayName("Convert GBP to USD")
    public void testConvertGbpToUsd() {
        double result = converter.convert(100.0, "GBP", "USD");
        assertEquals(125.0, result, 0.01);
    }
    
    @Test
    @DisplayName("Convert USD to JPY")
    public void testConvertUsdToJpy() {
        double result = converter.convert(100.0, "USD", "JPY");
        assertEquals(14285.71, result, 0.01);
    }
    
    @Test
    @DisplayName("Convert JPY to USD")
    public void testConvertJpyToUsd() {
        double result = converter.convert(1000.0, "JPY", "USD");
        assertEquals(7.0, result, 0.01);
    }
    
    @Test
    @DisplayName("Convert same currency (USD to USD)")
    public void testConvertSameCurrencyUsd() {
        double result = converter.convert(100.0, "USD", "USD");
        assertEquals(100.0, result, 0.01);
    }
    
    @Test
    @DisplayName("Convert same currency (EUR to EUR)")
    public void testConvertSameCurrencyEur() {
        double result = converter.convert(50.0, "EUR", "EUR");
        assertEquals(50.0, result, 0.01);
    }
    
    // Test cross-currency conversions (non-USD pairs)
    
    @Test
    @DisplayName("Convert EUR to GBP")
    public void testConvertEurToGbp() {
        double result = converter.convert(100.0, "EUR", "GBP");
        assertEquals(88.0, result, 0.01);
    }
    
    @Test
    @DisplayName("Convert GBP to EUR")
    public void testConvertGbpToEur() {
        double result = converter.convert(100.0, "GBP", "EUR");
        assertEquals(113.64, result, 0.01);
    }
    
    @Test
    @DisplayName("Convert EUR to JPY")
    public void testConvertEurToJpy() {
        double result = converter.convert(100.0, "EUR", "JPY");
        assertEquals(15714.29, result, 0.01);
    }
    
    @Test
    @DisplayName("Convert JPY to GBP")
    public void testConvertJpyToGbp() {
        double result = converter.convert(10000.0, "JPY", "GBP");
        assertEquals(56.0, result, 0.01);
    }
    
    // Test edge cases
    
    @Test
    @DisplayName("Convert zero amount")
    public void testConvertZeroAmount() {
        double result = converter.convert(0.0, "USD", "EUR");
        assertEquals(0.0, result, 0.01);
    }
    
    @Test
    @DisplayName("Convert very small amount")
    public void testConvertVerySmallAmount() {
        double result = converter.convert(0.01, "USD", "EUR");
        assertEquals(0.0091, result, 0.0001);
    }
    
    @Test
    @DisplayName("Convert very large amount")
    public void testConvertVeryLargeAmount() {
        double result = converter.convert(1000000.0, "USD", "EUR");
        assertEquals(909090.91, result, 0.01);
    }
    
    // Test case insensitivity
    
    @Test
    @DisplayName("Convert with lowercase currency codes")
    public void testConvertLowercaseCodes() {
        double result = converter.convert(100.0, "usd", "eur");
        assertEquals(90.91, result, 0.01);
    }
    
    @Test
    @DisplayName("Convert with mixed case currency codes")
    public void testConvertMixedCaseCodes() {
        double result = converter.convert(100.0, "UsD", "EuR");
        assertEquals(90.91, result, 0.01);
    }
    
    // Test whitespace handling
    
    @Test
    @DisplayName("Convert with whitespace in currency codes")
    public void testConvertWithWhitespace() {
        double result = converter.convert(100.0, " USD ", " EUR ");
        assertEquals(90.91, result, 0.01);
    }
    
    // Test error cases
    
    @Test
    @DisplayName("Throw exception for negative amount")
    public void testNegativeAmount() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> converter.convert(-100.0, "USD", "EUR")
        );
        assertEquals("Amount must be non-negative", exception.getMessage());
    }
    
    @Test
    @DisplayName("Throw exception for unsupported from currency")
    public void testUnsupportedFromCurrency() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> converter.convert(100.0, "XYZ", "USD")
        );
        assertEquals("Unsupported currency: XYZ", exception.getMessage());
    }
    
    @Test
    @DisplayName("Throw exception for unsupported to currency")
    public void testUnsupportedToCurrency() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> converter.convert(100.0, "USD", "XYZ")
        );
        assertEquals("Unsupported currency: XYZ", exception.getMessage());
    }
    
    @Test
    @DisplayName("Throw exception for null from currency")
    public void testNullFromCurrency() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> converter.convert(100.0, null, "USD")
        );
        assertEquals("Currency code is required", exception.getMessage());
    }
    
    @Test
    @DisplayName("Throw exception for null to currency")
    public void testNullToCurrency() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> converter.convert(100.0, "USD", null)
        );
        assertEquals("Currency code is required", exception.getMessage());
    }
    
    @Test
    @DisplayName("Throw exception for empty from currency")
    public void testEmptyFromCurrency() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> converter.convert(100.0, "", "USD")
        );
        assertEquals("Unsupported currency: ", exception.getMessage());
    }
    
    @Test
    @DisplayName("Throw exception for empty to currency")
    public void testEmptyToCurrency() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> converter.convert(100.0, "USD", "")
        );
        assertEquals("Unsupported currency: ", exception.getMessage());
    }
    
    // Test supportedRates method
    
    @Test
    @DisplayName("Get supported rates returns all currencies")
    public void testSupportedRates() {
        Map<String, Double> rates = converter.supportedRates();
        assertNotNull(rates);
        assertEquals(4, rates.size());
        assertTrue(rates.containsKey("USD"));
        assertTrue(rates.containsKey("EUR"));
        assertTrue(rates.containsKey("GBP"));
        assertTrue(rates.containsKey("JPY"));
    }
    
    @Test
    @DisplayName("Get supported rates returns correct values")
    public void testSupportedRatesValues() {
        Map<String, Double> rates = converter.supportedRates();
        assertEquals(1.0, rates.get("USD"), 0.001);
        assertEquals(1.1, rates.get("EUR"), 0.001);
        assertEquals(1.25, rates.get("GBP"), 0.001);
        assertEquals(0.007, rates.get("JPY"), 0.001);
    }
    
    @Test
    @DisplayName("Supported rates map is unmodifiable")
    public void testSupportedRatesUnmodifiable() {
        Map<String, Double> rates = converter.supportedRates();
        assertThrows(UnsupportedOperationException.class, () -> {
            rates.put("CAD", 0.75);
        });
    }
    
    // Test decimal precision
    
    @Test
    @DisplayName("Convert with decimal amount")
    public void testConvertDecimalAmount() {
        double result = converter.convert(123.45, "USD", "EUR");
        assertEquals(112.23, result, 0.01);
    }
    
    @Test
    @DisplayName("Convert with high precision amount")
    public void testConvertHighPrecisionAmount() {
        double result = converter.convert(99.999, "GBP", "USD");
        assertEquals(124.999, result, 0.001);
    }
}
