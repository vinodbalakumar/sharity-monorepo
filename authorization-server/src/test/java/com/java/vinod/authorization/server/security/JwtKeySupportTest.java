package com.java.vinod.authorization.server.security;

import org.junit.jupiter.api.Test;

import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;

import static org.assertj.core.api.Assertions.assertThat;

class JwtKeySupportTest {

    @Test
    void derivesMatchingPublicKeyFromRsaPrivateKey() throws Exception {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(2048);
        var keyPair = keyPairGenerator.generateKeyPair();

        var derivedPublicKey = (RSAPublicKey) JwtKeySupport.derivePublicKey(keyPair.getPrivate());
        var originalPublicKey = (RSAPublicKey) keyPair.getPublic();

        assertThat(derivedPublicKey.getModulus()).isEqualTo(originalPublicKey.getModulus());
        assertThat(derivedPublicKey.getPublicExponent()).isEqualTo(originalPublicKey.getPublicExponent());
    }
}