CREATE TABLE listing (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    provider_account_public_id CHAR(36) NOT NULL,
    created_by_user_public_id CHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    category_code VARCHAR(50) NULL,
    product_type VARCHAR(50) NOT NULL,
    delivery_type VARCHAR(30) NOT NULL,
    provider_country_code VARCHAR(3) NULL,
    currency_code VARCHAR(3) NOT NULL,
    price_amount DECIMAL(12,2) NOT NULL,
    listing_status VARCHAR(30) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_listing_public_id UNIQUE (public_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE order_header (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    listing_id BIGINT NOT NULL,
    customer_user_public_id CHAR(36) NOT NULL,
    provider_account_public_id CHAR(36) NOT NULL,
    provider_owner_user_public_id CHAR(36) NOT NULL,
    customer_country_code VARCHAR(3) NULL,
    provider_country_code VARCHAR(3) NULL,
    transaction_currency_code VARCHAR(3) NOT NULL,
    item_amount DECIMAL(12,2) NOT NULL,
    platform_fee_amount DECIMAL(12,2) NOT NULL,
    customer_total_amount DECIMAL(12,2) NOT NULL,
    provider_expected_amount DECIMAL(12,2) NOT NULL,
    order_status VARCHAR(40) NOT NULL,
    payment_status VARCHAR(40) NOT NULL,
    fulfillment_status VARCHAR(40) NOT NULL,
    payout_status VARCHAR(40) NOT NULL,
    purchased_at DATETIME(6) NULL,
    provider_delivered_at DATETIME(6) NULL,
    customer_accepted_at DATETIME(6) NULL,
    dispute_opened_at DATETIME(6) NULL,
    completed_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_order_header_public_id UNIQUE (public_id),
    CONSTRAINT fk_order_header_listing FOREIGN KEY (listing_id) REFERENCES listing (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE order_status_history (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    status_type VARCHAR(30) NOT NULL,
    old_status VARCHAR(40) NULL,
    new_status VARCHAR(40) NOT NULL,
    changed_by_user_public_id CHAR(36) NULL,
    reason VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id) REFERENCES order_header (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE delivery_submission (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    submitted_by_user_public_id CHAR(36) NOT NULL,
    delivery_method VARCHAR(30) NOT NULL,
    delivery_reference TEXT NULL,
    provider_notes TEXT NULL,
    submitted_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_delivery_submission_order UNIQUE (order_id),
    CONSTRAINT fk_delivery_submission_order FOREIGN KEY (order_id) REFERENCES order_header (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE customer_acceptance (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    customer_user_public_id CHAR(36) NOT NULL,
    acceptance_status VARCHAR(30) NOT NULL,
    customer_notes TEXT NULL,
    confirmed_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_customer_acceptance_order UNIQUE (order_id),
    CONSTRAINT fk_customer_acceptance_order FOREIGN KEY (order_id) REFERENCES order_header (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE dispute_case (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    order_id BIGINT NOT NULL,
    opened_by_user_public_id CHAR(36) NOT NULL,
    dispute_reason_code VARCHAR(50) NOT NULL,
    description TEXT NULL,
    dispute_status VARCHAR(40) NOT NULL,
    resolution VARCHAR(40) NULL,
    resolved_by_user_public_id CHAR(36) NULL,
    opened_at DATETIME(6) NOT NULL,
    resolved_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_dispute_case_public_id UNIQUE (public_id),
    CONSTRAINT uk_dispute_case_order UNIQUE (order_id),
    CONSTRAINT fk_dispute_case_order FOREIGN KEY (order_id) REFERENCES order_header (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE marketplace_event_outbox (
    id BIGINT NOT NULL AUTO_INCREMENT,
    event_id CHAR(36) NOT NULL,
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_public_id CHAR(36) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload_json JSON NOT NULL,
    processing_status VARCHAR(30) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    processed_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_marketplace_event_outbox_event UNIQUE (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
