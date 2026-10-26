package com.java.vinod.marketplace.service.controller;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

@RestController
class CommerceConfigurationController {
    private final boolean demoEnabled;
    CommerceConfigurationController(@Value("${app.commerce.demo-purchases-enabled:false}") boolean demoEnabled) {
        this.demoEnabled = demoEnabled;
    }
    @GetMapping("/api/v1/commerce/config")
    Map<String, Object> config() { return Map.of("enabled", demoEnabled, "mode", demoEnabled ? "DEMO" : "UNAVAILABLE"); }
}
