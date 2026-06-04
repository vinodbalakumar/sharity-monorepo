CREATE TABLE payment_order (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    marketplace_order_public_id CHAR(36) NOT NULL,
    customer_user_public_id CHAR(36) NOT NULL,
    provider_account_public_id CHAR(36) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    customer_charge_amount DECIMAL(12,2) NOT NULL,
    platform_fee_amount DECIMAL(12,2) NOT NULL,
    provider_payable_amount DECIMAL(12,2) NOT NULL,
    payment_provider VARCHAR(50) NOT NULL,
    provider_payment_reference VARCHAR(255) NULL,
    payment_status VARCHAR(40) NOT NULL,
    payout_eligibility_status VARCHAR(40) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_payment_order_public_id UNIQUE (public_id),
    CONSTRAINT uk_payment_order_marketplace_order UNIQUE (marketplace_order_public_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE payment_transaction (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    payment_order_id BIGINT NOT NULL,
    transaction_type VARCHAR(40) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    provider_transaction_reference VARCHAR(255) NULL,
    transaction_status VARCHAR(40) NOT NULL,
    failure_code VARCHAR(100) NULL,
    failure_message VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_payment_transaction_public_id UNIQUE (public_id),
    CONSTRAINT fk_payment_transaction_order FOREIGN KEY (payment_order_id) REFERENCES payment_order (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE provider_payout (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    payment_order_id BIGINT NOT NULL,
    provider_account_public_id CHAR(36) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    payout_status VARCHAR(40) NOT NULL,
    payout_hold_reason VARCHAR(255) NULL,
    payment_provider VARCHAR(50) NULL,
    provider_payout_reference VARCHAR(255) NULL,
    eligible_at DATETIME(6) NULL,
    release_requested_at DATETIME(6) NULL,
    paid_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_provider_payout_public_id UNIQUE (public_id),
    CONSTRAINT uk_provider_payout_order UNIQUE (payment_order_id),
    CONSTRAINT fk_provider_payout_order FOREIGN KEY (payment_order_id) REFERENCES payment_order (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE refund_transaction (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    payment_order_id BIGINT NOT NULL,
    requested_by_user_public_id CHAR(36) NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    refund_status VARCHAR(40) NOT NULL,
    refund_reason VARCHAR(255) NULL,
    payment_provider_reference VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL,
    completed_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_refund_transaction_public_id UNIQUE (public_id),
    CONSTRAINT fk_refund_transaction_order FOREIGN KEY (payment_order_id) REFERENCES payment_order (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE payment_webhook_event (
    id BIGINT NOT NULL AUTO_INCREMENT,
    payment_provider VARCHAR(50) NOT NULL,
    provider_event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload_json JSON NOT NULL,
    processing_status VARCHAR(30) NOT NULL,
    received_at DATETIME(6) NOT NULL,
    processed_at DATETIME(6) NULL,
    failure_message VARCHAR(255) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_payment_webhook_event_provider UNIQUE (provider_event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE payment_event_outbox (
    id BIGINT NOT NULL AUTO_INCREMENT,
    event_id CHAR(36) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    aggregate_public_id CHAR(36) NOT NULL,
    payload_json JSON NOT NULL,
    processing_status VARCHAR(30) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    processed_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_payment_event_outbox_event UNIQUE (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
