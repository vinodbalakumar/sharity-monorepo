package com.java.vinod.authorization.server.controller;

import com.java.vinod.authorization.server.dto.auth.AuthDtos;
import com.java.vinod.authorization.server.dto.platform.PlatformDtos;
import com.java.vinod.authorization.server.security.AuthenticatedUser;
import com.java.vinod.authorization.server.service.PlatformAuthorizationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@Validated
public class PlatformAuthorizationController {
    private static final String UPPER_CODE_PATTERN = "[A-Z0-9_]{2,50}";
    private static final String UUID_PATTERN = "[0-9a-fA-F-]{36}";

    private final PlatformAuthorizationService platformAuthorizationService;
    private final String internalServiceToken;

    public PlatformAuthorizationController(PlatformAuthorizationService platformAuthorizationService,
                                           @Value("${app.internal.service-token}") String internalServiceToken) {
        this.platformAuthorizationService = platformAuthorizationService;
        this.internalServiceToken = internalServiceToken;
    }

    @GetMapping("/v1/users/me/modules")
    public List<PlatformDtos.ModuleResponse> userModules(@AuthenticationPrincipal AuthenticatedUser user) {
        return platformAuthorizationService.userModules(user.id());
    }

    @GetMapping("/v1/users/me/capabilities")
    public PlatformDtos.CapabilityResponse userCapabilities(@AuthenticationPrincipal AuthenticatedUser user) {
        return platformAuthorizationService.userCapabilities(user.id());
    }

    @GetMapping("/v1/users/me/provider-accounts")
    public List<PlatformDtos.ProviderAccountResponse> providerAccounts(@AuthenticationPrincipal AuthenticatedUser user) {
        return platformAuthorizationService.myProviderAccounts(user.id());
    }

    @PostMapping("/v1/users/me/provider-accounts")
    @ResponseStatus(HttpStatus.CREATED)
    public PlatformDtos.ProviderAccountResponse createProviderAccount(@AuthenticationPrincipal AuthenticatedUser user,
                                                                     @Valid @RequestBody PlatformDtos.CreateProviderAccountRequest request) {
        return platformAuthorizationService.createProviderAccount(user.id(), request);
    }

    @GetMapping("/v1/users/me/provider-accounts/{providerPublicId}")
    public PlatformDtos.ProviderAccountResponse providerAccount(@AuthenticationPrincipal AuthenticatedUser user,
                                                               @PathVariable @Pattern(regexp = UUID_PATTERN) String providerPublicId) {
        return platformAuthorizationService.myProviderAccount(user.id(), providerPublicId);
    }

    @PostMapping("/v1/users/me/provider-accounts/{providerPublicId}/modules/{moduleCode}/enroll")
    public PlatformDtos.ProviderAccountResponse enrollProviderModule(@AuthenticationPrincipal AuthenticatedUser user,
                                                                    @PathVariable @Pattern(regexp = UUID_PATTERN) String providerPublicId,
                                                                    @PathVariable @Pattern(regexp = UPPER_CODE_PATTERN) String moduleCode) {
        return platformAuthorizationService.enrollProviderModule(user.id(), providerPublicId, moduleCode);
    }

    @GetMapping("/v1/users/me/provider-accounts/{providerPublicId}/modules")
    public List<PlatformDtos.ProviderEnrollmentResponse> providerModules(@AuthenticationPrincipal AuthenticatedUser user,
                                                                        @PathVariable @Pattern(regexp = UUID_PATTERN) String providerPublicId) {
        return platformAuthorizationService.providerModules(user.id(), providerPublicId);
    }

    @GetMapping("/v1/admin/modules")
    public List<PlatformDtos.ModuleResponse> adminModules() {
        return platformAuthorizationService.adminModules();
    }

    @PostMapping("/v1/admin/modules")
    @ResponseStatus(HttpStatus.CREATED)
    public PlatformDtos.ModuleResponse createModule(@Valid @RequestBody PlatformDtos.ModuleUpsertRequest request) {
        return platformAuthorizationService.upsertModule(request);
    }

    @PutMapping("/v1/admin/modules/{moduleCode}")
    public PlatformDtos.ModuleResponse updateModule(@PathVariable @Pattern(regexp = UPPER_CODE_PATTERN) String moduleCode,
                                                   @Valid @RequestBody PlatformDtos.ModuleUpsertRequest request) {
        if (!moduleCode.equals(request.moduleCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Path module code must match request module code");
        }
        return platformAuthorizationService.upsertModule(request);
    }

    @GetMapping("/v1/admin/providers/pending")
    public List<PlatformDtos.ProviderAccountResponse> pendingProviders() {
        return platformAuthorizationService.pendingProviders();
    }

    @GetMapping("/v1/admin/providers/{providerPublicId}")
    public PlatformDtos.ProviderAccountResponse adminProvider(@PathVariable @Pattern(regexp = UUID_PATTERN) String providerPublicId) {
        return platformAuthorizationService.adminProvider(providerPublicId);
    }

    @PutMapping("/v1/admin/providers/{providerPublicId}/modules/{moduleCode}/status")
    public PlatformDtos.ProviderAccountResponse updateProviderModuleStatus(@AuthenticationPrincipal AuthenticatedUser actor,
                                                                          @PathVariable @Pattern(regexp = UUID_PATTERN) String providerPublicId,
                                                                          @PathVariable @Pattern(regexp = UPPER_CODE_PATTERN) String moduleCode,
                                                                          @Valid @RequestBody PlatformDtos.ProviderStatusUpdateRequest request) {
        return platformAuthorizationService.updateProviderModuleStatus(actor.id(), providerPublicId, moduleCode, request);
    }

    @GetMapping("/v1/admin/supported-countries")
    public List<PlatformDtos.SupportedCountryResponse> supportedCountries() {
        return platformAuthorizationService.supportedCountries();
    }

    @PutMapping("/v1/admin/supported-countries/{countryCode}")
    public PlatformDtos.SupportedCountryResponse updateSupportedCountry(
            @PathVariable @Pattern(regexp = "[A-Z]{3}") String countryCode,
            @Valid @RequestBody PlatformDtos.SupportedCountryUpdateRequest request) {
        return platformAuthorizationService.updateSupportedCountry(countryCode, request);
    }

    @PutMapping("/v1/admin/supported-countries/{countryCode}/modules/{moduleCode}")
    public AuthDtos.MessageResponse updateModuleCountry(@PathVariable @Pattern(regexp = "[A-Z]{3}") String countryCode,
                                                        @PathVariable @Pattern(regexp = UPPER_CODE_PATTERN) String moduleCode,
                                                        @Valid @RequestBody PlatformDtos.ModuleCountryUpdateRequest request) {
        platformAuthorizationService.updateModuleCountry(countryCode, moduleCode, request);
        return new AuthDtos.MessageResponse("Module country configuration updated");
    }

    @PostMapping("/v1/admin/users/{publicId}/restrictions")
    @ResponseStatus(HttpStatus.CREATED)
    public PlatformDtos.RestrictionResponse addRestriction(@AuthenticationPrincipal AuthenticatedUser actor,
                                                          @PathVariable @Pattern(regexp = UUID_PATTERN) String publicId,
                                                          @Valid @RequestBody PlatformDtos.RestrictionRequest request) {
        return platformAuthorizationService.addRestriction(actor.id(), publicId, request);
    }

    @DeleteMapping("/v1/admin/users/{publicId}/restrictions/{restrictionId}")
    public AuthDtos.MessageResponse deleteRestriction(@AuthenticationPrincipal AuthenticatedUser actor,
                                                      @PathVariable @Pattern(regexp = UUID_PATTERN) String publicId,
                                                      @PathVariable Long restrictionId) {
        platformAuthorizationService.revokeRestriction(actor.id(), publicId, restrictionId);
        return new AuthDtos.MessageResponse("Restriction revoked");
    }

    @GetMapping("/internal/api/v1/providers/{providerPublicId}/modules/{moduleCode}/eligibility")
    public PlatformDtos.ProviderEligibilityResponse providerEligibility(
            @RequestHeader(name = "X-Internal-Service-Token", required = false) String token,
            @PathVariable @Pattern(regexp = UUID_PATTERN) String providerPublicId,
            @PathVariable @Pattern(regexp = UPPER_CODE_PATTERN) String moduleCode) {
        verifyInternalToken(token);
        return platformAuthorizationService.providerEligibility(providerPublicId, moduleCode);
    }

    @GetMapping("/internal/api/v1/users/{userPublicId}/restrictions/active")
    public PlatformDtos.ActiveRestrictionsResponse activeRestrictions(
            @RequestHeader(name = "X-Internal-Service-Token", required = false) String token,
            @PathVariable @Pattern(regexp = UUID_PATTERN) String userPublicId) {
        verifyInternalToken(token);
        return platformAuthorizationService.activeRestrictions(userPublicId);
    }

    private void verifyInternalToken(String token) {
        if (internalServiceToken == null || internalServiceToken.isBlank()
                || token == null || !internalServiceToken.equals(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Valid internal service token is required");
        }
    }
}
