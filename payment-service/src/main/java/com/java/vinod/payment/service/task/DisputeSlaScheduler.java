package com.java.vinod.payment.service.task;

import com.java.vinod.payment.service.service.DisputeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled task to check and escalate disputes that exceed SLA.
 * Runs daily at 2 AM UTC to identify disputes needing priority review.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DisputeSlaScheduler {
    private final DisputeService disputeService;

    /**
     * Check for SLA breaches and escalate disputes.
     * Scheduled: Every day at 2:00 AM UTC
     */
    @Scheduled(cron = "0 0 2 * * ?") // Daily at 2 AM UTC
    public void checkSlaBreaches() {
        log.info("Starting daily SLA breach check...");
        try {
            disputeService.checkAndEscalateSlaBreaches();
            log.info("SLA breach check completed successfully");
        } catch (Exception e) {
            log.error("Error checking SLA breaches", e);
        }
    }
}
