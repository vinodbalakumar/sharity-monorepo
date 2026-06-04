package com.java.vinod.platform.web.bff.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
/**
 * Binds the browser BFF configuration used to connect the public app, OAuth
 * client registration, and backend service proxy targets.
 *
 * <p>The nested records intentionally group only route and credential settings
 * so the browser session flow stays easy to understand without exposing
 * request bodies or secrets in code comments.</p>
 */
public record BffProperties(
        Security security,
        OAuth2 oauth2,
        Backends backends,
        Web web) {

    /**
     * Holds browser-origin settings used for CORS and session-aware requests.
     */
    public record Security(String allowedOrigin) {}

    /**
     * Holds the OAuth client values used by the confidential BFF browser flow.
     */
    public record OAuth2(String clientId,
                         String clientSecret,
                         String redirectUri,
                         String authorizationServerPublicBaseUrl,
                         String authorizationServerBaseUrl) {}

    /**
     * Holds the internal backend URLs that the BFF proxies to after login.
     */
    public record Backends(String authorizationServer,
                           String marketplaceService,
                           String paymentService,
                           String walletService) {}

    /**
     * Holds the public web redirect target used after a successful browser login.
     */
    public record Web(String redirectUri) {}
}
