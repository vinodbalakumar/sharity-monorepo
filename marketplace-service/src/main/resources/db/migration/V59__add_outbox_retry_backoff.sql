ALTER TABLE marketplace_event_outbox
    ADD COLUMN attempt_count INT NOT NULL DEFAULT 0,
    ADD COLUMN next_attempt_at TIMESTAMP NULL;

CREATE INDEX idx_marketplace_outbox_due
    ON marketplace_event_outbox (processing_status, next_attempt_at, created_at);
