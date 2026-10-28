package com.java.vinod.platform.web.bff.controller;

import com.java.vinod.platform.web.bff.config.BffProperties;
import com.java.vinod.platform.web.bff.dto.BffSessionResponse;
import com.java.vinod.platform.web.bff.service.BffProxyService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

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
    private final org.springframework.web.client.RestTemplate restTemplate;
    private final String authorizationSessionCookieName;

    /**
     * Creates the browser BFF controller with its public configuration and proxy service.
     */
    public BffController(BffProperties properties, BffProxyService proxyService, org.springframework.web.client.RestTemplate restTemplate,
                         @org.springframework.beans.factory.annotation.Value("${app.oauth2.authorization-session-cookie-name:JSESSIONID}") String authorizationSessionCookieName) {
        this.properties = properties;
        this.proxyService = proxyService;
        this.restTemplate = restTemplate;
        this.authorizationSessionCookieName = authorizationSessionCookieName;
    }

    /**
     * Starts the public browser sign-in flow by redirecting to the OAuth client registration.
     */
    @GetMapping("/bff/login")
    public ResponseEntity<Void> login(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "false") boolean force) {
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, "/oauth2/authorization/" + REGISTRATION_ID + (force ? "?force=true" : ""))
                .build();
    }

    /**
     * Returns the browser session summary for both guests and signed-in users.
     *
     * <p>Anonymous users receive a clean guest response so the public app can
     * render without browser console auth errors.</p>
     */
    @GetMapping("/bff/session")
    public BffSessionResponse session(HttpServletRequest request, Authentication authentication, CsrfToken csrfToken) {
        // Check if logout was just initiated (force re-auth cookie is set)
        boolean forceLogout = request.getCookies() != null &&
                java.util.Arrays.stream(request.getCookies())
                        .anyMatch(c -> FORCE_REAUTH_COOKIE.equals(c.getName()));

        if (forceLogout || authentication == null || !authentication.isAuthenticated()) {
            return new BffSessionResponse(false, null, null, null, null,
                    List.of(), List.of(), csrfToken == null ? null : csrfToken.getToken());
        }
        if (authentication.getPrincipal() instanceof OidcUser oidcUser) {
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
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            return new BffSessionResponse(
                    true,
                    asString(jwt.getClaims().get("uid"), jwt.getSubject()),
                    asString(jwt.getClaims().get("email"), jwt.getSubject()),
                    firstNonBlank(
                            asString(jwt.getClaims().get("name"), null),
                            asString(jwt.getClaims().get("preferred_username"), null),
                            asString(jwt.getClaims().get("username"), null),
                            asString(jwt.getClaims().get("email"), jwt.getSubject())),
                    asString(jwt.getClaims().get("phone_number"), null),
                    list(jwt.getClaims().get("roles")),
                    list(jwt.getClaims().get("apps")),
                    csrfToken == null ? null : csrfToken.getToken());
        }
        return new BffSessionResponse(false, null, null, null, null,
                List.of(), List.of(), csrfToken == null ? null : csrfToken.getToken());
    }

    /**
     * Clears the browser session after the user signs out.
     */
    @PostMapping("/bff/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response,
                                      @org.springframework.web.bind.annotation.RequestBody(required = false)
                                      java.util.Map<String, String> body) {
        try {
            String refreshToken = body != null ? body.get("refreshToken") : null;

            if (refreshToken != null && !refreshToken.isEmpty()) {
                String authServerUrl = properties.backends().authorizationServer();
                String logoutUrl = authServerUrl + "/api/v1/auth/logout";

                // Create logout request
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
                java.util.Map<String, String> logoutRequest = new java.util.HashMap<>();
                logoutRequest.put("refreshToken", refreshToken);

                HttpEntity<java.util.Map<String, String>> entity = new HttpEntity<>(logoutRequest, headers);

                try {
                    ResponseEntity<String> authResponse = restTemplate.postForEntity(logoutUrl, entity, String.class);
                    // Forward auth-server Set-Cookie headers
                    authResponse.getHeaders().forEach((key, values) -> {
                        if (HttpHeaders.SET_COOKIE.equalsIgnoreCase(key)) {
                            values.forEach(value -> response.addHeader(HttpHeaders.SET_COOKIE, value));
                        }
                    });
                } catch (Exception e) {
                    // Continue logout on auth-server error
                }
            }
        } catch (Exception e) {
            // Continue with BFF logout even if auth-server call fails
        }

        // Clear BFF session
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
        SecurityContextHolder.clearContext();
        response.addHeader(HttpHeaders.SET_COOKIE,
                FORCE_REAUTH_COOKIE + "=1; Max-Age=120; Path=/; SameSite=Lax; Secure; HttpOnly");
        response.addHeader(HttpHeaders.SET_COOKIE,
                org.springframework.http.ResponseCookie.from(
                        com.java.vinod.platform.web.bff.security.SharityAccessTokenAuthenticationFilter.COOKIE_NAME, "")
                        .path("/").httpOnly(true).secure(true).sameSite("Lax")
                        .maxAge(java.time.Duration.ZERO).build().toString());
        String authorizationCookiePath = java.net.URI.create(properties.oauth2().authorizationServerPublicBaseUrl()).getPath();
        if (authorizationCookiePath == null || authorizationCookiePath.isBlank() || authorizationCookiePath.equals("/"))
            authorizationCookiePath = "/";
        else authorizationCookiePath = authorizationCookiePath.replaceAll("/+$", "");
        response.addHeader(HttpHeaders.SET_COOKIE,
                org.springframework.http.ResponseCookie.from(authorizationSessionCookieName, "")
                        .path(authorizationCookiePath).httpOnly(true).secure(true).sameSite("Lax")
                        .maxAge(java.time.Duration.ZERO).build().toString());
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

    /**
     * Proxies anonymous marketplace browse calls through the BFF so the browser
     * does not depend on a raw backend service URL.
     */
    @RequestMapping(value = "/bff/public/marketplace-service/**", method = RequestMethod.GET)
    public ResponseEntity<byte[]> publicMarketplaceProxy(HttpServletRequest request,
                                                         HttpServletResponse response) {
        return proxyService.proxyPublic(request, response);
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
