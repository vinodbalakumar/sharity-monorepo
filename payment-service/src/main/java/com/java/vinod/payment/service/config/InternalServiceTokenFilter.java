package com.java.vinod.payment.service.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Enforces shared-token authentication for local internal payment APIs.
 */
@Component
public class InternalServiceTokenFilter extends OncePerRequestFilter {
    private final String internalServiceToken;

    /**
     * Creates the filter using the configured internal service token.
     */
    public InternalServiceTokenFilter(@Value("${app.internal.service-token}") String internalServiceToken) {
        if (internalServiceToken == null || internalServiceToken.isBlank()) {
            throw new IllegalArgumentException("app.internal.service-token must not be blank. "
                    + "Set the same APP_INTERNAL_SERVICE_TOKEN in all core services; "
                    + "for standalone local development, run tools\\Initialize-LocalServiceToken.ps1.");
        }
        this.internalServiceToken = internalServiceToken;
    }

    /**
     * Rejects internal API requests unless the configured token header matches.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (request.getRequestURI().contains("/internal/")) {
            String token = request.getHeader("X-Internal-Service-Token");
            if (!internalServiceToken.equals(token)) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Valid internal service token is required");
                return;
            }
        }
        filterChain.doFilter(request, response);
    }
}
