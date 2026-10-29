package com.java.vinod.payment.service.repository;

import com.java.vinod.payment.service.entity.CheckoutPayment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CheckoutPaymentRepository extends JpaRepository<CheckoutPayment, Long> {
    Optional<CheckoutPayment> findByCheckoutPublicId(String checkoutPublicId);

    boolean existsByCheckoutPublicId(String checkoutPublicId);

    boolean existsByPaymentOrder_Id(Long paymentOrderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CheckoutPayment c where c.checkoutPublicId = :checkoutPublicId")
    Optional<CheckoutPayment> findForUpdateByCheckoutPublicId(@Param("checkoutPublicId") String checkoutPublicId);
}
