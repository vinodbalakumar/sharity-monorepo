package com.java.vinod.payment.service.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/**
 * Provides a safe fallback mail sender so the service can start even when SMTP is not configured.
 * Real SMTP settings can still override this bean via Spring Boot auto-configuration.
 */
@Configuration
public class MailConfig {

    @Bean
    @ConditionalOnMissingBean(JavaMailSender.class)
    public JavaMailSender fallbackJavaMailSender() {
        return new JavaMailSenderImpl();
    }
}
