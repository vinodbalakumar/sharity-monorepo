package com.java.vinod.marketplace.service.config;

import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import static org.assertj.core.api.Assertions.assertThat;

class RateLimitingFilterTest {
    @Test void exhaustedLimitReturns429InsteadOfThrowingServerError() throws Exception {
        var configuration = RateLimiterConfig.custom().limitForPeriod(1)
                .limitRefreshPeriod(Duration.ofMinutes(1)).timeoutDuration(Duration.ZERO).build();
        var filter = new RateLimitingFilter(RateLimiterRegistry.of(configuration));
        var calls = new AtomicInteger();
        var first = new MockHttpServletResponse();
        filter.doFilter(new MockHttpServletRequest("GET", "/api/orders"), first,
                (request, response) -> calls.incrementAndGet());
        var second = new MockHttpServletResponse();
        filter.doFilter(new MockHttpServletRequest("GET", "/api/orders"), second,
                (request, response) -> calls.incrementAndGet());
        assertThat(calls.get()).isEqualTo(1);
        assertThat(second.getStatus()).isEqualTo(429);
        assertThat(second.getContentType()).isEqualTo("application/json");
        assertThat(second.getHeader("Retry-After")).isEqualTo("60");
    }
}
