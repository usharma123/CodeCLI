package com.example.currency.model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Supported currency codes")
public enum Currency {
    @Schema(name = "USD", description = "US Dollar")
    USD,

    @Schema(name = "EUR", description = "Euro")
    EUR,

    @Schema(name = "GBP", description = "British Pound")
    GBP,

    @Schema(name = "JPY", description = "Japanese Yen")
    JPY,

    @Schema(name = "CAD", description = "Canadian Dollar")
    CAD,

    @Schema(name = "AUD", description = "Australian Dollar")
    AUD,

    @Schema(name = "CHF", description = "Swiss Franc")
    CHF,

    @Schema(name = "CNY", description = "Chinese Yuan")
    CNY,

    @Schema(name = "INR", description = "Indian Rupee")
    INR,

    @Schema(name = "MXN", description = "Mexican Peso")
    MXN
}
