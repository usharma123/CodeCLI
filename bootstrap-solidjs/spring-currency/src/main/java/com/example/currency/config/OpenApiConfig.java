package com.example.currency.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI currencyOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Currency Converter API")
                        .version("1.0")
                        .description("Simple currency converter with hardcoded exchange rates. " +
                                "Supported currencies: USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, MXN")
                        .contact(new Contact()
                                .name("Currency API Support")
                                .email("support@currency.local"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local server")
                ));
    }
}
