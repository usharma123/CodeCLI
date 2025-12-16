package com.codecli.currency;

import com.codecli.currency.controller.ConversionController;
import com.codecli.currency.service.ConversionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("CurrencyConverterApplication Tests")
class CurrencyConverterApplicationTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    @DisplayName("Should load application context")
    void contextLoads() {
        assertNotNull(applicationContext);
    }

    @Test
    @DisplayName("Should have ConversionService bean")
    void shouldHaveConversionServiceBean() {
        ConversionService service = applicationContext.getBean(ConversionService.class);
        assertNotNull(service);
    }

    @Test
    @DisplayName("Should have ConversionController bean")
    void shouldHaveConversionControllerBean() {
        ConversionController controller = applicationContext.getBean(ConversionController.class);
        assertNotNull(controller);
    }

    @Test
    @DisplayName("Should have CurrencyConverterApplication bean")
    void shouldHaveCurrencyConverterApplicationBean() {
        // The main application class itself should be a bean
        assertTrue(applicationContext.containsBean("currencyConverterApplication"));
    }

    @Test
    @DisplayName("Should have exactly one ConversionService bean")
    void shouldHaveExactlyOneConversionServiceBean() {
        String[] beans = applicationContext.getBeanNamesForType(ConversionService.class);
        assertEquals(1, beans.length);
    }

    @Test
    @DisplayName("Should have exactly one ConversionController bean")
    void shouldHaveExactlyOneConversionControllerBean() {
        String[] beans = applicationContext.getBeanNamesForType(ConversionController.class);
        assertEquals(1, beans.length);
    }

    @Test
    @DisplayName("ConversionController should be autowired with ConversionService")
    void shouldAutowireConversionServiceIntoController() {
        ConversionController controller = applicationContext.getBean(ConversionController.class);
        assertNotNull(controller);
        // If controller is created, it means ConversionService was successfully autowired
        // (constructor injection would fail if service wasn't available)
    }
}
