package com.java.vinod.payment.service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fraud detection service for payment risk assessment.
 *
 * Implements multiple fraud detection strategies:
 * 1. Velocity checks (transaction frequency)
 * 2. Amount anomaly detection
 * 3. Geographic anomaly detection
 * 4. Customer reputation scoring
 * 5. Card testing patterns
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FraudDetectionService {

    // In-memory transaction history (would use Redis in production)
    private final ConcurrentHashMap<String, List<TransactionRecord>> customerHistory = new ConcurrentHashMap<>();

    public static class FraudRiskAssessment {
        public enum RiskLevel {
            LOW(0),
            MEDIUM(50),
            HIGH(75),
            CRITICAL(95);

            private final int threshold;

            RiskLevel(int threshold) {
                this.threshold = threshold;
            }

            public static RiskLevel fromScore(int score) {
                if (score >= CRITICAL.threshold) return CRITICAL;
                if (score >= HIGH.threshold) return HIGH;
                if (score >= MEDIUM.threshold) return MEDIUM;
                return LOW;
            }
        }

        public String customerId;
        public int riskScore; // 0-100
        public RiskLevel riskLevel;
        public List<String> riskFactors = new ArrayList<>();
        public boolean shouldBlock;
        public String reason;

        @Override
        public String toString() {
            return String.format("FraudRisk(customer=%s, score=%d, level=%s, shouldBlock=%s)",
                customerId, riskScore, riskLevel, shouldBlock);
        }
    }

    public static class TransactionRecord {
        public String customerId;
        public BigDecimal amount;
        public String currencyCode;
        public String merchantId;
        public String country;
        public String ipAddress;
        public LocalDateTime timestamp;
        public boolean successful;

        public TransactionRecord(String customerId, BigDecimal amount, String currencyCode,
                              String merchantId, String country, String ipAddress) {
            this.customerId = customerId;
            this.amount = amount;
            this.currencyCode = currencyCode;
            this.merchantId = merchantId;
            this.country = country;
            this.ipAddress = ipAddress;
            this.timestamp = LocalDateTime.now();
            this.successful = false;
        }
    }

    /**
     * Main fraud assessment method.
     * Evaluates transaction for fraud risk based on multiple signals.
     */
    public FraudRiskAssessment assessFraudRisk(String customerId, BigDecimal amount, String currencyCode,
                                              String merchantId, String country, String ipAddress) {
        FraudRiskAssessment assessment = new FraudRiskAssessment();
        assessment.customerId = customerId;
        assessment.riskScore = 0;

        // Check 1: Velocity checks (transaction frequency)
        int velocityScore = checkVelocity(customerId);
        assessment.riskScore += velocityScore;
        if (velocityScore > 20) {
            assessment.riskFactors.add("High transaction velocity (rapid successive transactions)");
        }

        // Check 2: Amount anomaly detection
        int amountScore = checkAmountAnomaly(customerId, amount);
        assessment.riskScore += amountScore;
        if (amountScore > 20) {
            assessment.riskFactors.add("Unusual transaction amount (exceeds customer history)");
        }

        // Check 3: Geographic anomaly detection
        int geoScore = checkGeographicAnomaly(customerId, country, ipAddress);
        assessment.riskScore += geoScore;
        if (geoScore > 20) {
            assessment.riskFactors.add("Geographic anomaly (impossible travel or new country)");
        }

        // Check 4: Card testing patterns
        int cardTestingScore = checkCardTestingPatterns(customerId);
        assessment.riskScore += cardTestingScore;
        if (cardTestingScore > 20) {
            assessment.riskFactors.add("Possible card testing pattern (multiple small transactions)");
        }

        // Check 5: Account age and history
        int accountScore = checkAccountReputation(customerId);
        assessment.riskScore += accountScore;
        if (accountScore > 20) {
            assessment.riskFactors.add("New or low-reputation account");
        }

        // Cap score at 100
        assessment.riskScore = Math.min(assessment.riskScore, 100);
        assessment.riskLevel = FraudRiskAssessment.RiskLevel.fromScore(assessment.riskScore);

        // Decision: Block if CRITICAL, flag if HIGH
        assessment.shouldBlock = assessment.riskLevel == FraudRiskAssessment.RiskLevel.CRITICAL;
        if (assessment.shouldBlock) {
            assessment.reason = "Transaction blocked due to critical fraud risk";
        } else if (assessment.riskLevel == FraudRiskAssessment.RiskLevel.HIGH) {
            assessment.reason = "Transaction flagged for manual review (high fraud risk)";
        } else {
            assessment.reason = "Transaction approved (low fraud risk)";
        }

        log.info("Fraud assessment: {}", assessment);
        return assessment;
    }

    /**
     * Check for unusual transaction velocity.
     * Multiple rapid transactions increase fraud likelihood.
     */
    private int checkVelocity(String customerId) {
        List<TransactionRecord> history = customerHistory.getOrDefault(customerId, new ArrayList<>());

        if (history.isEmpty()) {
            return 0;
        }

        // Count transactions in last hour
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        long recentCount = history.stream()
            .filter(t -> t.timestamp.isAfter(oneHourAgo))
            .count();

        // Scoring: 1 transaction = 0pts, 2 = 10pts, 3+ = 30pts
        if (recentCount >= 3) return 30;
        if (recentCount >= 2) return 10;
        return 0;
    }

    /**
     * Detect amount anomalies.
     * Large purchases from new customers or unusual patterns.
     */
    private int checkAmountAnomaly(String customerId, BigDecimal amount) {
        List<TransactionRecord> history = customerHistory.getOrDefault(customerId, new ArrayList<>());

        if (history.isEmpty()) {
            // New customer spending money - low risk but flag it
            if (amount.compareTo(new BigDecimal("100")) > 0) {
                return 10;
            }
            return 0;
        }

        // Calculate average and standard deviation
        double[] stats = calculateAmountStats(history);
        double average = stats[0];
        double stdDev = stats[1];

        // Flag if amount > (average + 3*stdDev)
        double threshold = average + (3 * stdDev);
        if (amount.doubleValue() > threshold) {
            return 25;
        }

        return 0;
    }

    /**
     * Detect geographic anomalies.
     * Impossible travel or accessing from new countries.
     */
    private int checkGeographicAnomaly(String customerId, String country, String ipAddress) {
        List<TransactionRecord> history = customerHistory.getOrDefault(customerId, new ArrayList<>());

        if (history.isEmpty()) {
            return 0; // New customer, any location acceptable
        }

        // Check if country changed in last 24 hours
        LocalDateTime oneDayAgo = LocalDateTime.now().minusHours(24);
        boolean hasRecentTransaction = history.stream()
            .filter(t -> t.timestamp.isAfter(oneDayAgo))
            .anyMatch(t -> t.country != null && !t.country.equals(country));

        if (hasRecentTransaction) {
            return 20; // Possible account compromise
        }

        // Check for new country (never seen before)
        boolean isNewCountry = history.stream()
            .noneMatch(t -> t.country != null && t.country.equals(country));

        if (isNewCountry && !history.isEmpty()) {
            return 15; // First time in this country
        }

        return 0;
    }

    /**
     * Detect card testing patterns.
     * Multiple small transactions followed by large one (testing stolen card).
     */
    private int checkCardTestingPatterns(String customerId) {
        List<TransactionRecord> history = customerHistory.getOrDefault(customerId, new ArrayList<>());

        if (history.size() < 3) {
            return 0;
        }

        // Look for pattern: 2-3 small amounts followed by larger amount
        List<TransactionRecord> recent = history.subList(Math.max(0, history.size() - 5), history.size());
        long smallTransactions = recent.stream()
            .filter(t -> t.amount.compareTo(new BigDecimal("10")) < 0)
            .count();

        if (smallTransactions >= 2) {
            // Multiple micro-transactions suggest card testing
            return 25;
        }

        return 0;
    }

    /**
     * Score customer account reputation.
     * New accounts with no history = higher risk.
     */
    private int checkAccountReputation(String customerId) {
        List<TransactionRecord> history = customerHistory.getOrDefault(customerId, new ArrayList<>());

        if (history.isEmpty()) {
            return 20; // Brand new account
        }

        // Score based on history length and success rate
        int historyLength = history.size();
        long successfulCount = history.stream()
            .filter(t -> t.successful)
            .count();

        double successRate = successfulCount / (double) historyLength;

        // Low success rate = suspicious
        if (successRate < 0.5) {
            return 25;
        }

        // New account (< 5 transactions)
        if (historyLength < 5) {
            return 15;
        }

        return 0;
    }

    /**
     * Record a transaction for fraud history.
     */
    public void recordTransaction(TransactionRecord transaction) {
        customerHistory.computeIfAbsent(transaction.customerId, k -> Collections.synchronizedList(new ArrayList<>()))
            .add(transaction);

        // Keep only last 100 transactions per customer (memory management)
        List<TransactionRecord> history = customerHistory.get(transaction.customerId);
        if (history.size() > 100) {
            synchronized (history) {
                if (history.size() > 100) {
                    history.subList(0, history.size() - 100).clear();
                }
            }
        }

        log.debug("Recorded transaction for customer: {}", transaction.customerId);
    }

    private double[] calculateAmountStats(List<TransactionRecord> transactions) {
        if (transactions.isEmpty()) {
            return new double[]{0, 0};
        }

        double sum = 0;
        for (TransactionRecord t : transactions) {
            sum += t.amount.doubleValue();
        }
        double average = sum / transactions.size();

        double sumSquaredDiff = 0;
        for (TransactionRecord t : transactions) {
            sumSquaredDiff += Math.pow(t.amount.doubleValue() - average, 2);
        }
        double stdDev = Math.sqrt(sumSquaredDiff / transactions.size());

        return new double[]{average, stdDev};
    }
}
