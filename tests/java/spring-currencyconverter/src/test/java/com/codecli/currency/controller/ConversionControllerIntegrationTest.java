package com.codecli.currency.controller;

import com.codecli.currency.model.ConversionResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DisplayName("ConversionController Integration Tests")
class ConversionControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String getBaseUrl() {
        return "http://localhost:" + port + "/api/convert";
    }

    @Test
    @DisplayName("Should convert USD to EUR via REST endpoint")
    void testConvertUsdToEur() {
        String url = getBaseUrl() + "?from=USD&to=EUR&amount=100.00";
        
        ResponseEntity<ConversionResponse> response = restTemplate.getForEntity(
            url, 
            ConversionResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ConversionResponse body = response.getBody();
        assertEquals("USD", body.from());
        assertEquals("EUR", body.to());
        assertEquals(new BigDecimal("100.00"), body.amount());
        assertEquals(new BigDecimal("92.00"), body.convertedAmount());
    }

    @Test
    @DisplayName("Should convert EUR to USD via REST endpoint")
    void testConvertEurToUsd() {
        String url = getBaseUrl() + "?from=EUR&to=USD&amount=92.00";
        
        ResponseEntity<ConversionResponse> response = restTemplate.getForEntity(
            url, 
            ConversionResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ConversionResponse body = response.getBody();
        assertEquals("EUR", body.from());
        assertEquals("USD", body.to());
        assertEquals(new BigDecimal("92.00"), body.amount());
        assertEquals(new BigDecimal("100.00"), body.convertedAmount());
    }

    @Test
    @DisplayName("Should handle lowercase currency codes")
    void testConvertWithLowercaseCodes() {
        String url = getBaseUrl() + "?from=usd&to=eur&amount=100.00";
        
        ResponseEntity<ConversionResponse> response = restTemplate.getForEntity(
            url, 
            ConversionResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ConversionResponse body = response.getBody();
        // Controller normalizes to uppercase
        assertEquals("USD", body.from());
        assertEquals("EUR", body.to());
    }

    @Test
    @DisplayName("Should convert USD to GBP")
    void testConvertUsdToGbp() {
        String url = getBaseUrl() + "?from=USD&to=GBP&amount=100.00";
        
        ResponseEntity<ConversionResponse> response = restTemplate.getForEntity(
            url, 
            ConversionResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ConversionResponse body = response.getBody();
        assertEquals("USD", body.from());
        assertEquals("GBP", body.to());
        assertEquals(new BigDecimal("79.00"), body.convertedAmount());
    }

    @Test
    @DisplayName("Should convert USD to JPY")
    void testConvertUsdToJpy() {
        String url = getBaseUrl() + "?from=USD&to=JPY&amount=100.00";
        
        ResponseEntity<ConversionResponse> response = restTemplate.getForEntity(
            url, 
            ConversionResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ConversionResponse body = response.getBody();
        assertEquals("USD", body.from());
        assertEquals("JPY", body.to());
        assertEquals(new BigDecimal("15000.00"), body.convertedAmount());
    }

    @Test
    @DisplayName("Should convert USD to INR")
    void testConvertUsdToInr() {
        String url = getBaseUrl() + "?from=USD&to=INR&amount=100.00";
        
        ResponseEntity<ConversionResponse> response = restTemplate.getForEntity(
            url, 
            ConversionResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ConversionResponse body = response.getBody();
        assertEquals("USD", body.from());
        assertEquals("INR", body.to());
        assertEquals(new BigDecimal("8300.00"), body.convertedAmount());
    }

    @Test
    @DisplayName("Should convert USD to CAD")
    void testConvertUsdToCad() {
        String url = getBaseUrl() + "?from=USD&to=CAD&amount=100.00";
        
        ResponseEntity<ConversionResponse> response = restTemplate.getForEntity(
            url, 
            ConversionResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ConversionResponse body = response.getBody();
        assertEquals("USD", body.from());
        assertEquals("CAD", body.to());
        assertEquals(new BigDecimal("135.00"), body.convertedAmount());
    }

    @Test
    @DisplayName("Should convert USD to AUD")
    void testConvertUsdToAud() {
        String url = getBaseUrl() + "?from=USD&to=AUD&amount=100.00";
        
        ResponseEntity<ConversionResponse> response = restTemplate.getForEntity(
            url, 
            ConversionResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ConversionResponse body = response.getBody();
        assertEquals("USD", body.from());
        assertEquals("AUD", body.to());
        assertEquals(new BigDecimal("152.00"), body.convertedAmount());
    }

    @Test
    @DisplayName("Should handle zero amount")
    void testConvertZeroAmount() {
        String url = getBaseUrl() + "?from=USD&to=EUR&amount=0.00";
        
        ResponseEntity<ConversionResponse> response = restTemplate.getForEntity(
            url, 
            ConversionResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ConversionResponse body = response.getBody();
        assertEquals(new BigDecimal("0.00"), body.convertedAmount());
    }

    @Test
    @DisplayName("Should handle decimal amounts")
    void testConvertDecimalAmount() {
        String url = getBaseUrl() + "?from=USD&to=EUR&amount=50.50";
        
        ResponseEntity<ConversionResponse> response = restTemplate.getForEntity(
            url, 
            ConversionResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ConversionResponse body = response.getBody();
        assertEquals(new BigDecimal("50.50"), body.amount());
        assertEquals(new BigDecimal("46.46"), body.convertedAmount());
    }

    @Test
    @DisplayName("Should return 400 for negative amount")
    void testConvertNegativeAmount() {
        String url = getBaseUrl() + "?from=USD&to=EUR&amount=-100.00";
        
        ResponseEntity<String> response = restTemplate.getForEntity(
            url, 
            String.class
        );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("Should return 400 for unsupported from currency")
    void testConvertUnsupportedFromCurrency() {
        String url = getBaseUrl() + "?from=XYZ&to=EUR&amount=100.00";
        
        ResponseEntity<String> response = restTemplate.getForEntity(
            url, 
            String.class
        );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("Should return 400 for unsupported to currency")
    void testConvertUnsupportedToCurrency() {
        String url = getBaseUrl() + "?from=USD&to=XYZ&amount=100.00";
        
        ResponseEntity<String> response = restTemplate.getForEntity(
            url, 
            String.class
        );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("Should return 400 for missing from parameter")
    void testConvertMissingFromParameter() {
        String url = getBaseUrl() + "?to=EUR&amount=100.00";
        
        ResponseEntity<String> response = restTemplate.getForEntity(
            url, 
            String.class
        );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("Should return 400 for missing to parameter")
    void testConvertMissingToParameter() {
        String url = getBaseUrl() + "?from=USD&amount=100.00";
        
        ResponseEntity<String> response = restTemplate.getForEntity(
            url, 
            String.class
        );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("Should return 400 for missing amount parameter")
    void testConvertMissingAmountParameter() {
        String url = getBaseUrl() + "?from=USD&to=EUR";
        
        ResponseEntity<String> response = restTemplate.getForEntity(
            url, 
            String.class
        );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("Should return 400 for invalid amount format")
    void testConvertInvalidAmountFormat() {
        String url = getBaseUrl() + "?from=USD&to=EUR&amount=invalid";
        
        ResponseEntity<String> response = restTemplate.getForEntity(
            url, 
            String.class
        );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("Should include exchange rate in response")
    void testResponseIncludesRate() {
        String url = getBaseUrl() + "?from=USD&to=EUR&amount=100.00";
        
        ResponseEntity<ConversionResponse> response = restTemplate.getForEntity(
            url, 
            ConversionResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ConversionResponse body = response.getBody();
        assertNotNull(body.rate());
        assertTrue(body.rate().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @DisplayName("Should handle same currency conversion")
    void testConvertSameCurrency() {
        String url = getBaseUrl() + "?from=USD&to=USD&amount=100.00";
        
        ResponseEntity<ConversionResponse> response = restTemplate.getForEntity(
            url, 
            ConversionResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ConversionResponse body = response.getBody();
        assertEquals("USD", body.from());
        assertEquals("USD", body.to());
        assertEquals(new BigDecimal("100.00"), body.amount());
        assertEquals(new BigDecimal("100.00"), body.convertedAmount());
    }

    @Test
    @DisplayName("Should handle large amounts")
    void testConvertLargeAmount() {
        String url = getBaseUrl() + "?from=USD&to=EUR&amount=1000000.00";
        
        ResponseEntity<ConversionResponse> response = restTemplate.getForEntity(
            url, 
            ConversionResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ConversionResponse body = response.getBody();
        assertEquals(new BigDecimal("1000000.00"), body.amount());
        assertEquals(new BigDecimal("920000.00"), body.convertedAmount());
    }

    @Test
    @DisplayName("Should handle very small amounts")
    void testConvertVerySmallAmount() {
        String url = getBaseUrl() + "?from=USD&to=EUR&amount=0.01";
        
        ResponseEntity<ConversionResponse> response = restTemplate.getForEntity(
            url, 
            ConversionResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ConversionResponse body = response.getBody();
        assertEquals(new BigDecimal("0.01"), body.amount());
        // 0.01 * 0.92 = 0.0092, rounds to 0.01
        assertEquals(new BigDecimal("0.01"), body.convertedAmount());
    }

    @Test
    @DisplayName("Should convert EUR to GBP")
    void testConvertEurToGbp() {
        String url = getBaseUrl() + "?from=EUR&to=GBP&amount=100.00";
        
        ResponseEntity<ConversionResponse> response = restTemplate.getForEntity(
            url, 
            ConversionResponse.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        
        ConversionResponse body = response.getBody();
        assertEquals("EUR", body.from());
        assertEquals("GBP", body.to());
        assertEquals(new BigDecimal("100.00"), body.amount());
        // EUR (0.92) to GBP (0.79): 100/0.92 * 0.79 ≈ 85.87
        assertEquals(0, body.convertedAmount().compareTo(new BigDecimal("85.87")));
    }
}
