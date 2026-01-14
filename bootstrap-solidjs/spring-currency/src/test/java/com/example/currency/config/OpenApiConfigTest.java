package com.example.currency.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("OpenApiConfig Tests")
class OpenApiConfigTest {

    private final OpenApiConfig config = new OpenApiConfig();

    @Test
    @DisplayName("currencyOpenApi bean should be created successfully")
    void testBeanCreation() {
        OpenAPI openAPI = config.currencyOpenApi();

        assertNotNull(openAPI);
    }

    @Test
    @DisplayName("OpenAPI should have correct title")
    void testApiTitle() {
        OpenAPI openAPI = config.currencyOpenApi();
        Info info = openAPI.getInfo();

        assertNotNull(info);
        assertEquals("Currency Converter API", info.getTitle());
    }

    @Test
    @DisplayName("OpenAPI should have correct version")
    void testApiVersion() {
        OpenAPI openAPI = config.currencyOpenApi();
        Info info = openAPI.getInfo();

        assertNotNull(info);
        assertEquals("1.0", info.getVersion());
    }

    @Test
    @DisplayName("OpenAPI should have description mentioning supported currencies")
    void testApiDescription() {
        OpenAPI openAPI = config.currencyOpenApi();
        Info info = openAPI.getInfo();

        assertNotNull(info);
        String description = info.getDescription();
        assertNotNull(description);
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
    @DisplayName("OpenAPI should have contact information")
    void testApiContact() {
        OpenAPI openAPI = config.currencyOpenApi();
        Info info = openAPI.getInfo();
        Contact contact = info.getContact();

        assertNotNull(contact);
        assertEquals("Currency API Support", contact.getName());
        assertEquals("support@currency.local", contact.getEmail());
    }

    @Test
    @DisplayName("OpenAPI should have license information")
    void testApiLicense() {
        OpenAPI openAPI = config.currencyOpenApi();
        Info info = openAPI.getInfo();
        License license = info.getLicense();

        assertNotNull(license);
        assertEquals("Apache 2.0", license.getName());
        assertEquals("https://www.apache.org/licenses/LICENSE-2.0", license.getUrl());
    }

    @Test
    @DisplayName("OpenAPI should have servers configured")
    void testApiServers() {
        OpenAPI openAPI = config.currencyOpenApi();
        List<Server> servers = openAPI.getServers();

        assertNotNull(servers);
        assertEquals(1, servers.size());

        Server server = servers.get(0);
        assertEquals("http://localhost:8080", server.getUrl());
        assertEquals("Local server", server.getDescription());
    }

    @Test
    @DisplayName("currencyOpenApi should return consistent results")
    void testConsistency() {
        OpenAPI openAPI1 = config.currencyOpenApi();
        OpenAPI openAPI2 = config.currencyOpenApi();

        assertEquals(openAPI1.getInfo().getTitle(), openAPI2.getInfo().getTitle());
        assertEquals(openAPI1.getInfo().getVersion(), openAPI2.getInfo().getVersion());
    }

    @Test
    @DisplayName("OpenAPI info should not be null")
    void testInfoNotNull() {
        OpenAPI openAPI = config.currencyOpenApi();

        assertNotNull(openAPI.getInfo());
    }

    @Test
    @DisplayName("OpenAPI servers list should not be empty")
    void testServersNotEmpty() {
        OpenAPI openAPI = config.currencyOpenApi();

        assertNotNull(openAPI.getServers());
        assertFalse(openAPI.getServers().isEmpty());
    }
}