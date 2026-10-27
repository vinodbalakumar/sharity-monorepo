package com.java.vinod.authorization.server.config;

import com.java.vinod.authorization.server.security.AuthenticatedUser;
import com.java.vinod.authorization.server.repository.AppUserRepository;
import com.java.vinod.authorization.server.repository.UserCredentialRepository;
import com.java.vinod.authorization.server.service.UserMapper;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.core.oidc.endpoint.OidcParameterNames;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.client.InMemoryRegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.config.annotation.web.configurers.oauth2.server.authorization.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationConsentService;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService;
import org.springframework.security.oauth2.server.authorization.InMemoryOAuth2AuthorizationConsentService;
import org.springframework.security.oauth2.server.authorization.InMemoryOAuth2AuthorizationService;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.java.vinod.authorization.server.security.CustomUserDetailsService;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Configures the authorization-server HTTP security, browser login flow, and
 * token issuance behavior.
 *
 * <p>This class keeps the browser login route, OAuth endpoints, and JWT/OIDC
 * custom claims aligned so the public BFF session flow can continue through a
 * successful sign-in without exposing secret material in logs or responses.</p>
 */
@Configuration
public class AuthorizationServerConfig {
    private static final Logger log = LoggerFactory.getLogger(AuthorizationServerConfig.class);
    private static final String AUTHORIZE_PATH = "/authorization-server/api/oauth2/authorize";
    private static final String DUPLICATE_CONTEXT_PREFIX = "/authorization-server/api/authorization-server/api/";

    /**
     * Secures the OAuth authorization-server endpoints and redirects anonymous
     * callers into the browser login flow.
     */
    @Bean
    @Order(1)
    public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http,
                                                                       SecurityContextRepository securityContextRepository,
                                                                       @Value("${app.jwt.issuer}") String issuer) throws Exception {
        OAuth2AuthorizationServerConfigurer authorizationServerConfigurer = new OAuth2AuthorizationServerConfigurer();
        authorizationServerConfigurer.oidc(Customizer.withDefaults());
        http.securityMatcher(authorizationServerConfigurer.getEndpointsMatcher());
        http.securityContext(context -> context.securityContextRepository(securityContextRepository));
        http.with(authorizationServerConfigurer, Customizer.withDefaults());
        http.exceptionHandling(exceptions -> exceptions.authenticationEntryPoint((request, response, authException) -> {
            String original = request.getRequestURI();
            if (request.getQueryString() != null && !request.getQueryString().isBlank()) {
                original = original + "?" + request.getQueryString();
            }
            original = normalizeContinueUrl(original);
            String loginUrl = issuer + "/login?continue=" + URLEncoder.encode(original, StandardCharsets.UTF_8);
            response.sendRedirect(loginUrl);
        }));
        http.authorizeHttpRequests(auth -> auth
                .anyRequest().authenticated());
        return http.build();
    }

    /**
     * Secures the browser login pages and processes form-based authentication.
     */
    @Bean
    @Order(2)
    public SecurityFilterChain browserLoginSecurityFilterChain(HttpSecurity http,
                                                               DaoAuthenticationProvider authServerAuthenticationProvider,
                                                               SecurityContextRepository securityContextRepository,
                                                               AppUserRepository appUserRepository,
                                                               UserCredentialRepository userCredentialRepository,
                                                               @Value("${app.jwt.issuer}") String issuer) throws Exception {
        RequestMatcher browserPageMatcher = request -> {
            String servletPath = request.getServletPath();
            return servletPath.equals("/login")
                    || servletPath.equals("/verify-email")
                    || servletPath.equals("/reset-password")
                    || servletPath.equals("/verify-email.html")
                    || servletPath.equals("/reset-password.html");
        };
        return http.securityMatcher(browserPageMatcher)
                .securityContext(context -> context.securityContextRepository(securityContextRepository))
                .authenticationProvider(authServerAuthenticationProvider)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/login")
                        .securityContextRepository(securityContextRepository)
                        .successHandler(authorizationLoginSuccessHandler(issuer, securityContextRepository))
                        .failureHandler(authorizationLoginFailureHandler(issuer, appUserRepository, userCredentialRepository))
                        .permitAll())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/login", "/verify-email", "/reset-password",
                                "/verify-email.html", "/reset-password.html").permitAll()
                        .requestMatchers(HttpMethod.POST, "/login").permitAll()
                        .anyRequest().authenticated())
                .build();
    }

    /**
     * Wires the authentication provider used by the browser login form.
     */
    @Bean
    public DaoAuthenticationProvider authServerAuthenticationProvider(CustomUserDetailsService userDetailsService,
                                                                      PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    /**
     * Persists browser security state in the HTTP session for the login flow.
     */
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    /**
     * Logs browser login failures and redirects back to the public login page.
     */
    @Bean
    public AuthenticationFailureHandler authorizationLoginFailureHandler(@Value("${app.jwt.issuer}") String issuer,
                                                                         AppUserRepository appUserRepository,
                                                                         UserCredentialRepository userCredentialRepository) {
        return diagnosticAuthorizationLoginFailureHandler(issuer, appUserRepository, userCredentialRepository);
    }

    AuthenticationFailureHandler authorizationLoginFailureHandler(String issuer) {
        return (request, response, exception) -> {
            log.info("OAuth browser login failed. exceptionType={}, correlationId={}",
                    exception.getClass().getSimpleName(),
                    correlationId(request));
            response.setStatus(302);
            response.setHeader("Location", issuer + "/login?error");
        };
    }

    private AuthenticationFailureHandler diagnosticAuthorizationLoginFailureHandler(String issuer,
                                                                                   AppUserRepository appUserRepository,
                                                                                   UserCredentialRepository userCredentialRepository) {
        return (request, response, exception) -> {
            logOAuthLoginFailureDiagnostic(request,
                    request.getParameter("username"),
                    exception.getClass().getSimpleName(),
                    appUserRepository,
                    userCredentialRepository);
            response.setStatus(302);
            response.setHeader("Location", issuer + "/login?error");
        };
    }

    private void logOAuthLoginFailureDiagnostic(jakarta.servlet.http.HttpServletRequest request,
                                                String username,
                                                String exceptionType,
                                                AppUserRepository appUserRepository,
                                                UserCredentialRepository userCredentialRepository) {
        String normalizedEmail = username == null ? "" : username.trim().toLowerCase();
        var user = normalizedEmail.isBlank()
                ? java.util.Optional.<com.java.vinod.authorization.server.entity.AppUser>empty()
                : appUserRepository.findByNormalizedEmail(normalizedEmail);
        var credential = user.flatMap(foundUser -> userCredentialRepository.findByUser_Id(foundUser.getId()));
        boolean lockedNow = user
                .map(foundUser -> foundUser.getLockedUntil() != null && foundUser.getLockedUntil().isAfter(LocalDateTime.now()))
                .orElse(false);
        boolean hashLooksBcrypt = credential
                .map(foundCredential -> foundCredential.getPasswordHash() != null
                        && (foundCredential.getPasswordHash().startsWith("$2a$")
                        || foundCredential.getPasswordHash().startsWith("$2b$")
                        || foundCredential.getPasswordHash().startsWith("$2y$")))
                .orElse(false);
        log.info("OAuth browser login failed. exceptionType={}, userFound={}, credentialFound={}, status={}, emailVerified={}, lockedNow={}, passwordResetRequired={}, hashLooksBcrypt={}, correlationId={}",
                exceptionType,
                user.isPresent(),
                credential.isPresent(),
                user.map(foundUser -> foundUser.getStatus().name()).orElse("UNKNOWN"),
                user.map(com.java.vinod.authorization.server.entity.AppUser::isEmailVerified).orElse(false),
                lockedNow,
                credential.map(com.java.vinod.authorization.server.entity.UserCredential::isPasswordResetRequired).orElse(false),
                hashLooksBcrypt,
                correlationId(request));
    }

    /**
     * Saves the authenticated browser session and resumes the OAuth continue URL.
     */
    @Bean
    public AuthenticationSuccessHandler authorizationLoginSuccessHandler(@Value("${app.jwt.issuer}") String issuer,
                                                                         SecurityContextRepository securityContextRepository) {
        SavedRequestAwareAuthenticationSuccessHandler savedRequestHandler = new SavedRequestAwareAuthenticationSuccessHandler();
        savedRequestHandler.setDefaultTargetUrl(issuer + "/login");
        return (request, response, authentication) -> {
            var securityContext = SecurityContextHolder.createEmptyContext();
            securityContext.setAuthentication(authentication);
            SecurityContextHolder.setContext(securityContext);
            securityContextRepository.saveContext(securityContext, request, response);

            String continueUrl = normalizeContinueUrl(request.getParameter("continue"));
            if (isSafeAuthorizeContinueUrl(continueUrl)) {
                response.sendRedirect(continueUrl);
                return;
            }
            savedRequestHandler.onAuthenticationSuccess(request, response, authentication);
        };
    }

    private static boolean isSafeAuthorizeContinueUrl(String continueUrl) {
        return continueUrl != null && continueUrl.startsWith(AUTHORIZE_PATH);
    }

    private static String normalizeContinueUrl(String continueUrl) {
        if (continueUrl == null) {
            return null;
        }
        if (continueUrl.startsWith(DUPLICATE_CONTEXT_PREFIX)) {
            return "/authorization-server/api/" + continueUrl.substring(DUPLICATE_CONTEXT_PREFIX.length());
        }
        return continueUrl;
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

    /**
     * Registers the confidential BFF client and public PKCE-native clients used by the platform.
     *
     * <p>The web BFF remains the browser-session client, while Android, iOS,
     * Windows, and macOS receive public clients that require proof key and do
     * not carry client secrets.</p>
     */
    @Bean
    @Order(3)
    public RegisteredClientRepository registeredClientRepository(
            @Value("${app.oauth2.web-bff.client-id:sharity-web-bff}") String webBffClientId,
            @Value("${app.oauth2.web-bff.client-secret:change-me-local-only}") String webBffClientSecret,
            @Value("${app.oauth2.web-bff.redirect-uri}") String webBffRedirectUri,
            @Value("${app.oauth2.native-clients.android.client-id:sharity-android}") String androidClientId,
            @Value("${app.oauth2.native-clients.android.redirect-uri:com.vinod.sharity://oauth2redirect/android}") String androidRedirectUri,
            @Value("${app.oauth2.native-clients.ios.client-id:sharity-ios}") String iosClientId,
            @Value("${app.oauth2.native-clients.ios.redirect-uri:com.vinod.sharity://oauth2redirect/ios}") String iosRedirectUri,
            @Value("${app.oauth2.native-clients.windows.client-id:sharity-desktop-windows}") String windowsClientId,
            @Value("${app.oauth2.native-clients.windows.redirect-uri:http://127.0.0.1:53682/sharity/windows-callback}") String windowsRedirectUri,
            @Value("${app.oauth2.native-clients.macos.client-id:sharity-desktop-macos}") String macosClientId,
            @Value("${app.oauth2.native-clients.macos.redirect-uri:http://127.0.0.1:53682/sharity/macos-callback}") String macosRedirectUri) {
        return new InMemoryRegisteredClientRepository(
                webBffClient(webBffClientId, webBffClientSecret, webBffRedirectUri),
                publicPkceClient(androidClientId, androidRedirectUri, List.of(OidcScopes.OPENID, OidcScopes.PROFILE)),
                publicPkceClient(iosClientId, iosRedirectUri, List.of(OidcScopes.OPENID, OidcScopes.PROFILE)),
                publicPkceClient(windowsClientId, windowsRedirectUri, List.of(OidcScopes.OPENID, OidcScopes.PROFILE)),
                publicPkceClient(macosClientId, macosRedirectUri, List.of(OidcScopes.OPENID, OidcScopes.PROFILE))
        );
    }

    @Bean
    public OAuth2AuthorizationService authorizationService() {
        return new InMemoryOAuth2AuthorizationService();
    }

    @Bean
    public OAuth2AuthorizationConsentService authorizationConsentService() {
        return new InMemoryOAuth2AuthorizationConsentService();
    }

    @Bean
    public AuthorizationServerSettings authorizationServerSettings(@Value("${app.jwt.issuer}") String issuer) {
        return AuthorizationServerSettings.builder()
                .issuer(issuer)
                .build();
    }

    @Bean
    public JWKSource<SecurityContext> jwkSource(@Value("${app.jwt.private-key-base64}") String privateKeyBase64,
                                                @Value("${app.jwt.private-key-path}") String privateKeyPath,
                                                @Value("${app.jwt.public-key-base64}") String publicKeyBase64,
                                                @Value("${app.jwt.public-key-path}") String publicKeyPath,
                                                @Value("${app.jwt.issuer}") String issuer,
                                                @Value("${app.jwt.audience}") String audience) {
        RSAKey rsaKey = rsaJwk(privateKeyBase64, privateKeyPath, publicKeyBase64, publicKeyPath, issuer, audience);
        JWKSet jwkSet = new JWKSet(rsaKey);
        return (jwkSelector, securityContext) -> jwkSelector.select(jwkSet);
    }

    @Bean
    public JwtDecoder jwtDecoder(JWKSource<SecurityContext> jwkSource) {
        return OAuth2AuthorizationServerConfiguration.jwtDecoder(jwkSource);
    }

    @Bean
    public OAuth2TokenCustomizer<JwtEncodingContext> oauth2TokenCustomizer(AppUserRepository appUserRepository,
                                                                            UserMapper userMapper,
                                                                            @Value("${app.jwt.issuer}") String issuer,
                                                                            @Value("${app.jwt.audience}") String audience,
                                                                            @Value("${app.jwt.audiences:}") String audiences) {
        List<String> tokenAudiences = resolveAudiences(audience, audiences);
        return context -> {
            Authentication principal = context.getPrincipal();
            if (!(principal != null && principal.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
                return;
            }
            var user = appUserRepository.findByNormalizedEmail(authenticatedUser.getUsername().trim().toLowerCase()).orElse(null);
            if (user == null) {
                return;
            }

            var summary = userMapper.authSummary(user);
            if (OAuth2TokenType.ACCESS_TOKEN.equals(context.getTokenType())) {
                String preferredUsername = firstNonBlank(summary.username(), summary.email());
                context.getClaims().issuer(issuer);
                context.getClaims().audience(tokenAudiences);
                context.getClaims().subject(user.getNormalizedEmail());
                context.getClaims().claim("uid", summary.publicId());
                context.getClaims().claim("email", summary.email());
                context.getClaims().claim("username", preferredUsername);
                context.getClaims().claim("status", summary.status());
                context.getClaims().claim("emailVerified", summary.emailVerified());
                context.getClaims().claim("roles", summary.roles());
                context.getClaims().claim("apps", summary.apps());
                context.getClaims().claim("user", summaryClaim(summary));
                return;
            }

            if (OidcParameterNames.ID_TOKEN.equals(context.getTokenType().getValue())) {
                String preferredUsername = firstNonBlank(summary.username(), summary.email());
                context.getClaims().subject(user.getNormalizedEmail());
                context.getClaims().claim("uid", summary.publicId());
                context.getClaims().claim("email", summary.email());
                context.getClaims().claim("preferred_username", preferredUsername);
                context.getClaims().claim("email_verified", summary.emailVerified());
                context.getClaims().claim("roles", summary.roles());
                context.getClaims().claim("apps", summary.apps());
            }
        };
    }

    private List<String> resolveAudiences(String primaryAudience, String configuredAudiences) {
        LinkedHashSet<String> values = new LinkedHashSet<>();
        if (primaryAudience != null && !primaryAudience.isBlank()) {
            values.add(primaryAudience.trim());
        }
        if (configuredAudiences != null && !configuredAudiences.isBlank()) {
            Arrays.stream(configuredAudiences.split(","))
                    .map(String::trim)
                    .filter(value -> !value.isBlank())
                    .forEach(values::add);
        }
        return List.copyOf(values);
    }

    private Map<String, Object> summaryClaim(com.java.vinod.authorization.server.dto.auth.AuthDtos.UserSummary summary) {
        Map<String, Object> profile = new LinkedHashMap<>();
        putIfNotNull(profile, "firstName", summary.profile().firstName());
        putIfNotNull(profile, "lastName", summary.profile().lastName());
        putIfNotNull(profile, "phoneNumber", summary.profile().phoneNumber());
        putIfNotNull(profile, "phoneDialCode", summary.profile().phoneDialCode());
        putIfNotNull(profile, "countryCode", summary.profile().countryCode());
        putIfNotNull(profile, "countryName", summary.profile().countryName());
        putIfNotNull(profile, "dateOfBirth", summary.profile().dateOfBirth());
        putIfNotNull(profile, "gender", summary.profile().gender());
        putIfNotNull(profile, "profileImageUrl", summary.profile().profileImageUrl());
        putIfNotNull(profile, "privacySetting", summary.profile().privacySetting());

        Map<String, Object> user = new LinkedHashMap<>();
        user.put("publicId", summary.publicId());
        user.put("email", summary.email());
        user.put("username", firstNonBlank(summary.username(), summary.email()));
        user.put("status", summary.status());
        user.put("emailVerified", summary.emailVerified());
        user.put("profileCompletionStatus", summary.profileCompletionStatus());
        if (!profile.isEmpty()) {
            user.put("profile", profile);
        }
        user.put("roles", summary.roles());
        user.put("apps", summary.apps());
        return user;
    }

    private void putIfNotNull(Map<String, Object> target, String key, Object value) {
        if (value != null) {
            target.put(key, value);
        }
    }

    private String firstNonBlank(String first, String fallback) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        return fallback;
    }

    static RegisteredClient publicPkceClient(String clientId, String redirectUri, List<String> scopes) {
        RegisteredClient.Builder builder = RegisteredClient.withId(UUID.randomUUID().toString())
                .clientId(clientId)
                .clientAuthenticationMethod(ClientAuthenticationMethod.NONE)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(redirectUri)
                .clientSettings(ClientSettings.builder()
                        .requireProofKey(true)
                        .requireAuthorizationConsent(false)
                        .build())
                .tokenSettings(TokenSettings.builder()
                        .accessTokenTimeToLive(Duration.ofMinutes(15))
                        .reuseRefreshTokens(false)
                        .build());
        scopes.forEach(builder::scope);
        return builder.build();
    }

    static RegisteredClient webBffClient(String clientId, String clientSecret, String redirectUri) {
        Set<String> redirectUris = new LinkedHashSet<>();
        redirectUris.add(redirectUri);
        redirectUris.add("https://vinodbalakumar.com/login/oauth2/code/sharity-web-bff");

        RegisteredClient.Builder builder = RegisteredClient.withId(UUID.randomUUID().toString())
                .clientId(clientId)
                .clientSecret("{noop}" + clientSecret)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .scope(OidcScopes.OPENID)
                .scope(OidcScopes.PROFILE)
                .clientSettings(ClientSettings.builder()
                        .requireProofKey(true)
                        .requireAuthorizationConsent(false)
                        .build())
                .tokenSettings(TokenSettings.builder()
                        .accessTokenTimeToLive(Duration.ofMinutes(15))
                        .reuseRefreshTokens(false)
                        .build());
        redirectUris.forEach(builder::redirectUri);
        return builder.build();
    }

    private RSAKey rsaJwk(String privateKeyBase64,
                          String privateKeyPath,
                          String publicKeyBase64,
                          String publicKeyPath,
                          String issuer,
                          String audience) {
        PrivateKey privateKey = parsePrivateKey(loadPem(privateKeyBase64, privateKeyPath, "JWT_PRIVATE_KEY_BASE64", "JWT_PRIVATE_KEY_PATH"));
        PublicKey publicKey = parsePublicKey(loadPem(publicKeyBase64, publicKeyPath, "JWT_PUBLIC_KEY_BASE64", "JWT_PUBLIC_KEY_PATH"));
        return new RSAKey.Builder((RSAPublicKey) publicKey)
                .privateKey((RSAPrivateKey) privateKey)
                .keyID(UUID.nameUUIDFromBytes((issuer + audience).getBytes(StandardCharsets.UTF_8)).toString())
                .build();
    }

    private String loadPem(String base64Pem, String keyPath, String base64Name, String pathName) {
        try {
            if (base64Pem != null && !base64Pem.isBlank()) {
                return new String(Base64.getDecoder().decode(base64Pem), StandardCharsets.UTF_8);
            }
            if (keyPath != null && !keyPath.isBlank()) {
                return Files.readString(Path.of(keyPath), StandardCharsets.UTF_8);
            }
            throw new IllegalStateException(base64Name + " or " + pathName + " must be configured");
        } catch (IllegalStateException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to load JWT key from " + base64Name + " or " + pathName, exception);
        }
    }

    private PrivateKey parsePrivateKey(String pem) {
        try {
            byte[] der = pem.contains("-----BEGIN RSA PRIVATE KEY-----")
                    ? wrapPkcs1RsaPrivateKey(decodePemBody(pem, "RSA PRIVATE KEY"))
                    : decodePemBody(pem, "PRIVATE KEY");
            return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
        } catch (Exception exception) {
            throw new IllegalStateException("JWT private key must be a PKCS#8 PRIVATE KEY or PKCS#1 RSA PRIVATE KEY PEM", exception);
        }
    }

    private PublicKey parsePublicKey(String pem) {
        try {
            byte[] der = decodePemBody(pem, "PUBLIC KEY");
            return KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(der));
        } catch (Exception exception) {
            throw new IllegalStateException("JWT public key must be an RSA public key PEM", exception);
        }
    }

    private byte[] decodePemBody(String pem, String keyType) {
        String body = pem
                .replace("-----BEGIN " + keyType + "-----", "")
                .replace("-----END " + keyType + "-----", "")
                .replaceAll("\\s", "");
        return Base64.getDecoder().decode(body);
    }

    private byte[] wrapPkcs1RsaPrivateKey(byte[] pkcs1) {
        byte[] algorithmIdentifier = new byte[] {
                0x30, 0x0d,
                0x06, 0x09,
                0x2a, (byte) 0x86, 0x48, (byte) 0x86, (byte) 0xf7, 0x0d, 0x01, 0x01, 0x01,
                0x05, 0x00
        };
        ByteArrayOutputStream body = new ByteArrayOutputStream();
        body.write(0x02);
        body.write(0x01);
        body.write(0x00);
        body.writeBytes(algorithmIdentifier);
        body.write(0x04);
        body.writeBytes(derLength(pkcs1.length));
        body.writeBytes(pkcs1);

        byte[] bodyBytes = body.toByteArray();
        ByteArrayOutputStream sequence = new ByteArrayOutputStream();
        sequence.write(0x30);
        sequence.writeBytes(derLength(bodyBytes.length));
        sequence.writeBytes(bodyBytes);
        return sequence.toByteArray();
    }

    private byte[] derLength(int length) {
        if (length < 128) {
            return new byte[] {(byte) length};
        }
        int temp = length;
        int bytesRequired = 0;
        while (temp > 0) {
            temp >>= 8;
            bytesRequired++;
        }
        byte[] result = new byte[bytesRequired + 1];
        result[0] = (byte) (0x80 | bytesRequired);
        for (int i = bytesRequired; i > 0; i--) {
            result[i] = (byte) (length & 0xff);
            length >>= 8;
        }
        return result;
    }
}
