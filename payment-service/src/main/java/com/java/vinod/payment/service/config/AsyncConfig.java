package com.java.vinod.payment.service.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Async configuration for background tasks.
 * Enables @Async annotation for non-blocking notification sending.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    // Uses default thread pool; can be customized via application.properties
    // spring.task.execution.pool.core-size=5
    // spring.task.execution.pool.max-size=20
}
