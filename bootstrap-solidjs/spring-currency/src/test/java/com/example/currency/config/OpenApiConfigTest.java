package com.example.currency.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("OpenApiConfig Tests")
class OpenApiConfigTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Nested
    @DisplayName("Spring Context tests")
    class SpringContextTests {

        @Test
        @DisplayName("OpenApiConfig should be loaded in Spring context")
        void openApiConfigShouldBeLoadedInContext() {
            OpenApiConfig config = applicationContext.getBean(OpenApiConfig.class);
            assertNotNull(config, "OpenApiConfig should be a Spring bean");
        }

        @Test
        @DisplayName("OpenAPI bean should be created")
        void openApiBeanShouldBeCreated() {
            OpenAPI openAPI = applicationContext.getBean(OpenAPI.class);
            assertNotNull(openAPI, "OpenAPI bean should exist");
        }
    }

    @Nested
    @DisplayName("currencyOpenApi() bean tests")
    class CurrencyOpenApiBeanTests {

        @Test
        @DisplayName("should create OpenAPI bean with correct title")
        void shouldCreateOpenApiBeanWithCorrectTitle() {
            OpenApiConfig config = new OpenApiConfig();
            OpenAPI openAPI = config.currencyOpenApi();

            assertNotNull(openAPI);
            assertNotNull(openAPI.getInfo());
            assertEquals("Currency Converter API", openAPI.getInfo().getTitle());
        }

        @Test
        @DisplayName("should set correct version")
        void shouldSetCorrectVersion() {
            OpenApiConfig config = new OpenApiConfig();
            OpenAPI openAPI = config.currencyOpenApi();

            assertNotNull(openAPI.getInfo());
            assertEquals("1.0", openAPI.getInfo().getVersion());
        }

        @Test
        @DisplayName("should set correct description")
        void shouldSetCorrectDescription() {
            OpenApiConfig config = new OpenApiConfig();
            OpenAPI openAPI = config.currencyOpenApi();

            assertNotNull(openAPI.getInfo());
            assertNotNull(openAPI.getInfo().getDescription());
            assertTrue(openAPI.getInfo().getDescription().contains("currency converter"));
        }

        @Test
        @DisplayName("should include supported currencies in description")
        void shouldIncludeSupportedCurrenciesInDescription() {
            OpenApiConfig config = new OpenApiConfig();
            OpenAPI openAPI = config.currencyOpenApi();

            String description = openAPI.getInfo().getDescription();
            assertTrue(description.contains("USD"));
            assertTrue(description.contains("EUR"));
            assertTrue(description.contains("GBP"));
            assertTrue(description.contains("JPY"));
        }

        @Test
        @DisplayName("should set contact information")
        void shouldSetContactInformation() {
            OpenApiConfig config = new OpenApiConfig();
            OpenAPI openAPI = config.currencyOpenApi();

            Contact contact = openAPI.getInfo().getContact();
            assertNotNull(contact, "Contact should not be null");
            assertEquals("Currency API Support", contact.getName());
            assertEquals("support@currency.local", contact.getEmail());
        }

        @Test
        @DisplayName("should set license information")
        void shouldSetLicenseInformation() {
            OpenApiConfig config = new OpenApiConfig();
            OpenAPI openAPI = config.currencyOpenApi();

            License license = openAPI.getInfo().getLicense();
            assertNotNull(license, "License should not be null");
            assertEquals("Apache 2.0", license.getName());
        }

        @Test
        @DisplayName("should set server configuration")
        void shouldSetServerConfiguration() {
            OpenApiConfig config = new OpenApiConfig();
            OpenAPI openAPI = config.currencyOpenApi();

            List<Server> servers = openAPI.getServers();
            assertNotNull(servers);
            assertFalse(servers.isEmpty());

            Server server = servers.get(0);
            assertEquals("http://localhost:8080", server.getUrl());
            assertEquals("Local server", server.getDescription());
        }

        @Test
        @DisplayName("should have exactly one server")
        void shouldHaveExactlyOneServer() {
            OpenApiConfig config = new OpenApiConfig();
            OpenAPI openAPI = config.currencyOpenApi();

            assertNotNull(openAPI.getServers());
            assertEquals(1, openAPI.getServers().size());
        }
    }

    @Nested
    @DisplayName("OpenAPI object structure tests")
    class OpenAPIStructureTests {

        @Test
        @DisplayName("OpenAPI should have info section")
        void openApiShouldHaveInfoSection() {
            OpenApiConfig config = new OpenApiConfig();
            OpenAPI openAPI = config.currencyOpenApi();

            assertNotNull(openAPI.getInfo());
        }

        @Test
        @DisplayName("Info should have all required fields")
        void infoShouldHaveAllRequiredFields() {
            OpenApiConfig config = new OpenApiConfig();
            OpenAPI openAPI = config.currencyOpenApi();

            Info info = openAPI.getInfo();
            assertNotNull(info);
            assertNotNull(info.getTitle());
            assertNotNull(info.getVersion());
            assertNotNull(info.getDescription());
        }

        @Test
        @DisplayName("should be able to create multiple OpenAPI instances")
        void shouldCreateMultipleOpenApiInstances() {
            OpenApiConfig config = new OpenApiConfig();

            OpenAPI openAPI1 = config.currencyOpenApi();
            OpenAPI openAPI2 = config.currencyOpenApi();

            assertNotNull(openAPI1);
            assertNotNull(openAPI2);
            assertEquals(openAPI1.getInfo().getTitle(), openAPI2.getInfo().getTitle());
        }
    }

    @Nested
    @DisplayName("Edge case tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("should handle empty server list gracefully")
        void shouldHandleEmptyServerList() {
            OpenAPI openAPI = new OpenAPI()
                    .info(new Info().title("Test").version("1.0"));

            assertNotNull(openAPI);
            assertEquals("Test", openAPI.getInfo().getTitle());
        }

        @Test
        @DisplayName("OpenAPI should be configurable")
        void openApiShouldBeConfigurable() {
            OpenAPI openAPI = new OpenAPI()
                    .info(new Info()
                            .title("Custom Title")
                            .version("2.0")
                            .description("Custom Description"));

            assertEquals("Custom Title", openAPI.getInfo().getTitle());
            assertEquals("2.0", openAPI.getInfo().getVersion());
            assertEquals("Custom Description", openAPI.getInfo().getDescription());
        }
    }
}
