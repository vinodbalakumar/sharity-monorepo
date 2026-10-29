package com.java.vinod.wallet.service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "wallet_event_inbox")
public class WalletEventInbox {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "source_service", nullable = false, length = 40)
    private String sourceService;
    @Column(name = "source_event_id", nullable = false, unique = true, length = 100)
    private String sourceEventId;
    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload_json", nullable = false, columnDefinition = "JSON")
    private String payloadJson;
    @Column(name = "processing_status", nullable = false, length = 30)
    private String processingStatus;
    @Column(name = "received_at", nullable = false)
    private LocalDateTime receivedAt;
    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}
