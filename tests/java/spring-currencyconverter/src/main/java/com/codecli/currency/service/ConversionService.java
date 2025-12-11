package com.codecli.currency.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Service
public class ConversionService {

    // Rates relative to USD; keep simple, no external calls.
    private static final Map<String, BigDecimal> RATES = Map.of(
            "USD", BigDecimal.valueOf(1.00),
            "EUR", BigDecimal.valueOf(0.92),
            "GBP", BigDecimal.valueOf(0.79),
            "JPY", BigDecimal.valueOf(150.00),
            "INR", BigDecimal.valueOf(83.00),
            "CAD", BigDecimal.valueOf(1.35),
            "AUD", BigDecimal.valueOf(1.52)
    );

    public BigDecimal convert(String from, String to, BigDecimal amount) {
        if (amount == null || amount.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount must be non-negative");
        }

        String normalizedFrom = normalize(from);
        String normalizedTo = normalize(to);
        
        if (normalizedFrom == null || normalizedTo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "unsupported currency");
        }

        BigDecimal fromRate = RATES.get(normalizedFrom);
        BigDecimal toRate = RATES.get(normalizedTo);

        if (fromRate == null || toRate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "unsupported currency");
        }

        // Convert via USD base to keep math simple.
        BigDecimal usdValue = amount.divide(fromRate, 8, RoundingMode.HALF_UP);
        BigDecimal target = usdValue.multiply(toRate);
        return target.setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal rate(String from, String to) {
        String normalizedFrom = normalize(from);
        String normalizedTo = normalize(to);
        
        if (normalizedFrom == null || normalizedTo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "unsupported currency");
        }
        
        BigDecimal fromRate = RATES.get(normalizedFrom);
        BigDecimal toRate = RATES.get(normalizedTo);
        
        if (fromRate == null || toRate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "unsupported currency");
        }
        return toRate.divide(fromRate, 6, RoundingMode.HALF_UP);
    }

    private String normalize(String code) {
        return code == null ? null : code.trim().toUpperCase();
    }
}

