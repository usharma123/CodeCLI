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
    @DisplayName("ConfigInstantiationTests")
    class ConfigInstantiationTests {

        @Test
        @DisplayName("config should be instantiable with no-arg constructor")
        void configShouldBeInstantiableWithNoArgConstructor() {
            assertNotNull(config);
        }

        @Test
        @DisplayName("currencyOpenApi should return non-null OpenAPI")
        void currencyOpenApiShouldReturnNonNullOpenAPI() {
            assertNotNull(openApi);
        }

        @Test
        @DisplayName("currencyOpenApi should return same instance on multiple calls")
        void currencyOpenApiShouldReturnSameInstanceOnMultipleCalls() {
            OpenAPI openApi1 = config.currencyOpenApi();
            OpenAPI openApi2 = config.currencyOpenApi();

            // Should return same OpenAPI object (stateless bean)
            assertNotNull(openApi1);
            assertNotNull(openApi2);
        }
    }

    @Nested
    @DisplayName("OpenAPICreationTests")
    class OpenAPICreationTests {

        @Test
        @DisplayName("OpenAPI should have info section")
        void openAPIShouldHaveInfoSection() {
            assertNotNull(openApi.getInfo());
        }

        @Test
        @DisplayName("OpenAPI should have servers list")
        void openAPIShouldHaveServersList() {
            assertNotNull(openApi.getServers());
            assertFalse(openApi.getServers().isEmpty());
        }

        @Test
        @DisplayName("OpenAPI info should have title")
        void openAPIInfoShouldHaveTitle() {
            Info info = openApi.getInfo();
            assertNotNull(info);
            assertEquals("Currency Converter API", info.getTitle());
        }

        @Test
        @DisplayName("OpenAPI info should have version")
        void openAPIInfoShouldHaveVersion() {
            Info info = openApi.getInfo();
            assertNotNull(info);
            assertEquals("1.0", info.getVersion());
        }

        @Test
        @DisplayName("OpenAPI info should have description")
        void openAPIInfoShouldHaveDescription() {
            Info info = openApi.getInfo();
            assertNotNull(info);
            assertNotNull(info.getDescription());
            assertTrue(info.getDescription().toLowerCase().contains("currency converter"),
                "Description should contain 'Currency Converter'");
        }

        @Test
        @DisplayName("OpenAPI info description should list supported currencies")
        void openAPIInfoDescriptionShouldListSupportedCurrencies() {
            Info info = openApi.getInfo();
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
    @DisplayName("InfoSectionTests")
    class InfoSectionTests {

        @Test
        @DisplayName("OpenAPI should have contact information")
        void openAPIShouldHaveContactInformation() {
            Contact contact = openApi.getInfo().getContact();
            assertNotNull(contact);
        }

        @Test
        @DisplayName("Contact should have name")
        void contactShouldHaveName() {
            Contact contact = openApi.getInfo().getContact();
            assertEquals("Currency API Support", contact.getName());
        }

        @Test
        @DisplayName("Contact should have email")
        void contactShouldHaveEmail() {
            Contact contact = openApi.getInfo().getContact();
            assertEquals("support@currency.local", contact.getEmail());
        }
    }

    @Nested
    @DisplayName("ContactTests")
    class ContactTests {

        @Test
        @DisplayName("Contact name should not be null")
        void contactNameShouldNotBeNull() {
            Contact contact = openApi.getInfo().getContact();
            assertNotNull(contact.getName());
        }

        @Test
        @DisplayName("Contact email should not be null")
        void contactEmailShouldNotBeNull() {
            Contact contact = openApi.getInfo().getContact();
            assertNotNull(contact.getEmail());
        }

        @Test
        @DisplayName("Contact email should be valid format")
        void contactEmailShouldBeValidFormat() {
            Contact contact = openApi.getInfo().getContact();
            String email = contact.getEmail();
            assertTrue(email.contains("@"));
            assertTrue(email.contains("."));
        }
    }

    @Nested
    @DisplayName("LicenseTests")
    class LicenseTests {

        @Test
        @DisplayName("OpenAPI should have license information")
        void openAPIShouldHaveLicenseInformation() {
            License license = openApi.getInfo().getLicense();
            assertNotNull(license);
        }

        @Test
        @DisplayName("License should have name")
        void licenseShouldHaveName() {
            License license = openApi.getInfo().getLicense();
            assertEquals("Apache 2.0", license.getName());
        }

        @Test
        @DisplayName("License should have URL")
        void licenseShouldHaveURL() {
            License license = openApi.getInfo().getLicense();
            assertNotNull(license.getUrl());
            assertTrue(license.getUrl().contains("apache.org"));
        }
    }

    @Nested
    @DisplayName("ServersTests")
    class ServersTests {

        @Test
        @DisplayName("Servers list should have exactly one server")
        void serversListShouldHaveExactlyOneServer() {
            List<Server> servers = openApi.getServers();
            assertEquals(1, servers.size());
        }

        @Test
        @DisplayName("Server should have URL")
        void serverShouldHaveURL() {
            Server server = openApi.getServers().get(0);
            assertNotNull(server.getUrl());
        }

        @Test
        @DisplayName("Server URL should be localhost")
        void serverURLShouldBeLocalhost() {
            Server server = openApi.getServers().get(0);
            assertEquals("http://localhost:8080", server.getUrl());
        }

        @Test
        @DisplayName("Server should have description")
        void serverShouldHaveDescription() {
            Server server = openApi.getServers().get(0);
            assertNotNull(server.getDescription());
            assertEquals("Local server", server.getDescription());
        }
    }

    @Nested
    @DisplayName("FullOpenAPIStructureTests")
    class FullOpenAPIStructureTests {

        @Test
        @DisplayName("Complete OpenAPI structure should be valid")
        void completeOpenAPIStructureShouldBeValid() {
            assertNotNull(openApi);
            assertNotNull(openApi.getInfo());
            assertNotNull(openApi.getServers());
            assertFalse(openApi.getServers().isEmpty());

            // Verify all required components
            Info info = openApi.getInfo();
            assertNotNull(info.getTitle());
            assertNotNull(info.getVersion());
            assertNotNull(info.getDescription());
        }

        @Test
        @DisplayName("All info components should be properly linked")
        void allInfoComponentsShouldBeProperlyLinked() {
            Info info = openApi.getInfo();

            assertNotNull(info.getContact());
            assertNotNull(info.getLicense());

            Contact contact = info.getContact();
            assertNotNull(contact.getName());
            assertNotNull(contact.getEmail());

            License license = info.getLicense();
            assertNotNull(license.getName());
            assertNotNull(license.getUrl());
        }

        @Test
        @DisplayName("OpenAPI should be reusable across multiple calls")
        void openAPIShouldBeReusableAcrossMultipleCalls() {
            OpenAPI first = config.currencyOpenApi();
            OpenAPI second = config.currencyOpenApi();

            assertNotNull(first);
            assertNotNull(second);

            // Both should produce equivalent OpenAPI definitions
            assertEquals(first.getInfo().getTitle(), second.getInfo().getTitle());
            assertEquals(first.getInfo().getVersion(), second.getInfo().getVersion());
            assertEquals(first.getServers().size(), second.getServers().size());
        }
    }
}