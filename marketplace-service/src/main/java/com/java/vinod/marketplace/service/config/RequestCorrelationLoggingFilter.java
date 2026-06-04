package com.java.vinod.marketplace.service.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Adds a safe correlation ID to every marketplace request.
 *
 * <p>The marketplace service handles public browse traffic and protected seller
 * actions, so this filter improves traceability without logging bodies,
 * credentials, or payment payloads.</p>
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestCorrelationLoggingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(RequestCorrelationLoggingFilter.class);
    /**
     * Request attribute and response header used to propagate the correlation ID.
     */
    public static final String CORRELATION_ID_ATTRIBUTE = "X-Correlation-ID";

    /**
     * Ensures each request has a correlation ID, exposes it in the response,
     * and emits a safe completion log line with the request path and status.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String correlationId = correlationId(request);
        request.setAttribute(CORRELATION_ID_ATTRIBUTE, correlationId);
        response.setHeader(CORRELATION_ID_ATTRIBUTE, correlationId);

        long startedAtNanos = System.nanoTime();
        try (MDC.MDCCloseable ignored = MDC.putCloseable("correlationId", correlationId)) {
            try {
                filterChain.doFilter(request, response);
            } catch (ServletException | IOException exception) {
                log.warn(
                        "Request failed. correlationId={}, method={}, path={}, status={}, exceptionType={}",
                        correlationId,
                        request.getMethod(),
                        request.getRequestURI(),
                        response.getStatus(),
                        exception.getClass().getSimpleName()
                );
                throw exception;
            } catch (RuntimeException exception) {
                log.warn(
                        "Request failed. correlationId={}, method={}, path={}, status={}, exceptionType={}",
                        correlationId,
                        request.getMethod(),
                        request.getRequestURI(),
                        response.getStatus(),
                        exception.getClass().getSimpleName()
                );
                throw exception;
            } finally {
                long elapsedMs = (System.nanoTime() - startedAtNanos) / 1_000_000L;
                log.info("Request completed. correlationId={}, method={}, path={}, status={}, elapsedMs={}",
                        correlationId, request.getMethod(), request.getRequestURI(), response.getStatus(), elapsedMs);
            }
        }
    }

    /**
     * Reuses an incoming correlation ID when one is supplied, otherwise creates a new one.
     */
    private String correlationId(HttpServletRequest request) {
        String incoming = request.getHeader(CORRELATION_ID_ATTRIBUTE);
        if (StringUtils.hasText(incoming)) {
            return incoming.trim();
        }
        return UUID.randomUUID().toString();
    }
}
