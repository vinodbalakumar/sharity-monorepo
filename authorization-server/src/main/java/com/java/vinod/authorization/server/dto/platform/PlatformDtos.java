package com.java.vinod.authorization.server.dto.platform;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public final class PlatformDtos {
    private PlatformDtos() {
    }

    public record ModuleResponse(
            String moduleCode,
            String moduleName,
            String description,
            String moduleType,
            String iconKey,
            int displayOrder,
            boolean customerAccessEnabled,
            boolean providerAccessEnabled,
            boolean requiresProviderApproval,
            String status,
            String frontendRoute,
            String apiAudience,
            boolean availableToCustomer,
            boolean providerAccessActive
    ) {
    }

    public record CapabilityResponse(
            boolean customer,
            boolean hasProviderAccess,
            List<String> roles,
            List<ProviderModuleAccessResponse> providerModules
    ) {
    }

    public record ProviderModuleAccessResponse(
            String providerPublicId,
            String moduleCode,
            String accessType,
            String accessStatus
    ) {
    }

    public record ProviderAccountResponse(
            String publicId,
            String displayName,
            String providerType,
            String sellerScope,
            String countryCode,
            String defaultCurrencyCode,
            String verificationStatus,
            String overallStatus,
            boolean payoutsEnabled,
            boolean chargesEnabled,
            List<ProviderEnrollmentResponse> enrollments
    ) {
    }

    public record ProviderEnrollmentResponse(
            String moduleCode,
            String moduleName,
            String enrollmentStatus,
            boolean sellingEnabled,
            boolean serviceEnabled,
            boolean payoutEligible,
            String disabledReason
    ) {
    }

    public record CreateProviderAccountRequest(
            @NotBlank @Size(max = 150) String displayName,
            @NotBlank @Pattern(regexp = "INDIVIDUAL|BUSINESS|LICENSED_BUSINESS|DELIVERY_PARTNER") String providerType,
            @NotBlank @Pattern(regexp = "GLOBAL|NATIONAL") String sellerScope,
            @NotBlank @Pattern(regexp = "[A-Z]{3}") String countryCode,
            @NotBlank @Pattern(regexp = "[A-Z]{3}") String defaultCurrencyCode
    ) {
    }

    public record ModuleUpsertRequest(
            @NotBlank @Pattern(regexp = "[A-Z0-9_]{2,50}") String moduleCode,
            @NotBlank @Size(max = 100) String moduleName,
            @Size(max = 255) String description,
            @NotBlank @Size(max = 40) String moduleType,
            @Size(max = 100) String iconKey,
            int displayOrder,
            boolean customerAccessEnabled,
            boolean providerAccessEnabled,
            boolean requiresProviderApproval,
            @NotBlank @Pattern(regexp = "ACTIVE|INACTIVE|COMING_SOON|SUSPENDED") String status,
            @Size(max = 255) String frontendRoute,
            @Size(max = 100) String apiAudience
    ) {
    }

    public record SupportedCountryResponse(
            String countryCode,
            String countryName,
            String defaultCurrencyCode,
            String phoneDialCode,
            boolean registrationEnabled,
            boolean purchasingEnabled,
            boolean providerOnboardingEnabled,
            boolean payoutEnabled,
            String status
    ) {
    }

    public record SupportedCountryUpdateRequest(
            @NotBlank @Size(max = 100) String countryName,
            @NotBlank @Pattern(regexp = "[A-Z]{3}") String defaultCurrencyCode,
            @NotBlank @Size(max = 10) String phoneDialCode,
            boolean registrationEnabled,
            boolean purchasingEnabled,
            boolean providerOnboardingEnabled,
            boolean payoutEnabled,
            @NotBlank @Pattern(regexp = "ACTIVE|INACTIVE|SUSPENDED") String status
    ) {
    }

    public record ModuleCountryUpdateRequest(
            boolean customerEnabled,
            boolean providerOnboardingEnabled,
            boolean payoutEnabled,
            @Size(max = 255) String disabledReason
    ) {
    }

    public record ProviderStatusUpdateRequest(
            @NotBlank @Pattern(regexp = "NOT_STARTED|APPLICATION_SUBMITTED|UNDER_REVIEW|ADDITIONAL_INFO_REQUIRED|APPROVED|RESTRICTED|SUSPENDED|REJECTED|CLOSED") String enrollmentStatus,
            boolean sellingEnabled,
            boolean serviceEnabled,
            boolean payoutEligible,
            @Size(max = 255) String disabledReason
    ) {
    }

    public record RestrictionRequest(
            @NotBlank @Pattern(regexp = "LOGIN_BLOCKED|PURCHASING_BLOCKED|PROVIDER_ACCESS_BLOCKED|PAYOUT_BLOCKED|MESSAGING_BLOCKED|ACCOUNT_SUSPENDED|MODULE_ACCESS_BLOCKED") String restrictionType,
            @Pattern(regexp = "[A-Z0-9_]{2,50}") String moduleCode,
            @Pattern(regexp = "[0-9a-fA-F-]{36}") String providerPublicId,
            @Size(max = 255) String reason,
            LocalDateTime expiresAt
    ) {
    }

    public record RestrictionResponse(
            Long id,
            String publicId,
            String userPublicId,
            String moduleCode,
            String providerPublicId,
            String restrictionType,
            String reason,
            LocalDateTime createdAt,
            LocalDateTime expiresAt,
            LocalDateTime revokedAt
    ) {
    }

    public record ProviderEligibilityResponse(
            boolean eligible,
            String providerPublicId,
            String moduleCode,
            String providerStatus,
            String enrollmentStatus,
            boolean sellingEnabled,
            boolean payoutEligible,
            boolean restricted
    ) {
    }

    public record InternalProviderAccountResponse(
            String publicId,
            String ownerUserPublicId,
            String displayName,
            String sellerScope,
            String countryCode,
            String defaultCurrencyCode,
            String verificationStatus,
            String overallStatus,
            boolean payoutsEnabled,
            boolean chargesEnabled
    ) {
    }

    public record ActiveRestrictionsResponse(
            String userPublicId,
            List<RestrictionResponse> restrictions
    ) {
    }
}
