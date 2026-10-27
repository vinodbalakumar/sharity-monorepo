package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.AccountSwitcherDtos;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Stateless mocked Account Switcher API for STORY-034.
 */
@RestController
@RequestMapping("/api/account")
public class AccountSwitcherController {
    @GetMapping("/switcher")
    public AccountSwitcherDtos.AccountSwitcherResponse switcher(@RequestParam(required = false) String mode,
                                                                @RequestParam(required = false) String marketplace) {
        return AccountSwitcherDtos.mock(mode, marketplace);
    }

    @PostMapping("/switch-mode")
    public AccountSwitcherDtos.SwitchAccountModeResponse switchMode(
            @RequestBody AccountSwitcherDtos.SwitchAccountModeRequest request) {
        if ("SELLER".equals(request.targetMode()) && "GROCERY".equals(request.targetMarketplace())) {
            return new AccountSwitcherDtos.SwitchAccountModeResponse("BUYER", "DIGITAL", false,
                    "Seller mode is not available for Grocery in your country.", true,
                    "MARKETPLACE_NOT_AVAILABLE_IN_COUNTRY");
        }
        return new AccountSwitcherDtos.SwitchAccountModeResponse(request.targetMode(),
                request.targetMarketplace() == null ? "DIGITAL" : request.targetMarketplace(),
                true, "Mode switched.", false, null);
    }

    @PostMapping("/switch-marketplace")
    public AccountSwitcherDtos.SwitchAccountModeResponse switchMarketplace(
            @RequestBody AccountSwitcherDtos.SwitchAccountModeRequest request) {
        return new AccountSwitcherDtos.SwitchAccountModeResponse(
                request.targetMode() == null ? "BUYER" : request.targetMode(),
                request.targetMarketplace() == null ? "DIGITAL" : request.targetMarketplace(),
                true, "Marketplace switched.", false, null);
    }

    @GetMapping("/marketplace-preferences")
    public List<AccountSwitcherDtos.MarketplaceModuleAvailability> preferences() {
        return AccountSwitcherDtos.modules();
    }

    @PatchMapping("/marketplace-preferences")
    public AccountSwitcherDtos.SwitchAccountModeResponse updatePreferences(
            @RequestBody AccountSwitcherDtos.MarketplacePreferenceUpdateRequest request) {
        return new AccountSwitcherDtos.SwitchAccountModeResponse("BUYER", request.marketplaceCode(), true,
                "Marketplace preference updated.", false, null);
    }

    @GetMapping("/seller-mode-eligibility")
    public AccountSwitcherDtos.SellerModeEligibility sellerModeEligibility() {
        return AccountSwitcherDtos.mock("BUYER", "DIGITAL").sellerModeEligibility();
    }

    @GetMapping("/marketplace-availability")
    public List<AccountSwitcherDtos.MarketplaceModuleAvailability> marketplaceAvailability() {
        return AccountSwitcherDtos.modules();
    }
}
