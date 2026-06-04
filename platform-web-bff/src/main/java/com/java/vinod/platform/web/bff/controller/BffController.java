package com.java.vinod.platform.web.bff.controller;

import com.java.vinod.platform.web.bff.config.BffProperties;
import com.java.vinod.platform.web.bff.dto.BffSessionResponse;
import com.java.vinod.platform.web.bff.service.BffProxyService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
/**
 * Exposes the browser-facing BFF endpoints that bridge the public app and OAuth session flow.
 *
 * <p>The controller keeps the anonymous home page browseable while routing
 * protected actions through secure session-aware entry points and the
 * marketplace API proxy.</p>
 */
public class BffController {
    private static final String REGISTRATION_ID = "sharity-web-bff";
    private static final String FORCE_REAUTH_COOKIE = "sharity-force-login";

    private final BffProperties properties;
    private final BffProxyService proxyService;

    /**
     * Creates the browser BFF controller with its public configuration and proxy service.
     */
    public BffController(BffProperties properties, BffProxyService proxyService) {
        this.properties = properties;
        this.proxyService = proxyService;
    }

    /**
     * Starts the public browser sign-in flow by redirecting to the OAuth client registration.
     */
    @GetMapping("/bff/login")
    public ResponseEntity<Void> login() {
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, "/oauth2/authorization/" + REGISTRATION_ID)
                .build();
    }

    /**
     * Returns the authenticated browser session summary or rejects anonymous callers.
     *
     * <p>This endpoint stays protected so the public app can check session state
     * without exposing tokens or private account details.</p>
     */
    @GetMapping("/bff/session")
    public BffSessionResponse session(Authentication authentication, CsrfToken csrfToken) {
        if (!(authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof OidcUser oidcUser)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required");
        }
        return new BffSessionResponse(
                true,
                asString(oidcUser.getClaims().get("uid"), oidcUser.getSubject()),
                asString(oidcUser.getClaims().get("email"), oidcUser.getEmail()),
                firstNonBlank(
                        asString(oidcUser.getClaims().get("name"), null),
                        asString(oidcUser.getClaims().get("preferred_username"), null),
                        oidcUser.getEmail()),
                asString(oidcUser.getClaims().get("phone_number"), null),
                list(oidcUser.getClaims().get("roles")),
                list(oidcUser.getClaims().get("apps")),
                csrfToken == null ? null : csrfToken.getToken());
    }

    /**
     * Clears the browser session after the user signs out.
     */
    @PostMapping("/bff/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
        SecurityContextHolder.clearContext();
        response.addHeader(HttpHeaders.SET_COOKIE,
                FORCE_REAUTH_COOKIE + "=1; Max-Age=120; Path=/; SameSite=Lax; Secure; HttpOnly");
        return ResponseEntity.noContent().build();
    }

    /**
     * Proxies authenticated marketplace API calls through the BFF session.
     *
     * <p>The browser never talks to protected backend services directly; the
     * BFF applies the current authenticated session and forwards the request.</p>
     */
    @RequestMapping(value = "/bff/api/**", method = {
            RequestMethod.GET,
            RequestMethod.POST,
            RequestMethod.PUT,
            RequestMethod.PATCH,
            RequestMethod.DELETE
    })
    public ResponseEntity<byte[]> proxy(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) {
        return proxyService.proxy(request, response, authentication);
    }

    private String asString(Object value, String fallback) {
        return value == null ? fallback : value.toString();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private List<String> list(Object value) {
        if (value instanceof List<?> list) {
            return list.stream().map(Object::toString).toList();
        }
        return List.of();
    }
}
