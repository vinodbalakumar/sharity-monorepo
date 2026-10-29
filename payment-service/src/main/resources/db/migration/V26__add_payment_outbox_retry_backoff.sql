ALTER TABLE payment_event_outbox
    ADD COLUMN attempt_count INT NOT NULL DEFAULT 0,
    ADD COLUMN next_attempt_at TIMESTAMP NULL;

CREATE INDEX idx_payment_outbox_due
    ON payment_event_outbox (processing_status, next_attempt_at, created_at);
