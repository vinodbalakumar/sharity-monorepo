package com.java.vinod.authorization.server.controller;

import com.java.vinod.authorization.server.enums.LoginProvider;
import com.java.vinod.authorization.server.exception.ApiException;
import com.java.vinod.authorization.server.service.SocialRegistrationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping
public class GoogleOAuthCallbackController {
    private final SocialRegistrationService socialRegistrationService;

    public GoogleOAuthCallbackController(SocialRegistrationService socialRegistrationService) {
        this.socialRegistrationService = socialRegistrationService;
    }

    @GetMapping("/login/oauth2/code/google")
    public ResponseEntity<Void> googleCallback(@RequestParam String code,
                                               @RequestParam String state,
                                               HttpServletRequest request) {
        try {
            SocialRegistrationService.CallbackResult result =
                    socialRegistrationService.completeProviderCallback(LoginProvider.GOOGLE, code, null, state, request);
            ResponseEntity.BodyBuilder response = ResponseEntity.status(HttpStatus.FOUND)
                    .location(result.redirectUri());
            if (result.registrationRequired()) {
                response.header(HttpHeaders.SET_COOKIE, socialCookie(result.completionToken()).toString());
            } else if (result.accessToken() != null) {
                response.header(HttpHeaders.SET_COOKIE, accessTokenCookie(result).toString());
            }
            return response.build();
        } catch (ApiException exception) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(java.net.URI.create("/authorization-server/api/login?socialError=" + enc(exception.getMessage())))
                    .build();
        }
    }

    private ResponseCookie socialCookie(String completionToken) {
        return ResponseCookie.from(SocialRegistrationService.COOKIE_NAME, completionToken)
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/authorization-server/api/v1/auth/social")
                .maxAge(Duration.ofMinutes(30))
                .build();
    }

    private ResponseCookie accessTokenCookie(SocialRegistrationService.CallbackResult result) {
        return ResponseCookie.from("SHARITY_ACCESS_TOKEN", result.accessToken())
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofSeconds(result.expiresInSeconds()))
                .build();
    }

    private String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
