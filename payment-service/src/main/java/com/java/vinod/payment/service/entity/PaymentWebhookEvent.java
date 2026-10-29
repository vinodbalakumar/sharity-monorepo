package com.java.vinod.payment.service.entity;

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
@Table(name = "payment_webhook_event")
public class PaymentWebhookEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "payment_provider", nullable = false, length = 50)
    private String paymentProvider;
    @Column(name = "provider_event_id", nullable = false, unique = true)
    private String providerEventId;
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
    @Column(name = "failure_message")
    private String failureMessage;
}
