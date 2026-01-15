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

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("OpenApiConfig Tests")
class OpenApiConfigTest {

    private OpenApiConfig config;
    private OpenAPI openApi;

    @BeforeEach
    void setUp() {
        config = new OpenApiConfig();
        openApi = config.currencyOpenApi();
    }

    @Nested
    @DisplayName("OpenAPI Bean Creation Tests")
    class OpenAPICreationTests {

        @Test
        @DisplayName("should create non-null OpenAPI bean")
        void shouldCreateNonNullOpenAPIBean() {
            assertNotNull(openApi);
        }

        @Test
        @DisplayName("should create OpenAPI with info section")
        void shouldCreateOpenAPIWithInfoSection() {
            assertNotNull(openApi.getInfo());
        }
    }

    @Nested
    @DisplayName("Info Section Tests")
    class InfoSectionTests {

        @Test
        @DisplayName("info should have correct title")
        void infoShouldHaveCorrectTitle() {
            Info info = openApi.getInfo();

            assertEquals("Currency Converter API", info.getTitle());
        }

        @Test
        @DisplayName("info should have correct version")
        void infoShouldHaveCorrectVersion() {
            Info info = openApi.getInfo();

            assertEquals("1.0", info.getVersion());
        }

        @Test
        @DisplayName("info should have description with supported currencies")
        void infoShouldHaveDescriptionWithSupportedCurrencies() {
            Info info = openApi.getInfo();

            assertNotNull(info.getDescription());
            assertTrue(info.getDescription().contains("USD"));
            assertTrue(info.getDescription().contains("EUR"));
            assertTrue(info.getDescription().contains("GBP"));
            assertTrue(info.getDescription().contains("JPY"));
            assertTrue(info.getDescription().contains("CAD"));
            assertTrue(info.getDescription().contains("AUD"));
            assertTrue(info.getDescription().contains("CHF"));
            assertTrue(info.getDescription().contains("CNY"));
            assertTrue(info.getDescription().contains("INR"));
            assertTrue(info.getDescription().contains("MXN"));
        }

        @Test
        @DisplayName("info should contain Currency Converter API description text")
        void infoShouldContainCurrencyConverterAPIDescriptionText() {
            Info info = openApi.getInfo();

            assertTrue(info.getDescription().contains("Simple currency converter"));
        }
    }

    @Nested
    @DisplayName("Contact Tests")
    class ContactTests {

        @Test
        @DisplayName("info should have contact section")
        void infoShouldHaveContactSection() {
            Contact contact = openApi.getInfo().getContact();

            assertNotNull(contact);
        }

        @Test
        @DisplayName("contact should have correct name")
        void contactShouldHaveCorrectName() {
            Contact contact = openApi.getInfo().getContact();

            assertEquals("Currency API Support", contact.getName());
        }

        @Test
        @DisplayName("contact should have correct email")
        void contactShouldHaveCorrectEmail() {
            Contact contact = openApi.getInfo().getContact();

            assertEquals("support@currency.local", contact.getEmail());
        }

        @Test
        @DisplayName("contact should have name and email")
        void contactShouldHaveNameAndEmail() {
            Contact contact = openApi.getInfo().getContact();

            assertNotNull(contact.getName());
            assertNotNull(contact.getEmail());
            assertFalse(contact.getName().isEmpty());
            assertFalse(contact.getEmail().isEmpty());
        }
    }

    @Nested
    @DisplayName("License Tests")
    class LicenseTests {

        @Test
        @DisplayName("info should have license section")
        void infoShouldHaveLicenseSection() {
            License license = openApi.getInfo().getLicense();

            assertNotNull(license);
        }

        @Test
        @DisplayName("license should have correct name")
        void licenseShouldHaveCorrectName() {
            License license = openApi.getInfo().getLicense();

            assertEquals("Apache 2.0", license.getName());
        }

        @Test
        @DisplayName("license should have correct URL")
        void licenseShouldHaveCorrectURL() {
            License license = openApi.getInfo().getLicense();

            assertNotNull(license.getUrl());
            assertEquals("https://www.apache.org/licenses/LICENSE-2.0", license.getUrl());
        }
    }

    @Nested
    @DisplayName("Servers Tests")
    class ServersTests {

        @Test
        @DisplayName("openAPI should have servers list")
        void openAPIShouldHaveServersList() {
            List<Server> servers = openApi.getServers();

            assertNotNull(servers);
        }

        @Test
        @DisplayName("should have exactly one server")
        void shouldHaveExactlyOneServer() {
            List<Server> servers = openApi.getServers();

            assertEquals(1, servers.size());
        }

        @Test
        @DisplayName("server should have correct URL")
        void serverShouldHaveCorrectURL() {
            Server server = openApi.getServers().get(0);

            assertEquals("http://localhost:8080", server.getUrl());
        }

        @Test
        @DisplayName("server should have description")
        void serverShouldHaveDescription() {
            Server server = openApi.getServers().get(0);

            assertEquals("Local server", server.getDescription());
        }

        @Test
        @DisplayName("server should have URL and description")
        void serverShouldHaveURLAndDescription() {
            Server server = openApi.getServers().get(0);

            assertNotNull(server.getUrl());
            assertNotNull(server.getDescription());
            assertFalse(server.getDescription().isEmpty());
        }
    }

    @Nested
    @DisplayName("Config Instantiation Tests")
    class ConfigInstantiationTests {

        @Test
        @DisplayName("should instantiate config successfully")
        void shouldInstantiateConfigSuccessfully() {
            assertDoesNotThrow(() -> new OpenApiConfig());
        }

        @Test
        @DisplayName("multiple calls should return equivalent OpenAPI objects")
        void multipleCallsShouldReturnEquivalentOpenAPIObjects() {
            OpenAPI openApi1 = config.currencyOpenApi();
            OpenAPI openApi2 = new OpenApiConfig().currencyOpenApi();

            // Both should have same structure
            assertEquals(openApi1.getInfo().getTitle(), openApi2.getInfo().getTitle());
            assertEquals(openApi1.getInfo().getVersion(), openApi2.getInfo().getVersion());
            assertEquals(openApi1.getServers().size(), openApi2.getServers().size());
        }

        @Test
        @DisplayName("currencyOpenApi method should not return null")
        void currencyOpenApiMethodShouldNotReturnNull() {
            OpenApiConfig newConfig = new OpenApiConfig();

            assertNotNull(newConfig.currencyOpenApi());
        }
    }

    @Nested
    @DisplayName("Full OpenAPI Structure Tests")
    class FullOpenAPIStructureTests {

        @Test
        @DisplayName("openAPI should have all required components")
        void openAPIShouldHaveAllRequiredComponents() {
            assertNotNull(openApi);
            assertNotNull(openApi.getInfo());
            assertNotNull(openApi.getInfo().getContact());
            assertNotNull(openApi.getInfo().getLicense());
            assertNotNull(openApi.getServers());
        }

        @Test
        @DisplayName("openAPI info should contain all expected data")
        void openAPIInfoShouldContainAllExpectedData() {
            Info info = openApi.getInfo();

            assertAll(
                    () -> assertNotNull(info.getTitle()),
                    () -> assertNotNull(info.getVersion()),
                    () -> assertNotNull(info.getDescription()),
                    () -> assertNotNull(info.getContact()),
                    () -> assertNotNull(info.getLicense())
            );
        }
    }
}
