package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.PaymentWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentWebhookEventRepository extends JpaRepository<PaymentWebhookEvent, Long> {
    boolean existsByProviderEventId(String providerEventId);
}
