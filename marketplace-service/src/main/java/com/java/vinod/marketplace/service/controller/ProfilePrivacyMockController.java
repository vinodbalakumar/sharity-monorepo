package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.ProfilePrivacyDtos;
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
