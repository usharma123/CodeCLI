package com.example.currency.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("OpenApiConfig Tests")
class OpenApiConfigTest {

    private OpenApiConfig config;
    private OpenAPI openAPI;

    @BeforeEach
    void setUp() {
        config = new OpenApiConfig();
        openAPI = config.currencyOpenApi();
    }

    @Nested
    @DisplayName("Bean Creation Tests")
    class BeanCreationTests {

        @Test
        @DisplayName("Should create non-null OpenAPI bean")
        void shouldCreateNonNullOpenApiBean() {
            assertNotNull(openAPI);
        }

        @Test
        @DisplayName("Should create OpenAPI with info")
        void shouldCreateOpenApiWithInfo() {
            assertNotNull(openAPI.getInfo());
        }

        @Test
        @DisplayName("Should create OpenAPI with servers")
        void shouldCreateOpenApiWithServers() {
            assertNotNull(openAPI.getServers());
            assertFalse(openAPI.getServers().isEmpty());
        }
    }

    @Nested
    @DisplayName("Info Configuration Tests")
    class InfoConfigurationTests {

        @Test
        @DisplayName("Should have correct API title")
        void shouldHaveCorrectApiTitle() {
            Info info = openAPI.getInfo();
            assertEquals("Currency Converter API", info.getTitle());
        }

        @Test
        @DisplayName("Should have correct API version")
        void shouldHaveCorrectApiVersion() {
            Info info = openAPI.getInfo();
            assertEquals("1.0", info.getVersion());
        }

        @Test
        @DisplayName("Should have non-null description")
        void shouldHaveNonNullDescription() {
            Info info = openAPI.getInfo();
            assertNotNull(info.getDescription());
        }

        @Test
        @DisplayName("Should have description mentioning supported currencies")
        void shouldHaveDescriptionMentioningSupportedCurrencies() {
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

        @Test
        @DisplayName("Should have description mentioning exchange rates")
        void shouldHaveDescriptionMentioningExchangeRates() {
            Info info = openAPI.getInfo();
            assertTrue(info.getDescription().contains("exchange rates"));
        }
    }

    @Nested
    @DisplayName("Contact Configuration Tests")
    class ContactConfigurationTests {

        @Test
        @DisplayName("Should have contact information")
        void shouldHaveContactInformation() {
            Contact contact = openAPI.getInfo().getContact();
            assertNotNull(contact);
        }

        @Test
        @DisplayName("Should have correct contact name")
        void shouldHaveCorrectContactName() {
            Contact contact = openAPI.getInfo().getContact();
            assertEquals("Currency API Support", contact.getName());
        }

        @Test
        @DisplayName("Should have correct contact email")
        void shouldHaveCorrectContactEmail() {
            Contact contact = openAPI.getInfo().getContact();
            assertEquals("support@currency.local", contact.getEmail());
        }
    }

    @Nested
    @DisplayName("License Configuration Tests")
    class LicenseConfigurationTests {

        @Test
        @DisplayName("Should have license information")
        void shouldHaveLicenseInformation() {
            License license = openAPI.getInfo().getLicense();
            assertNotNull(license);
        }

        @Test
        @DisplayName("Should have correct license name")
        void shouldHaveCorrectLicenseName() {
            License license = openAPI.getInfo().getLicense();
            assertEquals("Apache 2.0", license.getName());
        }

        @Test
        @DisplayName("Should have correct license URL")
        void shouldHaveCorrectLicenseUrl() {
            License license = openAPI.getInfo().getLicense();
            assertEquals("https://www.apache.org/licenses/LICENSE-2.0", license.getUrl());
        }
    }

    @Nested
    @DisplayName("Server Configuration Tests")
    class ServerConfigurationTests {

        @Test
        @DisplayName("Should have at least one server")
        void shouldHaveAtLeastOneServer() {
            assertFalse(openAPI.getServers().isEmpty());
            assertTrue(openAPI.getServers().size() >= 1);
        }

        @Test
        @DisplayName("Should have local server configured")
        void shouldHaveLocalServerConfigured() {
            Server server = openAPI.getServers().get(0);
            assertNotNull(server);
            assertEquals("http://localhost:8080", server.getUrl());
        }

        @Test
        @DisplayName("Should have server description")
        void shouldHaveServerDescription() {
            Server server = openAPI.getServers().get(0);
            assertNotNull(server.getDescription());
            assertEquals("Local server", server.getDescription());
        }
    }

    @Nested
    @DisplayName("Bean Consistency Tests")
    class BeanConsistencyTests {

        @Test
        @DisplayName("Should return consistent bean instances")
        void shouldReturnConsistentBeanInstances() {
            OpenAPI api1 = config.currencyOpenApi();
            OpenAPI api2 = config.currencyOpenApi();
            
            // Both should have the same configuration values
            assertEquals(api1.getInfo().getTitle(), api2.getInfo().getTitle());
            assertEquals(api1.getInfo().getVersion(), api2.getInfo().getVersion());
        }

        @Test
        @DisplayName("Should have all components properly initialized")
        void shouldHaveAllComponentsProperlyInitialized() {
            assertNotNull(openAPI);
            assertNotNull(openAPI.getInfo());
            assertNotNull(openAPI.getInfo().getTitle());
            assertNotNull(openAPI.getInfo().getVersion());
            assertNotNull(openAPI.getInfo().getDescription());
            assertNotNull(openAPI.getInfo().getContact());
            assertNotNull(openAPI.getInfo().getLicense());
            assertNotNull(openAPI.getServers());
        }
    }

    @Nested
    @DisplayName("Configuration Validation Tests")
    class ConfigurationValidationTests {

        @Test
        @DisplayName("Should have valid HTTP URL for server")
        void shouldHaveValidHttpUrlForServer() {
            Server server = openAPI.getServers().get(0);
            assertTrue(server.getUrl().startsWith("http://") || server.getUrl().startsWith("https://"));
        }

        @Test
        @DisplayName("Should have valid email format in contact")
        void shouldHaveValidEmailFormatInContact() {
            Contact contact = openAPI.getInfo().getContact();
            assertTrue(contact.getEmail().contains("@"));
        }

        @Test
        @DisplayName("Should have valid HTTPS URL for license")
        void shouldHaveValidHttpsUrlForLicense() {
            License license = openAPI.getInfo().getLicense();
            assertTrue(license.getUrl().startsWith("https://"));
        }

        @Test
        @DisplayName("Should have non-empty title")
        void shouldHaveNonEmptyTitle() {
            assertFalse(openAPI.getInfo().getTitle().isEmpty());
        }

        @Test
        @DisplayName("Should have non-empty version")
        void shouldHaveNonEmptyVersion() {
            assertFalse(openAPI.getInfo().getVersion().isEmpty());
        }

        @Test
        @DisplayName("Should have non-empty description")
        void shouldHaveNonEmptyDescription() {
            assertFalse(openAPI.getInfo().getDescription().isEmpty());
        }
    }
}
