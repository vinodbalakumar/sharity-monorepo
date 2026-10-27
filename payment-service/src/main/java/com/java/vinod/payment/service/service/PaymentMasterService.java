package com.java.vinod.payment.service.service;

import com.java.vinod.payment.service.dto.PaymentDtos;
import com.java.vinod.payment.service.entity.DisputeReasonMaster;
import com.java.vinod.payment.service.entity.OrderStatusMaster;
import com.java.vinod.payment.service.entity.PaymentMethodMaster;
import com.java.vinod.payment.service.entity.PaymentStatusMaster;
import com.java.vinod.payment.service.entity.RefundReasonMaster;
import com.java.vinod.payment.service.repository.DisputeReasonMasterRepository;
import com.java.vinod.payment.service.repository.OrderStatusMasterRepository;
import com.java.vinod.payment.service.repository.PaymentMethodMasterRepository;
import com.java.vinod.payment.service.repository.PaymentStatusMasterRepository;
import com.java.vinod.payment.service.repository.RefundReasonMasterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PaymentMasterService {
    private final OrderStatusMasterRepository orderStatusMasterRepository;
    private final PaymentStatusMasterRepository paymentStatusMasterRepository;
    private final PaymentMethodMasterRepository paymentMethodMasterRepository;
    private final RefundReasonMasterRepository refundReasonMasterRepository;
    private final DisputeReasonMasterRepository disputeReasonMasterRepository;

    public PaymentMasterService(OrderStatusMasterRepository orderStatusMasterRepository,
                                PaymentStatusMasterRepository paymentStatusMasterRepository,
                                PaymentMethodMasterRepository paymentMethodMasterRepository,
                                RefundReasonMasterRepository refundReasonMasterRepository,
                                DisputeReasonMasterRepository disputeReasonMasterRepository) {
        this.orderStatusMasterRepository = orderStatusMasterRepository;
        this.paymentStatusMasterRepository = paymentStatusMasterRepository;
        this.paymentMethodMasterRepository = paymentMethodMasterRepository;
        this.refundReasonMasterRepository = refundReasonMasterRepository;
        this.disputeReasonMasterRepository = disputeReasonMasterRepository;
    }

    @Transactional(readOnly = true)
    public List<PaymentDtos.StatusResponse> orderStatuses() {
        return orderStatusMasterRepository.findByActiveTrueOrderBySortOrderAscDisplayLabelAsc().stream()
                .map(this::toStatus)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentDtos.StatusResponse> paymentStatuses() {
        return paymentStatusMasterRepository.findByActiveTrueOrderBySortOrderAscDisplayLabelAsc().stream()
                .map(this::toStatus)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentDtos.PaymentMethodResponse> paymentMethods() {
        return paymentMethodMasterRepository.findByActiveTrueOrderBySortOrderAscDisplayLabelAsc().stream()
                .map(this::toPaymentMethod)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentDtos.ReasonResponse> refundReasons() {
        return refundReasonMasterRepository.findByActiveTrueOrderBySortOrderAscDisplayLabelAsc().stream()
                .map(this::toReason)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentDtos.ReasonResponse> disputeReasons() {
        return disputeReasonMasterRepository.findByActiveTrueOrderBySortOrderAscDisplayLabelAsc().stream()
                .map(this::toReason)
                .toList();
    }

    private PaymentDtos.StatusResponse toStatus(OrderStatusMaster value) {
        return new PaymentDtos.StatusResponse(value.getStatusCode(), value.getDisplayLabel(), value.getDescription(),
                value.isCustomerVisible(), value.isActive(), value.getSortOrder());
    }

    private PaymentDtos.StatusResponse toStatus(PaymentStatusMaster value) {
        return new PaymentDtos.StatusResponse(value.getStatusCode(), value.getDisplayLabel(), value.getDescription(),
                value.isCustomerVisible(), value.isActive(), value.getSortOrder());
    }

    private PaymentDtos.PaymentMethodResponse toPaymentMethod(PaymentMethodMaster value) {
        return new PaymentDtos.PaymentMethodResponse(value.getMethodCode(), value.getDisplayLabel(), value.getDescription(),
                value.isActive(), value.getSortOrder());
    }

    private PaymentDtos.ReasonResponse toReason(RefundReasonMaster value) {
        return new PaymentDtos.ReasonResponse(value.getReasonCode(), value.getDisplayLabel(), value.getDescription(),
                value.isActive(), value.getSortOrder());
    }

    private PaymentDtos.ReasonResponse toReason(DisputeReasonMaster value) {
        return new PaymentDtos.ReasonResponse(value.getReasonCode(), value.getDisplayLabel(), value.getDescription(),
                value.isActive(), value.getSortOrder());
    }
}
