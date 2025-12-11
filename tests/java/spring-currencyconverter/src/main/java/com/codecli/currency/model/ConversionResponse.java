package com.codecli.currency.model;

import java.math.BigDecimal;

public record ConversionResponse(
        String from,
        String to,
        BigDecimal amount,
        BigDecimal convertedAmount,
        BigDecimal rate
) {
}

