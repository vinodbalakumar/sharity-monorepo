package com.java.vinod.platform.web.bff.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.stream.Stream;

import com.java.vinod.platform.web.bff.security.SharityAccessTokenAuthenticationFilter;

@Configuration
public class SecurityConfig {
    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);
    private static final String REGISTRATION_ID = "sharity-web-bff";
    private static final String FORCE_REAUTH_COOKIE = "sharity-force-login";

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   BffProperties properties,
                                                   OAuth2AuthorizationRequestResolver authorizationRequestResolver,
                                                   SharityAccessTokenAuthenticationFilter sharityAccessTokenAuthenticationFilter,
                                                   CorsConfigurationSource corsConfigurationSource) throws Exception {
        return http
                .addFilterBefore(sharityAccessTokenAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .csrf(csrf -> csrf.csrfTokenRepository(new HttpSessionCsrfTokenRepository()))
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .exceptionHandling(exceptions -> exceptions.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/bff/login").permitAll()
                    .requestMatchers(HttpMethod.GET, "/oauth2/authorization/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/login/oauth2/code/" + REGISTRATION_ID).permitAll()
                        .requestMatchers(HttpMethod.GET, "/error").permitAll()
                        .requestMatchers(HttpMethod.GET, "/bff/session").permitAll()
                        .requestMatchers(HttpMethod.GET, "/bff/public/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/bff/logout").authenticated()
                        .requestMatchers("/bff/api/**").authenticated()
                        .anyRequest().denyAll())
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(endpoint -> endpoint.authorizationRequestResolver(authorizationRequestResolver))
                        .failureHandler(oauth2LoginFailureHandler())
                        .defaultSuccessUrl(successRedirectUrl(properties.web().redirectUri()), true))
                .oauth2Client(Customizer.withDefaults())
                .build();
    }

    @Bean
    public JwtDecoder sharityAccessTokenJwtDecoder(BffProperties properties) {
        return NimbusJwtDecoder.withJwkSetUri(properties.oauth2().authorizationServerBaseUrl() + "/oauth2/jwks").build();
    }

    @Bean
    public AuthenticationFailureHandler oauth2LoginFailureHandler() {
        return (request, response, exception) -> {
            Throwable rootCause = exception;
            while (rootCause.getCause() != null && rootCause.getCause() != rootCause) {
                rootCause = rootCause.getCause();
            }
            log.info("OAuth2 login failed. exceptionType={}, exceptionMessage={}, rootCauseType={}, rootCauseMessage={}, requestUri={}, correlationId={}",
                    exception.getClass().getSimpleName(),
                    exception.getMessage(),
                    rootCause.getClass().getSimpleName(),
                    rootCause.getMessage(),
                    request.getRequestURI(),
                    correlationId(request));
            response.sendRedirect("/login?error");
        };
    }

    /**
     * Reads the safe correlation identifier attached by the request logging filter.
     */
    private String correlationId(jakarta.servlet.http.HttpServletRequest request) {
        Object attribute = request.getAttribute(RequestCorrelationLoggingFilter.CORRELATION_ID_ATTRIBUTE);
        if (attribute != null && !attribute.toString().isBlank()) {
            return attribute.toString();
        }
        String header = request.getHeader(RequestCorrelationLoggingFilter.CORRELATION_ID_ATTRIBUTE);
        return header == null || header.isBlank() ? "n/a" : header.trim();
    }

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository(BffProperties properties) {
        ClientRegistration registration = ClientRegistration.withRegistrationId(REGISTRATION_ID)
                .clientId(properties.oauth2().clientId())
                .clientSecret(properties.oauth2().clientSecret())
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(browserRedirectUri(null, properties))
                .scope("openid", "profile")
                .authorizationUri(browserAuthorizationServerBaseUrl(null, properties) + "/oauth2/authorize")
                .tokenUri(properties.oauth2().authorizationServerBaseUrl() + "/oauth2/token")
                .userInfoUri(properties.oauth2().authorizationServerBaseUrl() + "/userinfo")
                .jwkSetUri(properties.oauth2().authorizationServerBaseUrl() + "/oauth2/jwks")
                .userNameAttributeName("sub")
                .clientName("Sharity Web BFF")
                .build();
        return new org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository(registration);
    }

    @Bean
    public OAuth2AuthorizedClientRepository authorizedClientRepository() {
        return new HttpSessionOAuth2AuthorizedClientRepository();
    }

    @Bean
    public OAuth2AuthorizationRequestResolver authorizationRequestResolver(ClientRegistrationRepository registrations,
                                                                           BffProperties properties) {
        DefaultOAuth2AuthorizationRequestResolver resolver =
                new DefaultOAuth2AuthorizationRequestResolver(registrations, "/oauth2/authorization");
        resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());
        return new OAuth2AuthorizationRequestResolver() {
            @Override
            public OAuth2AuthorizationRequest resolve(jakarta.servlet.http.HttpServletRequest request) {
                return customOrDefault(resolver.resolve(request), request, properties);
            }

            @Override
            public OAuth2AuthorizationRequest resolve(jakarta.servlet.http.HttpServletRequest request,
                                                     String clientRegistrationId) {
                return customOrDefault(resolver.resolve(request, clientRegistrationId), request, properties);
            }
        };
    }

    private OAuth2AuthorizationRequest customOrDefault(OAuth2AuthorizationRequest authorizationRequest,
                                                       jakarta.servlet.http.HttpServletRequest request,
                                                       BffProperties properties) {
        if (authorizationRequest == null) {
            return null;
        }
        OAuth2AuthorizationRequest.Builder builder = OAuth2AuthorizationRequest.from(authorizationRequest)
                .authorizationUri(browserAuthorizationServerBaseUrl(request, properties) + "/oauth2/authorize")
                .redirectUri(browserRedirectUri(request, properties));
        if (hasForceReauthenticationCookie(request)) {
            builder.additionalParameters(parameters -> parameters.put("prompt", "login"));
        }
        return builder.build();
    }

    private String browserAuthorizationServerBaseUrl(jakarta.servlet.http.HttpServletRequest request, BffProperties properties) {
        String configured = trimTrailingSlash(properties.oauth2().authorizationServerPublicBaseUrl());
        if (isLoopbackUrl(configured)) {
            return canonicalBrowserOrigin(properties) + "/authorization-server/api";
        }
        if (isLocalBrowserRequest(request)) {
            return "http://localhost:8080/authorization-server/api";
        }
        return configured;
    }

    private String browserRedirectUri(jakarta.servlet.http.HttpServletRequest request, BffProperties properties) {
        String configured = properties.oauth2().redirectUri();
        if (isLoopbackUrl(configured)) {
            return canonicalBrowserOrigin(properties) + "/login/oauth2/code/" + REGISTRATION_ID;
        }
        if (isLocalBrowserRequest(request)) {
            return canonicalBrowserOriginFromRequest(request) + "/login/oauth2/code/" + REGISTRATION_ID;
        }
        return configured;
    }

    private String canonicalBrowserOrigin(BffProperties properties) {
        String allowedOrigin = properties.security().allowedOrigin();
        if (allowedOrigin == null || allowedOrigin.isBlank()) {
            return "";
        }
        return trimTrailingSlash(allowedOrigin.split(",")[0].trim());
    }

    private String canonicalBrowserOriginFromRequest(jakarta.servlet.http.HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (origin == null || origin.isBlank()) {
            return "http://localhost:8081";
        }
        return trimTrailingSlash(origin.trim());
    }

    private boolean isLocalBrowserRequest(jakarta.servlet.http.HttpServletRequest request) {
        if (request == null) {
            return false;
        }
        String origin = request.getHeader("Origin");
        if (origin == null || origin.isBlank()) {
            return false;
        }
        String lower = origin.toLowerCase();
        return lower.startsWith("http://localhost")
                || lower.startsWith("https://localhost")
                || lower.startsWith("http://127.0.0.1")
                || lower.startsWith("https://127.0.0.1");
    }

    private String successRedirectUrl(String redirectUri) {
        String trimmed = trimTrailingSlash(redirectUri);
        return trimmed + (trimmed.contains("?") ? "&" : "?") + "login=success";
    }

    private String trimTrailingSlash(String value) {
        String trimmed = value.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private boolean isLoopbackUrl(String value) {
        String lower = value.toLowerCase();
        return lower.startsWith("http://localhost")
                || lower.startsWith("https://localhost")
                || lower.startsWith("http://127.0.0.1")
                || lower.startsWith("https://127.0.0.1");
    }

    /**
     * Detects the short-lived logout marker used to force a real credential prompt.
     *
     * <p>The browser keeps a brief cookie after logout so the next `/bff/login`
     * request includes `prompt=login` and the upstream identity provider does
     * not silently reuse its own session.</p>
     */
    private boolean hasForceReauthenticationCookie(jakarta.servlet.http.HttpServletRequest request) {
        if (request.getCookies() == null) {
            return false;
        }
        for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
            if (FORCE_REAUTH_COOKIE.equals(cookie.getName()) && "1".equals(cookie.getValue())) {
                return true;
            }
        }
        return false;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(BffProperties properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedBrowserOrigins(properties));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-CSRF-TOKEN", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private List<String> allowedBrowserOrigins(BffProperties properties) {
        List<String> configuredOrigins = properties.security().allowedOrigins();
        List<String> localOrigins = List.of(
                "http://localhost:8080",
                "http://localhost:8081",
                "http://localhost:8082",
                "http://localhost:19006",
                "http://192.168.0.200:8082",
                "http://127.0.0.1:8080",
                "http://127.0.0.1:8081",
                "http://127.0.0.1:8082",
                "http://127.0.0.1:19006");
        if (configuredOrigins != null && !configuredOrigins.isEmpty()) {
            return Stream.concat(configuredOrigins.stream(), localOrigins.stream())
                    .filter(origin -> origin != null && !origin.isBlank())
                    .map(this::trimTrailingSlash)
                    .distinct()
                    .toList();
        }

        String allowedOrigin = properties.security().allowedOrigin();
        if (allowedOrigin == null || allowedOrigin.isBlank()) {
            return localOrigins;
        }

        return Stream.concat(Stream.of(allowedOrigin.split(",")), localOrigins.stream())
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .map(this::trimTrailingSlash)
                .distinct()
                .toList();
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
