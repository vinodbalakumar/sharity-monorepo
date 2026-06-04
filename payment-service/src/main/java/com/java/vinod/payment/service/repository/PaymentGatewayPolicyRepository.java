package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.PaymentGatewayPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentGatewayPolicyRepository extends JpaRepository<PaymentGatewayPolicy, Long> {
    Optional<PaymentGatewayPolicy> findByCountryCodeIgnoreCase(String countryCode);

    List<PaymentGatewayPolicy> findAllByOrderByCountryCodeAsc();
}
