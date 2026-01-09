package com.example.currency.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("OpenApiConfig Tests")
class OpenApiConfigTest {

    private final OpenApiConfig openApiConfig = new OpenApiConfig();

    @Nested
    @DisplayName("CurrencyOpenApi Method Tests")
    class CurrencyOpenApiTests {

        @Test
        @DisplayName("Should return non-null OpenAPI object")
        void shouldReturnNonNullOpenApiObject() {
            OpenAPI openAPI = openApiConfig.currencyOpenApi();

            assertNotNull(openAPI);
        }

        @Test
        @DisplayName("OpenAPI should have info section")
        void openApiShouldHaveInfoSection() {
            OpenAPI openAPI = openApiConfig.currencyOpenApi();

            Info info = openAPI.getInfo();
            assertNotNull(info);
        }

        @Test
        @DisplayName("OpenAPI info should have correct title")
        void openApiInfoShouldHaveCorrectTitle() {
            OpenAPI openAPI = openApiConfig.currencyOpenApi();

            Info info = openAPI.getInfo();
            assertEquals("Currency Converter API", info.getTitle());
        }

        @Test
        @DisplayName("OpenAPI info should have correct version")
        void openApiInfoShouldHaveCorrectVersion() {
            OpenAPI openAPI = openApiConfig.currencyOpenApi();

            Info info = openAPI.getInfo();
            assertEquals("1.0", info.getVersion());
        }

        @Test
        @DisplayName("OpenAPI info should have description")
        void openApiInfoShouldHaveDescription() {
            OpenAPI openAPI = openApiConfig.currencyOpenApi();

            Info info = openAPI.getInfo();
            assertNotNull(info.getDescription());
            assertFalse(info.getDescription().isEmpty());
        }

        @Test
        @DisplayName("OpenAPI info should contain supported currencies")
        void openApiInfoShouldContainSupportedCurrencies() {
            OpenAPI openAPI = openApiConfig.currencyOpenApi();

            Info info = openAPI.getInfo();
            String description = info.getDescription();

            assertTrue(description.contains("USD"));
            assertTrue(description.contains("EUR"));
            assertTrue(description.contains("GBP"));
            assertTrue(description.contains("JPY"));
            assertTrue(description.contains("CAD"));
            assertTrue(description.contains("AUD"));
            assertTrue(description.contains("CHF"));
            assertTrue(description.contains("CNY"));
            assertTrue(description.contains("INR"));
            assertTrue(description.contains("MXN"));
        }
    }

    @Nested
    @DisplayName("Contact Tests")
    class ContactTests {

        @Test
        @DisplayName("OpenAPI should have contact")
        void openApiShouldHaveContact() {
            OpenAPI openAPI = openApiConfig.currencyOpenApi();

            Contact contact = openAPI.getInfo().getContact();
            assertNotNull(contact);
        }

        @Test
        @DisplayName("Contact should have correct name")
        void contactShouldHaveCorrectName() {
            OpenAPI openAPI = openApiConfig.currencyOpenApi();

            Contact contact = openAPI.getInfo().getContact();
            assertEquals("Currency API Support", contact.getName());
        }

        @Test
        @DisplayName("Contact should have correct email")
        void contactShouldHaveCorrectEmail() {
            OpenAPI openAPI = openApiConfig.currencyOpenApi();

            Contact contact = openAPI.getInfo().getContact();
            assertEquals("support@currency.local", contact.getEmail());
        }
    }

    @Nested
    @DisplayName("License Tests")
    class LicenseTests {

        @Test
        @DisplayName("OpenAPI should have license")
        void openApiShouldHaveLicense() {
            OpenAPI openAPI = openApiConfig.currencyOpenApi();

            License license = openAPI.getInfo().getLicense();
            assertNotNull(license);
        }

        @Test
        @DisplayName("License should have correct name")
        void licenseShouldHaveCorrectName() {
            OpenAPI openAPI = openApiConfig.currencyOpenApi();

            License license = openAPI.getInfo().getLicense();
            assertEquals("Apache 2.0", license.getName());
        }

        @Test
        @DisplayName("License should have correct URL")
        void licenseShouldHaveCorrectUrl() {
            OpenAPI openAPI = openApiConfig.currencyOpenApi();

            License license = openAPI.getInfo().getLicense();
            assertEquals("https://www.apache.org/licenses/LICENSE-2.0", license.getUrl());
        }
    }

    @Nested
    @DisplayName("Server Tests")
    class ServerTests {

        @Test
        @DisplayName("OpenAPI should have servers")
        void openApiShouldHaveServers() {
            OpenAPI openAPI = openApiConfig.currencyOpenApi();

            List<Server> servers = openAPI.getServers();
            assertNotNull(servers);
            assertFalse(servers.isEmpty());
        }

        @Test
        @DisplayName("Should have exactly one server")
        void shouldHaveExactlyOneServer() {
            OpenAPI openAPI = openApiConfig.currencyOpenApi();

            List<Server> servers = openAPI.getServers();
            assertEquals(1, servers.size());
        }

        @Test
        @DisplayName("Server should have correct URL")
        void serverShouldHaveCorrectUrl() {
            OpenAPI openAPI = openApiConfig.currencyOpenApi();

            Server server = openAPI.getServers().get(0);
            assertEquals("http://localhost:8080", server.getUrl());
        }

        @Test
        @DisplayName("Server should have description")
        void serverShouldHaveDescription() {
            OpenAPI openAPI = openApiConfig.currencyOpenApi();

            Server server = openAPI.getServers().get(0);
            assertEquals("Local server", server.getDescription());
        }
    }

    @Nested
    @DisplayName("Constructor Tests")
    class ConstructorTests {

        @Test
        @DisplayName("Should be able to create instance with default constructor")
        void shouldCreateInstanceWithDefaultConstructor() {
            OpenApiConfig config = new OpenApiConfig();
            assertNotNull(config);
        }

        @Test
        @DisplayName("currencyOpenApi should work on newly created instance")
        void currencyOpenApiShouldWorkOnNewInstance() {
            OpenApiConfig config = new OpenApiConfig();
            OpenAPI openAPI = config.currencyOpenApi();

            assertNotNull(openAPI);
            assertEquals("Currency Converter API", openAPI.getInfo().getTitle());
        }
    }
}
