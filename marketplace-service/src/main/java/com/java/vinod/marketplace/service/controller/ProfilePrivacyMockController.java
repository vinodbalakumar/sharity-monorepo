package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.ProfilePrivacyDtos;
import com.java.vinod.marketplace.service.dto.ProfilePersonalInfoDtos;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Stateless mocked Profile & Privacy API for STORY-033.
 */
@RestController
@RequestMapping("/api/profile")
public class ProfilePrivacyMockController {

    @GetMapping
    public ProfilePersonalInfoDtos.ProfileDashboardResponse profileDashboard() {
        return ProfilePersonalInfoDtos.dashboard();
    }

    @GetMapping({"/personal-info", "/edit"})
    public ProfilePersonalInfoDtos.ProfileDashboardResponse personalInfo() {
        return ProfilePersonalInfoDtos.dashboard();
    }

    @PatchMapping("/display-name")
    public ProfilePersonalInfoDtos.ProfileActionResponse updateDisplayName(@RequestBody(required = false) Object request) {
        return ProfilePersonalInfoDtos.action("OK", "Display name saved. Review may be required for seller-facing names.");
    }

    @GetMapping("/alias")
    public ProfilePersonalInfoDtos.PublicDisplayInfo alias() {
        return ProfilePersonalInfoDtos.publicDisplay();
    }

    @GetMapping("/email")
    public ProfilePersonalInfoDtos.ContactInfo email() {
        return ProfilePersonalInfoDtos.contactInfo();
    }

    @PostMapping("/email/change/start")
    public ProfilePersonalInfoDtos.ProfileActionResponse startEmailChange(@RequestBody(required = false) Object request) {
        return new ProfilePersonalInfoDtos.ProfileActionResponse(true, "VERIFICATION_REQUIRED",
                "Email change started. Verification is required.", false, true, true, java.time.LocalDateTime.now());
    }

    @PostMapping("/email/change/confirm")
    public ProfilePersonalInfoDtos.ProfileActionResponse confirmEmailChange(@RequestBody(required = false) Object request) {
        return ProfilePersonalInfoDtos.action("OK", "Email change confirmed.");
    }

    @GetMapping("/phone")
    public ProfilePersonalInfoDtos.ContactInfo phone() {
        return ProfilePersonalInfoDtos.contactInfo();
    }

    @PostMapping("/phone/change/start")
    public ProfilePersonalInfoDtos.ProfileActionResponse startPhoneChange(@RequestBody(required = false) Object request) {
        return new ProfilePersonalInfoDtos.ProfileActionResponse(true, "VERIFICATION_REQUIRED",
                "Phone change started. Verification is required.", false, true, true, java.time.LocalDateTime.now());
    }

    @PostMapping("/phone/change/confirm")
    public ProfilePersonalInfoDtos.ProfileActionResponse confirmPhoneChange(@RequestBody(required = false) Object request) {
        return ProfilePersonalInfoDtos.action("OK", "Phone change confirmed.");
    }

    @GetMapping("/country")
    public ProfilePersonalInfoDtos.CountryRegionInfo country() {
        return ProfilePersonalInfoDtos.country();
    }

    @PostMapping("/country/change/preview")
    public ProfilePersonalInfoDtos.CountryChangeImpactPreviewResponse countryChangePreview(
            @RequestBody(required = false) ProfilePersonalInfoDtos.CountryChangePreviewRequest request) {
        return ProfilePersonalInfoDtos.countryPreview();
    }

    @PostMapping("/country/change")
    public ProfilePersonalInfoDtos.SubmitCountryChangeResponse submitCountryChange(
            @RequestBody(required = false) ProfilePersonalInfoDtos.SubmitCountryChangeRequest request) {
        return ProfilePersonalInfoDtos.submittedCountryChange();
    }

    @GetMapping("/country/change/status")
    public ProfilePersonalInfoDtos.SubmitCountryChangeResponse countryChangeStatus() {
        return ProfilePersonalInfoDtos.submittedCountryChange();
    }

    @DeleteMapping("/photo")
    public ProfilePersonalInfoDtos.ProfileActionResponse removeProfilePhoto() {
        return ProfilePersonalInfoDtos.action("OK", "Profile photo removed.");
    }

    @GetMapping("/completion-checklist")
    public List<ProfilePersonalInfoDtos.ProfileCompletionChecklistItem> completion() {
        return ProfilePersonalInfoDtos.completion();
    }

    @GetMapping("/privacy-summary")
    public ProfilePersonalInfoDtos.ProfilePrivacySummary privacySummary() {
        return ProfilePersonalInfoDtos.privacy();
    }

    @GetMapping("/change-timeline")
    public List<ProfilePersonalInfoDtos.ProfileChangeTimelineEvent> changeTimeline() {
        return ProfilePersonalInfoDtos.timeline();
    }

    @PatchMapping("/seller-display-name")
    public ProfilePersonalInfoDtos.ProfileActionResponse updateSellerDisplayName(@RequestBody(required = false) Object request) {
        return new ProfilePersonalInfoDtos.ProfileActionResponse(true, "MODERATION_REQUIRED",
                "Seller display name saved and queued for moderation.", true, false, true, java.time.LocalDateTime.now());
    }

    @GetMapping("/privacy")
    public ProfilePrivacyDtos.ProfilePrivacySettingsResponse profilePrivacy() {
        return ProfilePrivacyDtos.mockSettings();
    }

    @PatchMapping
    public ProfilePrivacyDtos.ProfileActionResponse updateProfile(@RequestBody(required = false) Object request) {
        return ok("Profile settings saved.");
    }

    @PatchMapping("/buyer-alias")
    public ProfilePrivacyDtos.ProfileActionResponse updateBuyerAlias(
            @RequestBody ProfilePrivacyDtos.AliasUpdateRequest request) {
        if (request.alias().toLowerCase().contains("taken")) {
            return new ProfilePrivacyDtos.ProfileActionResponse("BUYER_ALIAS_UNAVAILABLE",
                    "This buyer alias is not available. Try another one.", ProfilePrivacyDtos.mockSettings());
        }
        return ok("Buyer alias saved.");
    }

    @PatchMapping("/seller-alias")
    public ProfilePrivacyDtos.ProfileActionResponse updateSellerAlias(
            @RequestBody ProfilePrivacyDtos.AliasUpdateRequest request) {
        if (request.alias().toLowerCase().contains("review")) {
            return new ProfilePrivacyDtos.ProfileActionResponse("STORE_NAME_REVIEW_REQUIRED",
                    "This seller alias change requires review before it appears publicly.",
                    ProfilePrivacyDtos.mockSettings());
        }
        return ok("Seller alias saved.");
    }

    @PatchMapping("/store-name")
    public ProfilePrivacyDtos.ProfileActionResponse updateStoreName(
            @RequestBody ProfilePrivacyDtos.StoreNameUpdateRequest request) {
        return ok("Store name saved.");
    }

    @GetMapping("/aliases/check")
    public ProfilePrivacyDtos.AliasCheckResponse checkAlias(@RequestParam String aliasType,
                                                           @RequestParam String alias) {
        boolean available = !alias.toLowerCase().contains("taken");
        return new ProfilePrivacyDtos.AliasCheckResponse(aliasType, alias, available,
                available ? "AVAILABLE" : aliasType.toUpperCase() + "_ALIAS_UNAVAILABLE");
    }

    @PostMapping("/photo")
    public ProfilePrivacyDtos.ProfileActionResponse uploadPhoto(
            @RequestBody(required = false) ProfilePrivacyDtos.PhotoUploadRequest request) {
        return ok("Profile photo uploaded.");
    }

    @PatchMapping("/privacy")
    public ProfilePrivacyDtos.ProfileActionResponse updatePrivacy(@RequestBody(required = false) Object request) {
        return ok("Privacy settings saved. Real name remains hidden unless explicitly confirmed.");
    }

    @PatchMapping("/message-privacy")
    public ProfilePrivacyDtos.ProfileActionResponse updateMessagePrivacy(@RequestBody(required = false) Object request) {
        return ok("Message privacy settings saved.");
    }

    @GetMapping("/blocked-users")
    public List<ProfilePrivacyDtos.BlockedUserItem> blockedUsers() {
        return ProfilePrivacyDtos.mockBlockedUsers();
    }

    @PostMapping("/blocked-users")
    public ProfilePrivacyDtos.ProfileActionResponse blockUser(@RequestBody(required = false) Object request) {
        return ok("User blocked. Required order, refund, dispute, and admin messages remain available.");
    }

    @DeleteMapping("/blocked-users/{blockedUserId}")
    public ProfilePrivacyDtos.ProfileActionResponse unblockUser(@PathVariable String blockedUserId) {
        return ok("Blocked user " + blockedUserId + " unblocked.");
    }

    @PostMapping("/reports")
    public ProfilePrivacyDtos.ProfileActionResponse reportUser(
            @RequestBody ProfilePrivacyDtos.ReportUserRequest request) {
        return ok("Report submitted for moderation review.");
    }

    @GetMapping("/verification-badges")
    public List<ProfilePrivacyDtos.VerificationBadgeItem> verificationBadges() {
        return ProfilePrivacyDtos.mockBadges();
    }

    @PostMapping("/data-export")
    public ProfilePrivacyDtos.DataExportStatus requestDataExport() {
        return ProfilePrivacyDtos.requestedDataExport();
    }

    @GetMapping("/data-export")
    public ProfilePrivacyDtos.DataExportStatus dataExportStatus() {
        return ProfilePrivacyDtos.mockSettings().dataExportStatus();
    }

    @GetMapping("/delete-account/eligibility")
    public ProfilePrivacyDtos.DeleteAccountEligibility deleteAccountEligibility(
            @RequestParam(defaultValue = "false") boolean eligibleMock) {
        return eligibleMock ? ProfilePrivacyDtos.eligibleDeleteEligibility() : ProfilePrivacyDtos.blockedDeleteEligibility();
    }

    @PostMapping("/delete-account")
    public ProfilePrivacyDtos.ProfileActionResponse requestDeleteAccount(
            @RequestBody ProfilePrivacyDtos.DeleteAccountRequest request) {
        if (!"DELETE MY ACCOUNT".equals(request.typedConfirmation())) {
            return new ProfilePrivacyDtos.ProfileActionResponse("DELETE_ACCOUNT_CONFIRMATION_INVALID",
                    "Typed confirmation must match DELETE MY ACCOUNT.", ProfilePrivacyDtos.mockSettings());
        }
        return new ProfilePrivacyDtos.ProfileActionResponse("DELETE_ACCOUNT_NOT_ELIGIBLE",
                "Your account cannot be deleted yet because active marketplace obligations remain.",
                ProfilePrivacyDtos.mockSettings());
    }

    private ProfilePrivacyDtos.ProfileActionResponse ok(String message) {
        return new ProfilePrivacyDtos.ProfileActionResponse("OK", message, ProfilePrivacyDtos.mockSettings());
    }
}
