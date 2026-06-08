package com.java.vinod.marketplace.service.config;

import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitingConfig {

    @Bean
    public RateLimiterRegistry rateLimiterRegistry() {
        return RateLimiterRegistry.ofDefaults();
    }

    @Bean
    public RateLimiter apiRateLimiter(RateLimiterRegistry registry) {
        RateLimiterConfig config = RateLimiterConfig.custom()
            .limitRefreshPeriod(Duration.ofMinutes(1))
            .limitForPeriod(100) // 100 requests per minute per customer
            .timeoutDuration(Duration.ofSeconds(5))
            .build();

        return registry.rateLimiter("api-limiter", config);
    }

    @Bean
    public RateLimiter searchRateLimiter(RateLimiterRegistry registry) {
        RateLimiterConfig config = RateLimiterConfig.custom()
            .limitRefreshPeriod(Duration.ofMinutes(1))
            .limitForPeriod(30) // 30 search requests per minute
            .timeoutDuration(Duration.ofSeconds(5))
            .build();

        return registry.rateLimiter("search-limiter", config);
    }

    @Bean
    public RateLimiter authRateLimiter(RateLimiterRegistry registry) {
        RateLimiterConfig config = RateLimiterConfig.custom()
            .limitRefreshPeriod(Duration.ofMinutes(1))
            .limitForPeriod(10) // 10 auth attempts per minute (brute force protection)
            .timeoutDuration(Duration.ofSeconds(5))
            .build();

        return registry.rateLimiter("auth-limiter", config);
    }

}
