package com.java.vinod.payment.service.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dispute_evidence", indexes = {
    @Index(name = "idx_evidence_dispute_id", columnList = "dispute_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisputeEvidence {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "evidence_id", unique = true, length = 50)
    private String evidenceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispute_id", nullable = false)
    private Dispute dispute;

    @Column(name = "evidence_type", nullable = false, length = 50)
    private String evidenceType; // SCREENSHOT, RECEIPT, EMAIL, MESSAGE, OTHER

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "uploaded_by", length = 100)
    private String uploadedBy; // CUSTOMER or MERCHANT

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }
}
