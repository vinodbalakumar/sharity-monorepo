package com.java.vinod.payment.service.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "paypal")
@Data
public class PayPalConfig {
    private String clientId;
    private String clientSecret;
    private String mode = "SANDBOX"; // SANDBOX or LIVE
    private String apiBaseUrl;
    private Integer connectTimeout = 10000;
    private Integer readTimeout = 30000;

    public String getBaseUrl() {
        if ("LIVE".equalsIgnoreCase(mode)) {
            return "https://api.paypal.com";
        }
        return "https://api.sandbox.paypal.com";
    }
}
