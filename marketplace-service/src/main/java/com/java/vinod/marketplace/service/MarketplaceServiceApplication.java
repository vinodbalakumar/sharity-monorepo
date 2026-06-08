package com.java.vinod.marketplace.service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Starts the marketplace-service application and its scheduled outbox dispatcher.
 */
@SpringBootApplication
@EnableScheduling
@EnableAspectJAutoProxy
public class MarketplaceServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(MarketplaceServiceApplication.class, args);
    }
}
