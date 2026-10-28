package com.java.vinod.authorization.server.security;

import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.spec.RSAPublicKeySpec;

public final class JwtKeySupport {

    private JwtKeySupport() {
    }

    public static PublicKey derivePublicKey(PrivateKey privateKey) {
        if (!(privateKey instanceof RSAPrivateCrtKey rsaPrivateKey)) {
            throw new IllegalStateException("JWT private key must contain RSA CRT parameters to derive its public key");
        }
        try {
            RSAPublicKeySpec publicKeySpec = new RSAPublicKeySpec(
                    rsaPrivateKey.getModulus(), rsaPrivateKey.getPublicExponent());
            return KeyFactory.getInstance("RSA").generatePublic(publicKeySpec);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to derive JWT public key from private key", exception);
        }
    }
}