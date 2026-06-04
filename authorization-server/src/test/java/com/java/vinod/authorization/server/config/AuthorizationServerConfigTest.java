package com.java.vinod.authorization.server.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcScopes;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AuthorizationServerConfigTest {

    @Test
    void publicPkceClientRequiresProofKeyAndHasNoSecret() {
        var client = AuthorizationServerConfig.publicPkceClient(
                "sharity-flutter-test",
                "http://127.0.0.1:53682/callback",
                List.of(OidcScopes.OPENID, OidcScopes.PROFILE));

        assertThat(client.getClientId()).isEqualTo("sharity-flutter-test");
        assertThat(client.getClientSecret()).isNull();
        assertThat(client.getClientAuthenticationMethods()).contains(ClientAuthenticationMethod.NONE);
        assertThat(client.getAuthorizationGrantTypes()).contains(AuthorizationGrantType.AUTHORIZATION_CODE);
        assertThat(client.getRedirectUris()).contains("http://127.0.0.1:53682/callback");
        assertThat(client.getScopes()).contains(OidcScopes.OPENID, OidcScopes.PROFILE);
        assertThat(client.getClientSettings().isRequireProofKey()).isTrue();
    }

    @Test
    void webBffClientIsConfidentialAndRequiresProofKey() {
        var client = AuthorizationServerConfig.webBffClient(
                "sharity-web-bff",
                "test-secret",
                "https://vinodbalakumar.com/login/oauth2/code/sharity-web-bff");

        assertThat(client.getClientId()).isEqualTo("sharity-web-bff");
        assertThat(client.getClientSecret()).isEqualTo("{noop}test-secret");
        assertThat(client.getClientAuthenticationMethods()).contains(ClientAuthenticationMethod.CLIENT_SECRET_BASIC);
        assertThat(client.getAuthorizationGrantTypes()).contains(AuthorizationGrantType.AUTHORIZATION_CODE);
        assertThat(client.getRedirectUris()).contains("https://vinodbalakumar.com/login/oauth2/code/sharity-web-bff");
        assertThat(client.getScopes()).contains(OidcScopes.OPENID, OidcScopes.PROFILE);
        assertThat(client.getClientSettings().isRequireProofKey()).isTrue();
    }

    @Test
    void nativePkceClientsStayPublicAndRequireProofKey() {
        var androidClient = AuthorizationServerConfig.publicPkceClient(
                "sharity-android",
                "com.vinod.sharity://oauth2redirect/android",
                List.of(OidcScopes.OPENID, OidcScopes.PROFILE));
        var iosClient = AuthorizationServerConfig.publicPkceClient(
                "sharity-ios",
                "com.vinod.sharity://oauth2redirect/ios",
                List.of(OidcScopes.OPENID, OidcScopes.PROFILE));
        var windowsClient = AuthorizationServerConfig.publicPkceClient(
                "sharity-desktop-windows",
                "http://127.0.0.1:53682/sharity/windows-callback",
                List.of(OidcScopes.OPENID, OidcScopes.PROFILE));
        var macosClient = AuthorizationServerConfig.publicPkceClient(
                "sharity-desktop-macos",
                "http://127.0.0.1:53682/sharity/macos-callback",
                List.of(OidcScopes.OPENID, OidcScopes.PROFILE));

        for (var client : List.of(androidClient, iosClient, windowsClient, macosClient)) {
            assertThat(client.getClientSecret()).isNull();
            assertThat(client.getClientAuthenticationMethods()).contains(ClientAuthenticationMethod.NONE);
            assertThat(client.getAuthorizationGrantTypes()).contains(AuthorizationGrantType.AUTHORIZATION_CODE);
            assertThat(client.getClientSettings().isRequireProofKey()).isTrue();
        }
        assertThat(androidClient.getRedirectUris()).contains("com.vinod.sharity://oauth2redirect/android");
        assertThat(iosClient.getRedirectUris()).contains("com.vinod.sharity://oauth2redirect/ios");
        assertThat(windowsClient.getRedirectUris()).contains("http://127.0.0.1:53682/sharity/windows-callback");
        assertThat(macosClient.getRedirectUris()).contains("http://127.0.0.1:53682/sharity/macos-callback");
    }
}
