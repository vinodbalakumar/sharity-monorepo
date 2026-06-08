package com.java.vinod.marketplace.service.config;

import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {
    private final RateLimiterRegistry rateLimiterRegistry;
    private final ConcurrentHashMap<String, RateLimiter> customerLimiters = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {

        String path = request.getRequestURI();

        // Skip rate limiting for health checks and public endpoints
        if (path.startsWith("/actuator") || path.startsWith("/api/v1/auth/register") || path.startsWith("/api/v1/auth/login")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Get customer identifier from JWT or IP
        String customerId = getCustomerId(request);

        // Select appropriate rate limiter based on endpoint
        RateLimiter limiter = selectRateLimiter(path, customerId);

        if (limiter == null || limiter.executeSupplier(() -> true)) {
            // Within rate limit
            filterChain.doFilter(request, response);
        } else {
            // Rate limit exceeded
            log.warn("Rate limit exceeded for customer {} on path {}", customerId, path);
            response.setStatus(429);
            response.getWriter().write("{\"error\": \"Rate limit exceeded\", \"retryAfter\": 60}");
        }
    }

    private RateLimiter selectRateLimiter(String path, String customerId) {
        RateLimiter limiter;

        if (path.contains("/search")) {
            limiter = rateLimiterRegistry.rateLimiter("search-limiter");
        } else if (path.contains("/auth")) {
            limiter = rateLimiterRegistry.rateLimiter("auth-limiter");
        } else {
            limiter = rateLimiterRegistry.rateLimiter("api-limiter");
        }

        // Create per-customer rate limiter if not exists
        String limiterKey = customerId + "-" + limiter.getName();
        return customerLimiters.computeIfAbsent(limiterKey, key ->
            RateLimiter.of(key, limiter.getRateLimiterConfig())
        );
    }

    private String getCustomerId(HttpServletRequest request) {
        // Try to get from JWT claim
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                return authentication.getName();
            }
        } catch (Exception e) {
            log.debug("Could not extract user from security context");
        }

        // Fall back to IP address
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }
        return "ip-" + ip;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator");
    }
}
