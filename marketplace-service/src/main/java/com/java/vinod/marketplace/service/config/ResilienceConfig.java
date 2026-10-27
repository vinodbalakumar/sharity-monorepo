package com.java.vinod.marketplace.service.config;

import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Resilience4j configuration for marketplace service.
 * Provides retry policies for database and inter-service operations.
 *
 * Configuration is managed via properties:
 *   - resilience4j.retry.instances.{retry-name}.{property}
 *
 * Activation: Enable with --spring.profiles.active=resilience
 */
@Configuration
@Slf4j
public class ResilienceConfig {

    /**
     * Database Retry Policy (3 attempts, quick backoff)
     * Handles transient deadlocks and connection timeout issues
     */
    @Bean
    public Retry databaseRetry(RetryRegistry retryRegistry) {
        RetryConfig config = RetryConfig.custom()
                .maxAttempts(3)
                .waitDuration(Duration.ofMillis(100))
                .build();

        Retry retry = retryRegistry.retry("database-retry", config);
        log.info("Registered database-retry: max attempts=3, wait=100ms");
        return retry;
    }

    /**
     * Service Retry Policy (3 attempts with backoff)
     * For inter-service REST calls
     */
    @Bean
    public Retry serviceRetry(RetryRegistry retryRegistry) {
        RetryConfig config = RetryConfig.custom()
                .maxAttempts(3)
                .waitDuration(Duration.ofMillis(500))
                .build();

        Retry retry = retryRegistry.retry("service-retry", config);
        log.info("Registered service-retry: max attempts=3, wait=500ms");
        return retry;
    }

}
