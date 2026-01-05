package com.example.currency.service;

import com.example.currency.model.ConversionRequest;
import com.example.currency.model.ConversionResponse;
import com.example.currency.model.Currency;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class ExchangeRateService {

    private static final Map<Currency, Double> RATES_TO_USD = Map.of(
            Currency.USD, 1.0,
            Currency.EUR, 0.92,
            Currency.GBP, 0.79,
            Currency.JPY, 149.50,
            Currency.CAD, 1.35,
            Currency.AUD, 1.53,
            Currency.CHF, 0.88,
            Currency.CNY, 7.24,
            Currency.INR, 83.12,
            Currency.MXN, 17.15
    );

    public ConversionResponse convert(ConversionRequest request) {
        Currency from = request.from();
        Currency to = request.to();

        double rate = getRate(from, to);
        double result = request.amount() * rate;

        return new ConversionResponse(request.amount(), from.name(), to.name(), Math.round(result * 100.0) / 100.0, rate);
    }

    private double getRate(Currency from, Currency to) {
        if (from == to) {
            return 1.0;
        }
        double fromToUsd = RATES_TO_USD.get(from);
        double toToUsd = RATES_TO_USD.get(to);
        return toToUsd / fromToUsd;
    }
}
