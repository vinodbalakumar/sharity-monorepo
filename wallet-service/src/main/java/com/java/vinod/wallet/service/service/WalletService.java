package com.java.vinod.wallet.service.service;

import com.java.vinod.wallet.service.dto.WalletDtos;
import com.java.vinod.wallet.service.entity.WalletAccount;
import com.java.vinod.wallet.service.entity.WalletBalanceSnapshot;
import com.java.vinod.wallet.service.entity.WalletEventInbox;
import com.java.vinod.wallet.service.entity.WalletLedgerEntry;
import com.java.vinod.wallet.service.repository.WalletAccountRepository;
import com.java.vinod.wallet.service.repository.WalletBalanceSnapshotRepository;
import com.java.vinod.wallet.service.repository.WalletEventInboxRepository;
import com.java.vinod.wallet.service.repository.WalletLedgerEntryRepository;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Maintains wallet ledger projections from payment events without moving money.
 */
@Service
public class WalletService {
    private static final Logger log = LoggerFactory.getLogger(WalletService.class);
    private final WalletAccountRepository walletAccountRepository;
    private final WalletLedgerEntryRepository walletLedgerEntryRepository;
    private final WalletBalanceSnapshotRepository walletBalanceSnapshotRepository;
    private final WalletEventInboxRepository walletEventInboxRepository;

    /**
     * Creates the wallet service with ledger, account, snapshot, and inbox repositories.
     */
    public WalletService(WalletAccountRepository walletAccountRepository,
                         WalletLedgerEntryRepository walletLedgerEntryRepository,
                         WalletBalanceSnapshotRepository walletBalanceSnapshotRepository,
                         WalletEventInboxRepository walletEventInboxRepository) {
        this.walletAccountRepository = walletAccountRepository;
        this.walletLedgerEntryRepository = walletLedgerEntryRepository;
        this.walletBalanceSnapshotRepository = walletBalanceSnapshotRepository;
        this.walletEventInboxRepository = walletEventInboxRepository;
    }

    /**
     * Returns the authenticated customer's balance snapshot.
     */
    @Transactional(readOnly = true)
    public WalletDtos.SummaryResponse customerSummary(Jwt jwt) {
        return summary("CUSTOMER", userPublicId(jwt), "USD");
    }

    /**
     * Returns the authenticated customer's ledger activity.
     */
    @Transactional(readOnly = true)
    public List<WalletDtos.ActivityResponse> customerActivity(Jwt jwt) {
        return activity("CUSTOMER", userPublicId(jwt));
    }

    /**
     * Returns a provider account balance snapshot.
     */
    @Transactional(readOnly = true)
    public WalletDtos.SummaryResponse providerSummary(String providerPublicId) {
        return summary("PROVIDER_ACCOUNT", providerPublicId, "USD");
    }

    /**
     * Returns provider account ledger activity.
     */
    @Transactional(readOnly = true)
    public List<WalletDtos.ActivityResponse> providerActivity(String providerPublicId) {
        return activity("PROVIDER_ACCOUNT", providerPublicId);
    }

    /**
     * Stores an incoming payment event once and projects it into ledger entries.
     */
    @Transactional
    public WalletDtos.MessageResponse ingest(String eventType, WalletDtos.PaymentEventRequest request) {
        if (walletEventInboxRepository.existsBySourceEventId(request.sourceEventId())) {
            log.info("Duplicate wallet event ignored: sourceEventId={}, eventType={}, ownerPublicId={}",
                    request.sourceEventId(), eventType, request.ownerPublicId());
            return new WalletDtos.MessageResponse("Duplicate event ignored");
        }
        LocalDateTime now = LocalDateTime.now();
        WalletEventInbox inbox = new WalletEventInbox();
        inbox.setSourceService("PAYMENT");
        inbox.setSourceEventId(request.sourceEventId());
        inbox.setEventType(eventType);
        inbox.setPayloadJson("{}");
        inbox.setProcessingStatus("PROCESSED");
        inbox.setReceivedAt(now);
        inbox.setProcessedAt(now);
        walletEventInboxRepository.save(inbox);

        String ownerType = eventType.startsWith("PAYMENT") || eventType.startsWith("REFUND") ? "CUSTOMER" : "PROVIDER_ACCOUNT";
        String entryType = switch (eventType) {
            case "PAYMENT_CAPTURED" -> "CUSTOMER_PAYMENT";
            case "PROVIDER_PENDING_EARNING" -> "PROVIDER_PENDING_EARNING";
            case "PAYOUT_ELIGIBLE" -> "PROVIDER_AVAILABLE_EARNING";
            case "PAYOUT_PAID" -> "PROVIDER_PAYOUT";
            case "REFUND_COMPLETED" -> "CUSTOMER_REFUND";
            default -> eventType;
        };
        String direction = switch (entryType) {
            case "CUSTOMER_REFUND", "PROVIDER_PENDING_EARNING", "PROVIDER_AVAILABLE_EARNING" -> "CREDIT";
            default -> "DEBIT";
        };
        WalletAccount account = account(ownerType, request.ownerPublicId(), request.currencyCode());
        if (!walletLedgerEntryRepository.existsBySourceServiceAndSourceEventIdAndEntryType("PAYMENT", request.sourceEventId(), entryType)) {
            WalletLedgerEntry entry = new WalletLedgerEntry();
            entry.setPublicId(UUID.randomUUID().toString());
            entry.setWalletAccount(account);
            entry.setSourceService("PAYMENT");
            entry.setSourceEventId(request.sourceEventId());
            entry.setMarketplaceOrderPublicId(request.marketplaceOrderPublicId());
            entry.setPaymentOrderPublicId(request.paymentOrderPublicId());
            entry.setEntryType(entryType);
            entry.setDirection(direction);
            entry.setAmount(request.amount() == null ? BigDecimal.ZERO : request.amount());
            entry.setCurrencyCode(account.getCurrencyCode());
            entry.setEntryStatus("POSTED");
            entry.setDescription(eventType);
            entry.setCreatedAt(now);
            walletLedgerEntryRepository.save(entry);
            recalculate(account);
            log.info("Wallet event projected: eventType={}, ownerType={}, ownerPublicId={}, entryType={}, amount={}, currencyCode={}",
                    eventType, ownerType, request.ownerPublicId(), entryType, entry.getAmount(), entry.getCurrencyCode());
        }
        return new WalletDtos.MessageResponse(eventType + " event accepted");
    }

    /**
     * Returns wallet summaries for admin views.
     */
    @Transactional(readOnly = true)
    public List<WalletDtos.SummaryResponse> adminAccounts() {
        return walletAccountRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(account -> summary(account.getOwnerType(), account.getOwnerPublicId(), account.getCurrencyCode()))
                .toList();
    }

    /**
     * Returns all ledger entries for admin audit views.
     */
    @Transactional(readOnly = true)
    public List<WalletDtos.ActivityResponse> adminActivity() {
        log.info("Wallet admin activity requested");
        return walletLedgerEntryRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toActivity).toList();
    }

    private WalletDtos.SummaryResponse summary(String ownerType, String ownerPublicId, String currencyCode) {
        return walletAccountRepository.findByOwnerTypeAndOwnerPublicIdAndCurrencyCode(ownerType, ownerPublicId, currencyCode)
                .flatMap(account -> walletBalanceSnapshotRepository.findByWalletAccount_Id(account.getId()))
                .map(snapshot -> new WalletDtos.SummaryResponse(snapshot.getPendingAmount(), snapshot.getAvailableAmount(),
                        snapshot.getPaidAmount(), snapshot.getReversedAmount(), snapshot.getCurrencyCode()))
                .orElse(WalletDtos.emptySummary());
    }

    private List<WalletDtos.ActivityResponse> activity(String ownerType, String ownerPublicId) {
        return walletLedgerEntryRepository.findByWalletAccount_OwnerTypeAndWalletAccount_OwnerPublicIdOrderByCreatedAtDesc(ownerType, ownerPublicId)
                .stream().map(this::toActivity).toList();
    }

    private WalletAccount account(String ownerType, String ownerPublicId, String currencyCode) {
        String safeCurrency = currencyCode == null || currencyCode.isBlank() ? "USD" : currencyCode;
        return walletAccountRepository.findByOwnerTypeAndOwnerPublicIdAndCurrencyCode(ownerType, ownerPublicId, safeCurrency)
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    WalletAccount account = new WalletAccount();
                    account.setPublicId(UUID.randomUUID().toString());
                    account.setOwnerType(ownerType);
                    account.setOwnerPublicId(ownerPublicId);
                    account.setCurrencyCode(safeCurrency);
                    account.setWalletStatus("ACTIVE");
                    account.setCreatedAt(now);
                    account.setUpdatedAt(now);
                    WalletAccount saved = walletAccountRepository.save(account);
                    WalletBalanceSnapshot snapshot = new WalletBalanceSnapshot();
                    snapshot.setWalletAccount(saved);
                    snapshot.setPendingAmount(BigDecimal.ZERO);
                    snapshot.setAvailableAmount(BigDecimal.ZERO);
                    snapshot.setPaidAmount(BigDecimal.ZERO);
                    snapshot.setReversedAmount(BigDecimal.ZERO);
                    snapshot.setCurrencyCode(safeCurrency);
                    snapshot.setCalculatedAt(now);
                    walletBalanceSnapshotRepository.save(snapshot);
                    return saved;
                });
    }

    private void recalculate(WalletAccount account) {
        BigDecimal pending = BigDecimal.ZERO;
        BigDecimal available = BigDecimal.ZERO;
        BigDecimal paid = BigDecimal.ZERO;
        BigDecimal reversed = BigDecimal.ZERO;
        for (WalletLedgerEntry entry : walletLedgerEntryRepository
                .findByWalletAccount_OwnerTypeAndWalletAccount_OwnerPublicIdOrderByCreatedAtDesc(account.getOwnerType(), account.getOwnerPublicId())) {
            switch (entry.getEntryType()) {
                case "PROVIDER_PENDING_EARNING" -> pending = pending.add(entry.getAmount());
                case "PROVIDER_AVAILABLE_EARNING" -> available = available.add(entry.getAmount());
                case "PROVIDER_PAYOUT" -> paid = paid.add(entry.getAmount());
                case "CUSTOMER_REFUND", "PROVIDER_PAYOUT_REVERSAL" -> reversed = reversed.add(entry.getAmount());
                default -> {
                }
            }
        }
        WalletBalanceSnapshot snapshot = walletBalanceSnapshotRepository.findByWalletAccount_Id(account.getId()).orElseThrow();
        snapshot.setPendingAmount(pending);
        snapshot.setAvailableAmount(available);
        snapshot.setPaidAmount(paid);
        snapshot.setReversedAmount(reversed);
        snapshot.setCalculatedAt(LocalDateTime.now());
    }

    private WalletDtos.ActivityResponse toActivity(WalletLedgerEntry entry) {
        return new WalletDtos.ActivityResponse(entry.getPublicId(), entry.getEntryType(), entry.getDirection(),
                entry.getAmount(), entry.getCurrencyCode(), entry.getEntryStatus(), entry.getDescription(), entry.getCreatedAt());
    }

    private String userPublicId(Jwt jwt) {
        String uid = jwt.getClaimAsString("uid");
        return uid == null || uid.isBlank() ? jwt.getSubject() : uid;
    }
}
