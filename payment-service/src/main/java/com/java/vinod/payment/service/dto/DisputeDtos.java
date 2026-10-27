package com.java.vinod.payment.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class DisputeDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateDisputeRequest {
        @NotBlank(message = "Order ID required")
        private String orderId;

        @NotBlank(message = "Dispute reason required")
        private String disputeReason;

        @NotBlank(message = "Dispute description required")
        private String disputeDescription;

        @NotNull(message = "Claimed amount required")
        @Positive(message = "Claimed amount must be positive")
        private BigDecimal claimedAmount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DisputeResponse {
        private String disputeId;
        private String orderId;
        private String disputeStatus;
        private String resolutionStatus;
        private BigDecimal claimedAmount;
        private BigDecimal refundedAmount;
        private Integer evidenceCount;
        private LocalDateTime createdAt;
        private LocalDateTime resolvedAt;
        private List<DisputeEventResponse> timeline;
        private List<DisputeEvidenceResponse> evidence;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UploadEvidenceRequest {
        @NotBlank(message = "File URL required")
        private String fileUrl;

        @NotBlank(message = "Evidence type required")
        private String evidenceType; // SCREENSHOT, RECEIPT, EMAIL, MESSAGE, OTHER

        private String fileName;
        private Long fileSize;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DisputeEvidenceResponse {
        private String evidenceId;
        private String evidenceType;
        private String fileUrl;
        private String description;
        private String uploadedBy;
        private LocalDateTime uploadedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DisputeEventResponse {
        private String eventId;
        private String eventType;
        private String eventDescription;
        private String actor;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResolveDisputeRequest {
        @NotBlank(message = "Resolution status required")
        private String resolutionStatus; // WON, LOST, SETTLED

        private BigDecimal refundAmount;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DisputeStatusResponse {
        private String disputeId;
        private String status;
        private String message;
        private LocalDateTime timestamp;
    }
}
