package com.example.currency.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * OpenApiConfig tests - covers OpenAPI bean creation and configuration.
 */
@DisplayName("OpenApiConfig Tests")
class OpenApiConfigTest {

    private OpenApiConfig config;

    @BeforeEach
    void setUp() {
        config = new OpenApiConfig();
    }

    @Test
    @DisplayName("Should create OpenAPI bean with correct configuration")
    void shouldCreateOpenApiBean() {
        OpenAPI openApi = config.currencyOpenApi();

        assertNotNull(openApi, "OpenAPI should not be null");
        assertNotNull(openApi.getInfo(), "Info should not be null");
    }

    @Test
    @DisplayName("Should set correct API title")
    void shouldSetCorrectTitle() {
        OpenAPI openApi = config.currencyOpenApi();
        Info info = openApi.getInfo();

        assertEquals("Currency Converter API", info.getTitle());
    }

    @Test
    @DisplayName("Should set correct API version")
    void shouldSetCorrectVersion() {
        OpenAPI openApi = config.currencyOpenApi();
        Info info = openApi.getInfo();

        assertEquals("1.0", info.getVersion());
    }

    @Test
    @DisplayName("Should set correct API description")
    void shouldSetCorrectDescription() {
        OpenAPI openApi = config.currencyOpenApi();
        Info info = openApi.getInfo();

        assertNotNull(info.getDescription());
        assertTrue(info.getDescription().contains("Supported currencies:"));
    }

    @Test
    @DisplayName("Should configure contact correctly")
    void shouldConfigureContactCorrectly() {
        OpenAPI openApi = config.currencyOpenApi();
        Contact contact = openApi.getInfo().getContact();

        assertNotNull(contact);
        assertEquals("Currency API Support", contact.getName());
        assertEquals("support@currency.local", contact.getEmail());
    }

    @Test
    @DisplayName("Should configure license correctly")
    void shouldConfigureLicenseCorrectly() {
        OpenAPI openApi = config.currencyOpenApi();
        License license = openApi.getInfo().getLicense();

        assertNotNull(license);
        assertEquals("Apache 2.0", license.getName());
        assertEquals("https://www.apache.org/licenses/LICENSE-2.0", license.getUrl());
    }

    @Test
    @DisplayName("Should configure servers correctly")
    void shouldConfigureServersCorrectly() {
        OpenAPI openApi = config.currencyOpenApi();
        List<Server> servers = openApi.getServers();

        assertNotNull(servers);
        assertEquals(1, servers.size());

        Server server = servers.get(0);
        assertEquals("http://localhost:8080", server.getUrl());
        assertEquals("Local server", server.getDescription());
    }

    @Test
    @DisplayName("Should allow multiple calls to return independent instances")
    void shouldReturnIndependentInstances() {
        OpenAPI openApi1 = config.currencyOpenApi();
        OpenAPI openApi2 = config.currencyOpenApi();

        assertNotSame(openApi1, openApi2, "Each call should return a new instance");
    }
}