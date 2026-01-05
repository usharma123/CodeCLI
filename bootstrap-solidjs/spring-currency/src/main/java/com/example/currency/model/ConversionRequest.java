package com.example.currency.model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Currency conversion request")
public record ConversionRequest(
        @Schema(description = "Amount to convert", example = "100.0")
        double amount,

        @Schema(description = "Source currency code", example = "USD")
        Currency from,

        @Schema(description = "Target currency code", example = "EUR")
        Currency to
) {
}
