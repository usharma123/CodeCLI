import java.util.Collections;
import java.util.Locale;
import java.util.Map;

/**
 * Simple converter using hardcoded rates to USD as the base.
 */
public class CurrencyConverter {
    private static final Map<String, Double> RATES_TO_USD = Map.of(
            "USD", 1.0,
            "EUR", 1.1,   // 1 EUR = 1.1 USD
            "GBP", 1.25,  // 1 GBP = 1.25 USD
            "JPY", 0.007  // 1 JPY = 0.007 USD
    );

    public double convert(double amount, String fromCurrency, String toCurrency) {
        if (amount < 0) {
            throw new IllegalArgumentException("Amount must be non-negative");
        }
        String from = normalize(fromCurrency);
        String to = normalize(toCurrency);

        double fromRate = rateToUsd(from);
        double toRate = rateToUsd(to);

        double amountInUsd = amount * fromRate;
        return amountInUsd / toRate;
    }

    public Map<String, Double> supportedRates() {
        return Collections.unmodifiableMap(RATES_TO_USD);
    }

    private static double rateToUsd(String currency) {
        Double rate = RATES_TO_USD.get(currency);
        if (rate == null) {
            throw new IllegalArgumentException("Unsupported currency: " + currency);
        }
        return rate;
    }

    private static String normalize(String currency) {
        if (currency == null) {
            throw new IllegalArgumentException("Currency code is required");
        }
        return currency.trim().toUpperCase(Locale.ROOT);
    }
}
