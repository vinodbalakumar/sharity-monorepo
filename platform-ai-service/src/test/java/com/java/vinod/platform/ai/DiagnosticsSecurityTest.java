package com.java.vinod.platform.ai;

import java.util.Optional;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.*;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(SpringExtension.class) @WebAppConfiguration
@ContextConfiguration(classes = DiagnosticsSecurityTest.Config.class)
@TestPropertySource(properties = {"app.jwt.jwk-set-uri=https://identity.example/jwks", "app.jwt.issuer=https://identity.example",
        "app.jwt.audience=auth-clients", "app.diagnostics.token=test-secret-at-least-32-characters-long"})
class DiagnosticsSecurityTest {
    @Configuration @EnableWebMvc @EnableWebSecurity @Import({AiSecurityConfig.class, DiagnosticsSecurityConfig.class})
    static class Config {
        @Bean DiagnosticsService service() { return new DiagnosticsService(Optional.empty(), false, 2000); }
        @Bean DiagnosticsController controller(DiagnosticsService service) { return new DiagnosticsController(service); }
    }
    @Autowired WebApplicationContext context;
    MockMvc mvc;
    String payload = "{\"service\":\"payment-service\",\"correlationId\":\"ref-123\",\"method\":\"POST\",\"route\":\"/api/payments/{id}\",\"status\":503,\"durationMs\":4000}";
    @BeforeEach void setup() { mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build(); }
    @Test void telemetryRequiresItsOwnSecretEvenForAdmin() throws Exception {
        mvc.perform(post("/internal/diagnostics/events").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .contentType(MediaType.APPLICATION_JSON).content(payload)).andExpect(status().isUnauthorized());
    }
    @Test void trustedMetadataIsAccepted() throws Exception {
        mvc.perform(post("/internal/diagnostics/events").header("X-Diagnostics-Token", "test-secret-at-least-32-characters-long")
                .contentType(MediaType.APPLICATION_JSON).content(payload)).andExpect(status().isAccepted());
    }
    @Test void arbitraryLogContentIsRejected() throws Exception {
        mvc.perform(post("/internal/diagnostics/events").header("X-Diagnostics-Token", "test-secret-at-least-32-characters-long")
                .contentType(MediaType.APPLICATION_JSON).content(payload.replace("/api/payments/{id}", "customer@example.com?token=secret")))
                .andExpect(status().isBadRequest());
    }
    @Test void buyerCannotReadIncidents() throws Exception {
        mvc.perform(get("/api/v1/admin/diagnostics").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER"))))
                .andExpect(status().isForbidden());
    }
    @Test void anonymousCannotReadIncidents() throws Exception {
        mvc.perform(get("/api/v1/admin/diagnostics")).andExpect(status().isUnauthorized());
    }
    @Test void administratorCanReadMeasuredIncidentsWithoutAi() throws Exception {
        mvc.perform(get("/api/v1/admin/diagnostics").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.aiEnabled").value(false))
                .andExpect(jsonPath("$.services.length()").value(7));
    }
}
