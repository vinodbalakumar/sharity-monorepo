package com.java.vinod.authorization.server.service;

import com.java.vinod.authorization.server.dto.auth.AuthDtos;
import com.java.vinod.authorization.server.entity.AppUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

@Service
public class JwtService {
    private final PrivateKey privateKey;
    private final PublicKey publicKey;
    private final String issuer;
    private final String audience;
    private final Duration accessTokenExpiration;

    public JwtService(@Value("${app.jwt.private-key-base64}") String privateKeyBase64,
                      @Value("${app.jwt.public-key-base64}") String publicKeyBase64,
                      @Value("${app.jwt.private-key-path}") String privateKeyPath,
                      @Value("${app.jwt.public-key-path}") String publicKeyPath,
                      @Value("${app.jwt.issuer}") String issuer,
                      @Value("${app.jwt.audience}") String audience,
                      @Value("${app.jwt.access-token-expiration}") Duration accessTokenExpiration) {
        String privatePem = loadPem(privateKeyBase64, privateKeyPath, "JWT_PRIVATE_KEY_BASE64", "JWT_PRIVATE_KEY_PATH");
        String publicPem = loadPem(publicKeyBase64, publicKeyPath, "JWT_PUBLIC_KEY_BASE64", "JWT_PUBLIC_KEY_PATH");
        this.privateKey = parsePrivateKey(privatePem);
        this.publicKey = parsePublicKey(publicPem);
        this.issuer = issuer;
        this.audience = audience;
        this.accessTokenExpiration = accessTokenExpiration;
    }

    public String createAccessToken(AppUser user, AuthDtos.UserSummary userSummary) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(issuer)
                .subject(user.getNormalizedEmail())
                .audience().add(audience).and()
                .claim("uid", user.getPublicId())
                .claim("email", userSummary.email())
                .claim("username", userSummary.username())
                .claim("status", userSummary.status())
                .claim("emailVerified", userSummary.emailVerified())
                .claim("roles", userSummary.roles())
                .claim("apps", userSummary.apps())
                .claim("user", userSummary)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTokenExpiration)))
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(publicKey)
                .requireIssuer(issuer)
                .requireAudience(audience)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long accessTokenExpiresInSeconds() {
        return accessTokenExpiration.toSeconds();
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
