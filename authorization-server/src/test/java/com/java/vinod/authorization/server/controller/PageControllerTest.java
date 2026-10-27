package com.java.vinod.authorization.server.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import static org.assertj.core.api.Assertions.assertThat;

class PageControllerTest {
    private PageController pageController;

    @Test
    void oauthFailureOffersAFreshSignInInsteadOfResubmittingAStaleForm() {
        var request = new MockHttpServletRequest("GET", "/authorization-server/api/login");
        var body = pageController.login(request, "oauth", null, null).getBody();
        assertThat(body).contains("Please start a new sign-in session.")
                .contains("href=\"/bff/login\"").contains("Try sign-in again").contains("<div hidden>")
                .doesNotContain("Invalid credentials.");
    }

    @BeforeEach
    void setUp() {
        pageController = new PageController(
                "http://localhost:9174/app/",
                "http://localhost:9174/app/register",
                "http://localhost:9174/app/forgot-password");
    }

    @Test
    void loginPageRendersWithPrefixedFormActionAndErrorMessage() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/authorization-server/api/login");
        request.setContextPath("/authorization-server/api");

        var response = pageController.login(request, "error", null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType().toString()).isEqualTo("text/html");
        assertThat(response.getBody()).contains("Invalid credentials.");
        assertThat(response.getBody()).contains("action=\"/authorization-server/api/login\"");
    }

    @Test
    void loginPageRendersWithoutErrorBanner() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/authorization-server/api/login");
        request.setContextPath("/authorization-server/api");

        var response = pageController.login(request, null, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).doesNotContain("Invalid credentials.");
    }

    @Test
    void loginPageUsesConfiguredFrontendLinks() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/authorization-server/api/login");
        request.setContextPath("/authorization-server/api");

        var response = pageController.login(request, null, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("href=\"http://localhost:9174/app/\"");
        assertThat(response.getBody()).contains("href=\"http://localhost:9174/app/register\"");
        assertThat(response.getBody()).contains("href=\"http://localhost:9174/app/forgot-password\"");
    }

    @Test
    void loginPageEscapesContinueUrlInHiddenInput() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/authorization-server/api/login");
        request.setContextPath("/authorization-server/api");

        var response = pageController.login(
                request,
                null,
                null,
                "/authorization-server/api/oauth2/authorize?response_type=code&client_id=sharity-web-bff");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains(
                "value=\"/authorization-server/api/oauth2/authorize?response_type=code&amp;client_id=sharity-web-bff\"");
    }

    @Test
    void loginPageRendersSocialErrorBanner() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/authorization-server/api/login");
        request.setContextPath("/authorization-server/api");

        var response = pageController.login(
                request,
                null,
                "Email is already registered. Login and link Google from account settings.",
                null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("Email is already registered. Login and link Google from account settings.");
    }
}
