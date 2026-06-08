package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DisputeRepository extends JpaRepository<Dispute, Long> {
    Optional<Dispute> findByDisputeId(String disputeId);

    Optional<Dispute> findByOrderId(String orderId);

    List<Dispute> findByCustomerId(String customerId);

    List<Dispute> findByCustomerIdAndDisputeStatus(String customerId, String disputeStatus);

    List<Dispute> findByMerchantId(String merchantId);

    List<Dispute> findByMerchantIdAndDisputeStatus(String merchantId, String disputeStatus);

    @Query("SELECT d FROM Dispute d WHERE d.disputeStatus IN ('OPENED', 'EVIDENCE_SUBMITTED') ORDER BY d.createdAt ASC")
    List<Dispute> findOpenDisputes();

    @Query("SELECT d FROM Dispute d WHERE d.disputeStatus NOT IN :statuses ORDER BY d.createdAt ASC")
    List<Dispute> findByDisputeStatusNotIn(@Param("statuses") List<String> statuses);

    List<Dispute> findByEscalatedOrderByEscalatedAtAsc(boolean escalated);

    @Query("SELECT COUNT(d) FROM Dispute d WHERE d.customerId = :customerId AND d.resolutionStatus = 'WON'")
    long countWonDisputesForCustomer(@Param("customerId") String customerId);
}
