package com.java.vinod.platform.web.bff.dto;

import java.util.List;

public final class PublicContentDtos {
    private PublicContentDtos() {
    }

    public record VisitorContextResponse(
            String countryCode,
            String countryName,
            String detectionSource,
            boolean countrySupported,
            String locale,
            List<String> availablePolicyCodes
    ) {
    }

    public record PublicContentPageResponse(
            String slug,
            String title,
            String category,
            String countryCode,
            String locale,
            String version,
            String effectiveDate,
            String lastReviewedAt,
            List<ContentSection> sections
    ) {
    }

    public record PublicLegalPolicyResponse(
            String policyCode,
            String title,
            String countryCode,
            String locale,
            String version,
            String effectiveDate,
            String lastReviewedAt,
            List<ContentSection> sections
    ) {
    }

    public record ContentSection(String heading, List<String> paragraphs) {
    }
}
