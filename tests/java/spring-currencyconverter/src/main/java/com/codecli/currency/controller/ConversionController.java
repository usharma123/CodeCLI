package com.codecli.currency.controller;

import com.codecli.currency.model.ConversionResponse;
import com.codecli.currency.service.ConversionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/convert")
public class ConversionController {

    private final ConversionService conversionService;

    public ConversionController(ConversionService conversionService) {
        this.conversionService = conversionService;
    }

    @GetMapping
    public ConversionResponse convert(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam BigDecimal amount
    ) {
        BigDecimal converted = conversionService.convert(from, to, amount);
        BigDecimal rate = conversionService.rate(from, to);
        return new ConversionResponse(from.toUpperCase(), to.toUpperCase(), amount, converted, rate);
    }
}

