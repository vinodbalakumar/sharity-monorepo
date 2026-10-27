CREATE TABLE wallet_account (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    owner_type VARCHAR(30) NOT NULL,
    owner_public_id CHAR(36) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    wallet_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_wallet_account_public_id UNIQUE (public_id),
    CONSTRAINT uk_wallet_account_owner_currency UNIQUE (owner_type, owner_public_id, currency_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE wallet_ledger_entry (
    id BIGINT NOT NULL AUTO_INCREMENT,
    public_id CHAR(36) NOT NULL,
    wallet_account_id BIGINT NOT NULL,
    source_service VARCHAR(40) NOT NULL,
    source_event_id VARCHAR(100) NOT NULL,
    marketplace_order_public_id CHAR(36) NULL,
    payment_order_public_id CHAR(36) NULL,
    entry_type VARCHAR(40) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    entry_status VARCHAR(30) NOT NULL,
    description VARCHAR(255) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_wallet_ledger_entry_public_id UNIQUE (public_id),
    CONSTRAINT uk_wallet_ledger_source UNIQUE (source_service, source_event_id, entry_type),
    CONSTRAINT fk_wallet_ledger_account FOREIGN KEY (wallet_account_id) REFERENCES wallet_account (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE wallet_balance_snapshot (
    id BIGINT NOT NULL AUTO_INCREMENT,
    wallet_account_id BIGINT NOT NULL,
    pending_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    available_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    reversed_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency_code VARCHAR(3) NOT NULL,
    calculated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_wallet_balance_snapshot_account UNIQUE (wallet_account_id),
    CONSTRAINT fk_wallet_balance_snapshot_account FOREIGN KEY (wallet_account_id) REFERENCES wallet_account (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE wallet_event_inbox (
    id BIGINT NOT NULL AUTO_INCREMENT,
    source_service VARCHAR(40) NOT NULL,
    source_event_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload_json JSON NOT NULL,
    processing_status VARCHAR(30) NOT NULL,
    received_at DATETIME(6) NOT NULL,
    processed_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_wallet_event_inbox_source UNIQUE (source_event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
