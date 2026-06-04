package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.MarketplaceConfigDtos;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class MarketplaceConfigMockController {
    @GetMapping("/api/admin/marketplace-config/countries")
    public List<MarketplaceConfigDtos.CountryMarketplaceConfigSummary> countries() { return MarketplaceConfigDtos.countries(); }
    @GetMapping("/api/admin/marketplace-config/countries/{countryCode}")
    public List<MarketplaceConfigDtos.MarketplaceConfigDetail> country(@PathVariable String countryCode) { return MarketplaceConfigDtos.configs(); }
    @PostMapping("/api/admin/marketplace-config")
    public MarketplaceConfigDtos.MarketplaceConfigDetail create(@RequestBody(required = false) Object request) { return MarketplaceConfigDtos.configs().get(0); }
    @PatchMapping("/api/admin/marketplace-config/{configId}")
    public MarketplaceConfigDtos.MarketplaceConfigDetail update(@PathVariable String configId, @RequestBody(required = false) Object request) { return MarketplaceConfigDtos.configs().get(0); }
    @PostMapping("/api/admin/marketplace-config/{configId}/enable")
    public MarketplaceConfigDtos.MarketplaceConfigDetail enable(@PathVariable String configId) { return MarketplaceConfigDtos.configs().get(0); }
    @PostMapping("/api/admin/marketplace-config/{configId}/disable")
    public MarketplaceConfigDtos.MarketplaceConfigDetail disable(@PathVariable String configId) { return MarketplaceConfigDtos.configs().get(0); }
    @PostMapping("/api/admin/marketplace-config/{configId}/coming-soon")
    public MarketplaceConfigDtos.MarketplaceConfigDetail comingSoon(@PathVariable String configId) { return MarketplaceConfigDtos.configs().get(0); }
    @PatchMapping("/api/admin/marketplace-config/{configId}/availability")
    public MarketplaceConfigDtos.MarketplaceConfigDetail availability(@PathVariable String configId, @RequestBody(required = false) Object request) { return MarketplaceConfigDtos.configs().get(0); }
    @PatchMapping("/api/admin/marketplace-config/{configId}/eligibility")
    public MarketplaceConfigDtos.MarketplaceConfigDetail eligibility(@PathVariable String configId, @RequestBody(required = false) Object request) { return MarketplaceConfigDtos.configs().get(0); }
    @PatchMapping("/api/admin/marketplace-config/{configId}/feature-flags")
    public MarketplaceConfigDtos.MarketplaceConfigDetail flags(@PathVariable String configId, @RequestBody(required = false) Object request) { return MarketplaceConfigDtos.configs().get(0); }
    @PatchMapping("/api/admin/marketplace-config/display-order")
    public List<MarketplaceConfigDtos.MarketplaceDisplayOrderItem> displayOrder(@RequestBody(required = false) Object request) { return List.of(new MarketplaceConfigDtos.MarketplaceDisplayOrderItem("DIGITAL", 1, true, false)); }
    @PostMapping("/api/admin/marketplace-config/simulate")
    public MarketplaceConfigDtos.MarketplaceAvailabilitySimulationResponse simulate(@RequestBody(required = false) MarketplaceConfigDtos.MarketplaceAvailabilitySimulationRequest request) { return MarketplaceConfigDtos.simulation(); }
    @GetMapping("/api/admin/marketplace-config/audit-log")
    public List<MarketplaceConfigDtos.MarketplaceConfigAuditLogItem> audit() { return MarketplaceConfigDtos.audit(); }
    @PostMapping("/api/admin/marketplace-config/{configId}/publish")
    public MarketplaceConfigDtos.MarketplaceConfigDetail publish(@PathVariable String configId) { return MarketplaceConfigDtos.configs().get(0); }
    @GetMapping("/api/admin/marketplace-config/{configId}/versions")
    public List<MarketplaceConfigDtos.MarketplaceConfigDetail> versions(@PathVariable String configId) { return MarketplaceConfigDtos.configs(); }
    @GetMapping("/api/marketplaces/availability")
    public MarketplaceConfigDtos.UserMarketplaceAvailabilityResponse userAvailability() { return new MarketplaceConfigDtos.UserMarketplaceAvailabilityResponse("USA", List.of(), List.of(), "DIGITAL", List.of(), List.of("Marketplace enabled"), List.of("BROWSE")); }
    @GetMapping("/api/registration/countries")
    public List<MarketplaceConfigDtos.CountryMarketplaceConfigSummary> registrationCountries() { return MarketplaceConfigDtos.countries(); }
    @PostMapping("/api/profile/country/validate-change")
    public MarketplaceConfigDtos.CountryMarketplaceConfigSummary validateCountryChange(@RequestBody(required = false) Object request) { return MarketplaceConfigDtos.countries().get(0); }
}
