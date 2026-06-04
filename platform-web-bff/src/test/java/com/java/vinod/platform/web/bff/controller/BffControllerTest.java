package com.java.vinod.platform.web.bff.controller;

import com.java.vinod.platform.web.bff.config.BffProperties;
import com.java.vinod.platform.web.bff.PlatformWebBffApplication;
import com.java.vinod.platform.web.bff.service.BffProxyService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockCookie;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

@SpringBootTest(classes = PlatformWebBffApplication.class, properties = {
        "server.port=0",
        "spring.main.allow-bean-definition-overriding=true",
        "app.security.allowed-origin=https://vinodbalakumar.com",
        "app.oauth2.client-id=sharity-web-bff",
        "app.oauth2.client-secret=test-secret",
        "app.oauth2.redirect-uri=http://localhost:8080/login/oauth2/code/sharity-web-bff",
        "app.oauth2.authorization-server-public-base-url=https://vinodbalakumar.com/authorization-server/api",
        "app.oauth2.authorization-server-base-url=http://localhost:8083/authorization-server/api",
        "app.backends.authorization-server=http://authorization-server:8080/authorization-server",
        "app.backends.marketplace-service=http://marketplace-service:8080/marketplace-service",
        "app.backends.payment-service=http://payment-service:8080/payment-service",
        "app.backends.wallet-service=http://wallet-service:8080/wallet-service",
        "app.web.redirect-uri=https://vinodbalakumar.com/app/"
})
@Import(BffControllerTest.TestOverrides.class)
class BffControllerTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private BffProxyService proxyService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = webAppContextSetup(context).apply(SecurityMockMvcConfigurers.springSecurity()).build();
        ((TestOverrides.ProxyServiceStub) proxyService).calls.set(0);
    }

    @Test
    void loginRedirectsToAuthorizationStart() throws Exception {
        mockMvc.perform(get("/bff/login"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "/oauth2/authorization/sharity-web-bff"));
    }

    @Test
    void sessionWithoutAuthenticationIsRejected() throws Exception {
        mockMvc.perform(get("/bff/session"))
                .andExpect(status().isUnauthorized());
        assertThat(((TestOverrides.ProxyServiceStub) proxyService).calls.get()).isZero();
    }

    @Test
    void sessionResponseDoesNotExposeOauthTokens() throws Exception {
        mockMvc.perform(get("/bff/session").with(oidcLogin()
                        .idToken(token -> token
                                .claim("uid", "user-123")
                                .claim("email", "user@example.com")
                                .claim("name", "User Example")
                                .claim("preferred_username", "user@example.com")
                                .claim("roles", java.util.List.of("ROLE_BUYER"))
                                .claim("apps", java.util.List.of("marketplace")))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.publicId").value("user-123"))
                .andExpect(jsonPath("$.email").value("user@example.com"))
                .andExpect(jsonPath("$.name").value("User Example"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_BUYER"))
                .andExpect(jsonPath("$.applications[0]").value("marketplace"))
                .andExpect(jsonPath("$.accessToken").doesNotExist())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(jsonPath("$.clientSecret").doesNotExist());
    }

    @Test
    void unauthenticatedApiProxyIsRejected() throws Exception {
        mockMvc.perform(get("/bff/api/marketplace-service/api/v1/marketplace/categories"))
                .andExpect(status().isUnauthorized());
        assertThat(((TestOverrides.ProxyServiceStub) proxyService).calls.get()).isZero();
    }

    @Test
    void authenticatedApiProxyRequiresSessionAndDelegates() throws Exception {
        mockMvc.perform(get("/bff/api/marketplace-service/api/v1/marketplace/categories")
                        .with(oidcLogin()))
                .andExpect(status().isOk())
                .andExpect(content().string("proxy-ok"));
        assertThat(((TestOverrides.ProxyServiceStub) proxyService).calls.get()).isEqualTo(1);
    }

    @Test
    void logoutRequiresCsrfAndInvalidatesTheSession() throws Exception {
        MockHttpSession session = new MockHttpSession();

        mockMvc.perform(post("/bff/logout")
                        .session(session)
                        .with(oidcLogin())
                        .with(csrf()))
                .andExpect(status().isNoContent());

        assertThat(session.isInvalid()).isTrue();
        assertThat(((TestOverrides.ProxyServiceStub) proxyService).calls.get()).isZero();
    }

    @Test
    void logoutAddsAForceReauthCookieAndLoginUsesPromptLoginWhenPresent() throws Exception {
        MockHttpSession session = new MockHttpSession();

        mockMvc.perform(post("/bff/logout")
                        .session(session)
                        .with(oidcLogin())
                        .with(csrf()))
                .andExpect(status().isNoContent())
                .andExpect(header().string("Set-Cookie", containsString("sharity-force-login=1")));

        mockMvc.perform(get("/oauth2/authorization/sharity-web-bff")
                        .cookie(new MockCookie("sharity-force-login", "1")))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", containsString("prompt=login")));
    }

    @Configuration
    static class TestOverrides {
        private final AtomicInteger proxyCalls = new AtomicInteger();

        @Bean(name = "bffProxyService")
        ProxyServiceStub proxyServiceStub() {
            return new ProxyServiceStub(
                    proxyCalls,
                    new BffProperties(
                            new BffProperties.Security("https://vinodbalakumar.com"),
                            new BffProperties.OAuth2("sharity-web-bff", "test-secret", "http://localhost:8080/login/oauth2/code/sharity-web-bff", "https://vinodbalakumar.com/authorization-server/api", "http://localhost:8083/authorization-server/api"),
                            new BffProperties.Backends("http://authorization-server:8080/authorization-server", "http://marketplace-service:8080/marketplace-service", "http://payment-service:8080/payment-service", "http://wallet-service:8080/wallet-service"),
                            new BffProperties.Web("https://vinodbalakumar.com/app/")
                    ),
                    new org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizedClientRepository(),
                    new RestTemplate()
            );
        }

        static class ProxyServiceStub extends BffProxyService {
            private final AtomicInteger calls;

            ProxyServiceStub(AtomicInteger calls,
                             BffProperties properties,
                             org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository authorizedClientRepository,
                             RestTemplate restTemplate) {
                super(properties, authorizedClientRepository, restTemplate);
                this.calls = calls;
            }

            @Override
            public ResponseEntity<byte[]> proxy(HttpServletRequest request, HttpServletResponse response, org.springframework.security.core.Authentication authentication) {
                calls.incrementAndGet();
                return ResponseEntity.ok("proxy-ok".getBytes());
            }
        }
    }
}
