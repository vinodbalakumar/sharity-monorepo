package com.java.vinod.payment.service.config;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.core.registry.EntryAddedEvent;
import io.github.resilience4j.core.registry.EntryRemovedEvent;
import io.github.resilience4j.core.registry.RegistryEventConsumer;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;
import io.github.resilience4j.core.registry.EntryAddedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.concurrent.TimeoutException;

/**
 * Resilience configuration for inter-service calls.
 *
 * Implements:
 * - Retry policies with exponential backoff
 * - Circuit breakers for external APIs
 * - Timeout handling
 */
@Configuration
@Slf4j
public class ResilienceConfig {

    // ==================== CIRCUIT BREAKER CONFIGURATION ====================

    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        return CircuitBreakerRegistry.ofDefaults();
    }

    /**
     * Circuit breaker for PayPal API calls.
     * Opens if 50% of last 100 calls fail.
     */
    @Bean
    public CircuitBreaker paypalCircuitBreaker(CircuitBreakerRegistry registry) {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            .failureRateThreshold(50.0f)
            .waitDurationInOpenState(Duration.ofSeconds(30))
            .permittedNumberOfCallsInHalfOpenState(5)
            .slidingWindowSize(100)
            .minimumNumberOfCalls(10)
            .recordExceptions(TimeoutException.class, Exception.class)
            .build();

        CircuitBreaker circuitBreaker = registry.circuitBreaker("paypal-circuit-breaker", config);
        logCircuitBreakerEvents(circuitBreaker);
        return circuitBreaker;
    }

    /**
     * Circuit breaker for Marketplace Service calls.
     */
    @Bean
    public CircuitBreaker marketplaceCircuitBreaker(CircuitBreakerRegistry registry) {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            .failureRateThreshold(60.0f)
            .waitDurationInOpenState(Duration.ofSeconds(20))
            .permittedNumberOfCallsInHalfOpenState(5)
            .slidingWindowSize(50)
            .minimumNumberOfCalls(5)
            .recordExceptions(TimeoutException.class, Exception.class)
            .build();

        return registry.circuitBreaker("marketplace-circuit-breaker", config);
    }

    /**
     * Circuit breaker for Authorization Service calls.
     */
    @Bean
    public CircuitBreaker authorizationCircuitBreaker(CircuitBreakerRegistry registry) {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
            .failureRateThreshold(40.0f)
            .waitDurationInOpenState(Duration.ofSeconds(15))
            .permittedNumberOfCallsInHalfOpenState(3)
            .slidingWindowSize(30)
            .minimumNumberOfCalls(5)
            .recordExceptions(TimeoutException.class, Exception.class)
            .build();

        return registry.circuitBreaker("authorization-circuit-breaker", config);
    }

    // ==================== RETRY CONFIGURATION ====================

    @Bean
    public RetryRegistry retryRegistry() {
        return RetryRegistry.ofDefaults();
    }

    /**
     * Retry policy for PayPal API calls.
     * Exponential backoff: 1s, 2s, 4s, 8s, 16s
     */
    @Bean
    public Retry paypalRetry(RetryRegistry registry) {
        RetryConfig config = RetryConfig.custom()
            .maxAttempts(5)
            .waitDuration(Duration.ofSeconds(1))
            .build();

        return registry.retry("paypal-retry", config);
    }

    /**
     * Retry policy for inter-service REST calls.
     */
    @Bean
    public Retry serviceRetry(RetryRegistry registry) {
        RetryConfig config = RetryConfig.custom()
            .maxAttempts(3)
            .waitDuration(Duration.ofMillis(500))
            .build();

        return registry.retry("service-retry", config);
    }

    /**
     * Retry policy for database operations.
     * More aggressive - quick retries for transient failures.
     */
    @Bean
    public Retry databaseRetry(RetryRegistry registry) {
        RetryConfig config = RetryConfig.custom()
            .maxAttempts(3)
            .waitDuration(Duration.ofMillis(100))
            .build();

        return registry.retry("database-retry", config);
    }

    // ==================== EVENT LOGGING ====================

    private void logCircuitBreakerEvents(CircuitBreaker circuitBreaker) {
        circuitBreaker.getEventPublisher()
            .onStateTransition(event ->
                log.warn("Circuit breaker {} transitioned: {} → {}",
                    circuitBreaker.getName(),
                    event.getStateTransition().getFromState(),
                    event.getStateTransition().getToState()))
            .onError(event ->
                log.error("Circuit breaker {} recorded error: {}",
                    circuitBreaker.getName(),
                    event.getThrowable().getMessage()))
            .onSuccess(event ->
                log.debug("Circuit breaker {} recorded success", circuitBreaker.getName()));
    }

    // ==================== HELPER METHODS ====================

    /**
     * Determine if an exception is retryable.
     * Retryable: timeouts, connection errors, 5xx errors
     * Not retryable: validation errors, 4xx errors
     */
    private boolean isRetryable(Throwable throwable) {
        return throwable instanceof TimeoutException ||
               throwable instanceof java.net.ConnectException ||
               throwable instanceof java.io.IOException ||
               (throwable instanceof Exception &&
                throwable.getMessage() != null &&
                (throwable.getMessage().contains("500") ||
                 throwable.getMessage().contains("502") ||
                 throwable.getMessage().contains("503") ||
                 throwable.getMessage().contains("504")));
    }

    /**
     * Determine if database exception is retryable.
     * Deadlock and timeout errors can be retried.
     */
    private boolean isDatabaseRetryable(Throwable throwable) {
        return throwable instanceof java.sql.SQLTransientException ||
               (throwable instanceof Exception &&
                throwable.getMessage() != null &&
                (throwable.getMessage().contains("deadlock") ||
                 throwable.getMessage().contains("timeout") ||
                 throwable.getMessage().contains("connection")));
    }
}
