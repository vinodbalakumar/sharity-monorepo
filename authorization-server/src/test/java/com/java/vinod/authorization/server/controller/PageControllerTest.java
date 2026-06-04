package com.java.vinod.authorization.server.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import static org.assertj.core.api.Assertions.assertThat;

class PageControllerTest {
    private PageController pageController;

    @BeforeEach
    void setUp() {
        pageController = new PageController();
    }

    @Test
    void loginPageRendersWithPrefixedFormActionAndErrorMessage() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/authorization-server/api/login");
        request.setContextPath("/authorization-server/api");

        var response = pageController.login(request, "error", null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType().toString()).isEqualTo("text/html");
        assertThat(response.getBody()).contains("Invalid credentials.");
        assertThat(response.getBody()).contains("action=\"/authorization-server/api/login\"");
    }

    @Test
    void loginPageRendersWithoutErrorBanner() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/authorization-server/api/login");
        request.setContextPath("/authorization-server/api");

        var response = pageController.login(request, null, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).doesNotContain("Invalid credentials.");
    }

    @Test
    void loginPageEscapesContinueUrlInHiddenInput() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/authorization-server/api/login");
        request.setContextPath("/authorization-server/api");

        var response = pageController.login(
                request,
                null,
                "/authorization-server/api/oauth2/authorize?response_type=code&client_id=sharity-web-bff");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains(
                "value=\"/authorization-server/api/oauth2/authorize?response_type=code&amp;client_id=sharity-web-bff\"");
    }
}
