package com.java.vinod.platform.ai.chat;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

/** Identity is established by JWT validation or the authenticated private BFF channel, never JSON input. */
public record ChatIdentity(String owner, boolean guest) {
    public static ChatIdentity from(Authentication authentication) {
        if (authentication.getPrincipal() instanceof ChatIdentity identity) return identity;
        if (authentication.getPrincipal() instanceof Jwt jwt)
            return new ChatIdentity(userKey(String.valueOf(jwt.getIssuer()), jwt.getSubject()), false);
        throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED);
    }
    public static String userKey(String issuer, String subject) {
        try {
            return "user_" + HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest((issuer + "\n" + subject).getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
    }
}
