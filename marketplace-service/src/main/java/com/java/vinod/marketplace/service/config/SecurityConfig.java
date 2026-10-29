package com.java.vinod.marketplace.service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Configuration
public class SecurityConfig {

    private static final PathPatternRequestMatcher.Builder MARKETPLACE_BASE_PATH_MATCHER =
            PathPatternRequestMatcher.withDefaults().basePath("/marketplace-service");

    @Bean
    @Order(1)
    SecurityFilterChain securityFilterChain(HttpSecurity http, InternalServiceTokenFilter internalServiceTokenFilter) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/marketplace/admin/home-sections", "/api/v1/marketplace/admin/home-sections/**",
                                "/marketplace-service/api/v1/marketplace/admin/home-sections", "/marketplace-service/api/v1/marketplace/admin/home-sections/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/marketplace/home-sections", "/marketplace-service/api/v1/marketplace/home-sections").permitAll()
                        .requestMatchers(HttpMethod.GET, "/actuator/health", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/marketplace/verticals",
                                "/api/v1/marketplace/home",
                                "/api/v1/marketplace/categories",
                                "/api/v1/marketplace/categories/by-vertical",
                                "/api/v1/marketplace/listings",
                                "/api/v1/marketplace/listings/featured",
                                "/api/v1/marketplace/listings/by-category",
                                "/api/v1/marketplace/listings/search",
                                "/api/v1/marketplace/listings/*",
                                "/api/v1/marketplace/listings/*/reviews",
                                "/api/v1/marketplace/listings/*/image",
                                "/api/v1/marketplace/reviews",
                                "/api/v1/marketplace/reviews/**",
                                "/marketplace-service/api/v1/marketplace/verticals",
                                "/marketplace-service/api/v1/marketplace/home",
                                "/marketplace-service/api/v1/marketplace/categories",
                                "/marketplace-service/api/v1/marketplace/categories/by-vertical",
                                "/marketplace-service/api/v1/marketplace/listings",
                                "/marketplace-service/api/v1/marketplace/listings/featured",
                                "/marketplace-service/api/v1/marketplace/listings/by-category",
                                "/marketplace-service/api/v1/marketplace/listings/search",
                                "/marketplace-service/api/v1/marketplace/listings/*",
                                "/marketplace-service/api/v1/marketplace/listings/*/reviews",
                                "/marketplace-service/api/v1/marketplace/listings/*/image",
                                "/marketplace-service/api/v1/marketplace/reviews",
                                "/marketplace-service/api/v1/marketplace/reviews/**").permitAll()
                        .requestMatchers(HttpMethod.HEAD,
                                "/api/v1/marketplace/verticals",
                                "/api/v1/marketplace/home",
                                "/api/v1/marketplace/categories",
                                "/api/v1/marketplace/categories/by-vertical",
                                "/api/v1/marketplace/listings",
                                "/api/v1/marketplace/listings/featured",
                                "/api/v1/marketplace/listings/by-category",
                                "/api/v1/marketplace/listings/search",
                                "/api/v1/marketplace/listings/*",
                                "/api/v1/marketplace/listings/*/reviews",
                                "/api/v1/marketplace/listings/*/image",
                                "/api/v1/marketplace/reviews",
                                "/api/v1/marketplace/reviews/**",
                                "/marketplace-service/api/v1/marketplace/verticals",
                                "/marketplace-service/api/v1/marketplace/home",
                                "/marketplace-service/api/v1/marketplace/categories",
                                "/marketplace-service/api/v1/marketplace/categories/by-vertical",
                                "/marketplace-service/api/v1/marketplace/listings",
                                "/marketplace-service/api/v1/marketplace/listings/featured",
                                "/marketplace-service/api/v1/marketplace/listings/by-category",
                                "/marketplace-service/api/v1/marketplace/listings/search",
                                "/marketplace-service/api/v1/marketplace/listings/*",
                                "/marketplace-service/api/v1/marketplace/listings/*/reviews",
                                "/marketplace-service/api/v1/marketplace/listings/*/image",
                                "/marketplace-service/api/v1/marketplace/reviews",
                                "/marketplace-service/api/v1/marketplace/reviews/**").permitAll()
                        .requestMatchers(MARKETPLACE_BASE_PATH_MATCHER.matcher(HttpMethod.GET, "/api/v1/marketplace/listings/{listingPublicId}")).permitAll()
                        .requestMatchers(MARKETPLACE_BASE_PATH_MATCHER.matcher(HttpMethod.GET, "/api/v1/marketplace/listings/{listingPublicId}/reviews")).permitAll()
                        .requestMatchers(MARKETPLACE_BASE_PATH_MATCHER.matcher(HttpMethod.GET, "/api/v1/marketplace/reviews")).permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/marketplace/orders/purchases",
                                "/api/v1/marketplace/orders/purchases/**",
                                "/api/v1/marketplace/provider/listings",
                                "/api/v1/marketplace/provider/orders",
                                "/api/v1/marketplace/provider/orders/**",
                                "/marketplace-service/api/v1/marketplace/orders/purchases",
                                "/marketplace-service/api/v1/marketplace/orders/purchases/**",
                                "/marketplace-service/api/v1/marketplace/provider/listings",
                                "/marketplace-service/api/v1/marketplace/provider/orders",
                                "/marketplace-service/api/v1/marketplace/provider/orders/**").authenticated()
                        .requestMatchers("/api/admin/**", "/api/v1/marketplace/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN", "MODULE_ADMIN", "SUPPORT_AGENT")
                        .requestMatchers("/internal/**", "/api/internal/**").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
                .addFilterBefore(internalServiceTokenFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

        @Bean
        CorsConfigurationSource corsConfigurationSource(@Value("${app.web.allowed-origin:http://localhost:3000}") String allowedOrigin) {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(List.of(allowedOrigin.split(",")).stream()
                                .map(String::trim)
                                .filter(origin -> !origin.isBlank())
                                .toList());
                configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
                configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-CSRF-TOKEN", "X-Requested-With"));
                configuration.setAllowCredentials(true);
                configuration.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

    /**
     * Converts JWT role claims into Spring authorities for resource-server authorization.
     *
     * <p>The marketplace service uses this converter so admin endpoints can
     * distinguish trusted operational roles from ordinary authenticated users.</p>
     */
    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter scopeConverter = new JwtGrantedAuthoritiesConverter();
        scopeConverter.setAuthoritiesClaimName("scope");
        scopeConverter.setAuthorityPrefix("SCOPE_");

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> authorities = new ArrayList<>(scopeConverter.convert(jwt));
            Object roles = jwt.getClaims().get("roles");
            if (roles instanceof Collection<?> roleValues) {
                roleValues.stream()
                        .map(Object::toString)
                        .filter(role -> !role.isBlank())
                        .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                        .map(SimpleGrantedAuthority::new)
                        .forEach(authorities::add);
            }
            return authorities;
        });
        return converter;
    }

    @Bean
    JwtDecoder jwtDecoder(@Value("${app.jwt.public-key-base64:}") String publicKeyBase64,
                          @Value("${app.jwt.public-key-path:}") String publicKeyPath,
                          @Value("${app.jwt.issuer}") String issuer,
                          @Value("${app.jwt.audience}") String audience) throws Exception {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withPublicKey(readPublicKey(publicKeyBase64, publicKeyPath)).build();
        OAuth2TokenValidator<Jwt> audienceValidator = jwt -> jwt.getAudience().contains(audience)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Token audience is not allowed", null));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefaultWithIssuer(issuer), audienceValidator));
        return decoder;
    }

    private RSAPublicKey readPublicKey(String publicKeyBase64, String publicKeyPath) {
        String pem;
        String source;
        if (publicKeyBase64 != null && !publicKeyBase64.isBlank()) {
            source = "app.jwt.public-key-base64";
            try {
                pem = new String(Base64.getDecoder().decode(publicKeyBase64), StandardCharsets.UTF_8);
            } catch (IllegalArgumentException exception) {
                throw new IllegalStateException(source + " must be Base64-encoded public key PEM", exception);
            }
        } else if (publicKeyPath != null && !publicKeyPath.isBlank()) {
            source = "app.jwt.public-key-path";
            try {
                pem = Files.readString(Path.of(publicKeyPath), StandardCharsets.UTF_8);
            } catch (Exception exception) {
                throw new IllegalStateException("Unable to read JWT public key from " + source, exception);
            }
        } else {
            throw new IllegalStateException("app.jwt.public-key-base64 or app.jwt.public-key-path must be configured");
        }
        try {
            String body = pem.replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s", "");
            byte[] decoded = Base64.getDecoder().decode(body);
            return (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(decoded));
        } catch (Exception exception) {
            throw new IllegalStateException("JWT public key from " + source + " must be an RSA PUBLIC KEY PEM (X.509)", exception);
        }
    }
}
