package com.example.currency.controller;

import com.example.currency.model.ConversionRequest;
import com.example.currency.model.ConversionResponse;
import com.example.currency.service.ExchangeRateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Currency Converter", description = "Convert between currencies")
public class CurrencyController {

    private final ExchangeRateService exchangeRateService;

    public CurrencyController(ExchangeRateService exchangeRateService) {
        this.exchangeRateService = exchangeRateService;
    }

    @PostMapping("/convert")
    @Operation(
            summary = "Convert amount between currencies",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Conversion request with amount and currency codes",
                    required = true,
                    content = @Content(schema = @Schema(implementation = ConversionRequest.class))
            ),
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "Successful conversion",
                            content = @Content(schema = @Schema(implementation = ConversionResponse.class))
                    ),
                    @ApiResponse(responseCode = "400", description = "Invalid request")
            }
    )
    public ConversionResponse convert(@RequestBody ConversionRequest request) {
        return exchangeRateService.convert(request);
    }
}
