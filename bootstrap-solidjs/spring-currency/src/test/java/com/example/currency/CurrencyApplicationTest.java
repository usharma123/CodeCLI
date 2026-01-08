package com.example.currency;

import com.example.currency.controller.CurrencyController;
import com.example.currency.service.ExchangeRateService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("CurrencyApplication Tests")
class CurrencyApplicationTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Nested
    @DisplayName("Application Context Tests")
    class ApplicationContextTests {

        @Test
        @DisplayName("Should load application context successfully")
        void shouldLoadApplicationContextSuccessfully() {
            assertNotNull(applicationContext);
        }

        @Test
        @DisplayName("Should have CurrencyController bean")
        void shouldHaveCurrencyControllerBean() {
            CurrencyController controller = applicationContext.getBean(CurrencyController.class);
            assertNotNull(controller);
        }

        @Test
        @DisplayName("Should have ExchangeRateService bean")
        void shouldHaveExchangeRateServiceBean() {
            ExchangeRateService service = applicationContext.getBean(ExchangeRateService.class);
            assertNotNull(service);
        }
    }

    @Nested
    @DisplayName("Bean Wiring Tests")
    class BeanWiringTests {

        @Test
        @DisplayName("Should wire all beans correctly")
        void shouldWireAllBeansCorrectly() {
            String[] beanNames = applicationContext.getBeanDefinitionNames();
            assertTrue(beanNames.length > 0);
        }

        @Test
        @DisplayName("Should have singleton scope for service bean")
        void shouldHaveSingletonScopeForServiceBean() {
            ExchangeRateService service1 = applicationContext.getBean(ExchangeRateService.class);
            ExchangeRateService service2 = applicationContext.getBean(ExchangeRateService.class);
            assertSame(service1, service2);
        }

        @Test
        @DisplayName("Should have singleton scope for controller bean")
        void shouldHaveSingletonScopeForControllerBean() {
            CurrencyController controller1 = applicationContext.getBean(CurrencyController.class);
            CurrencyController controller2 = applicationContext.getBean(CurrencyController.class);
            assertSame(controller1, controller2);
        }
    }

    @Nested
    @DisplayName("Spring Boot Configuration Tests")
    class SpringBootConfigurationTests {

        @Test
        @DisplayName("Should have application context with beans")
        void shouldHaveApplicationContextWithBeans() {
            assertTrue(applicationContext.getBeanDefinitionCount() > 0);
        }

        @Test
        @DisplayName("Should be able to retrieve beans by name")
        void shouldBeAbleToRetrieveBeansByName() {
            assertDoesNotThrow(() -> 
                applicationContext.getBean("currencyController")
            );
        }

        @Test
        @DisplayName("Should be able to retrieve beans by type")
        void shouldBeAbleToRetrieveBeansByType() {
            assertDoesNotThrow(() -> 
                applicationContext.getBean(ExchangeRateService.class)
            );
        }
    }

    @Nested
    @DisplayName("Application Startup Tests")
    class ApplicationStartupTests {

        @Test
        @DisplayName("Should start application without exceptions")
        void shouldStartApplicationWithoutExceptions() {
            assertDoesNotThrow(() -> {
                CurrencyApplication.main(new String[]{});
            });
        }

        @Test
        @DisplayName("Should have running application context")
        void shouldHaveRunningApplicationContext() {
            assertNotNull(applicationContext);
            assertTrue(applicationContext.getBeanDefinitionCount() > 0);
        }

        @Test
        @DisplayName("Should have environment configured")
        void shouldHaveEnvironmentConfigured() {
            assertNotNull(applicationContext.getEnvironment());
        }
    }
}
