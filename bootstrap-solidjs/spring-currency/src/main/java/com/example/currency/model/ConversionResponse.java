package com.example.currency.model;

public record ConversionResponse(
        double amount,
        String from,
        String to,
        double result,
        double rate
) {
}
