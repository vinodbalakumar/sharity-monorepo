CREATE TABLE wallet_transaction_type_master (
    source_event_type VARCHAR(80) NOT NULL,
    owner_type VARCHAR(50) NOT NULL,
    entry_type VARCHAR(80) NOT NULL,
    direction VARCHAR(20) NOT NULL,
    balance_bucket VARCHAR(30) NOT NULL,
    active BOOLEAN NOT NULL,
    sort_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT pk_wallet_transaction_type_master PRIMARY KEY (source_event_type)
);

CREATE TABLE wallet_status_master (
    status_code VARCHAR(50) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    active BOOLEAN NOT NULL,
    sort_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT pk_wallet_status_master PRIMARY KEY (status_code)
);

INSERT INTO wallet_transaction_type_master (source_event_type, owner_type, entry_type, direction, balance_bucket, active, sort_order, created_at, updated_at)
VALUES
    ('PAYMENT_CAPTURED', 'CUSTOMER', 'CUSTOMER_PAYMENT', 'DEBIT', 'PAID', TRUE, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PROVIDER_PENDING_EARNING', 'PROVIDER_ACCOUNT', 'PROVIDER_PENDING_EARNING', 'CREDIT', 'PENDING', TRUE, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PAYOUT_ELIGIBLE', 'PROVIDER_ACCOUNT', 'PROVIDER_AVAILABLE_EARNING', 'CREDIT', 'AVAILABLE', TRUE, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PAYOUT_PAID', 'PROVIDER_ACCOUNT', 'PROVIDER_PAYOUT', 'DEBIT', 'PAID', TRUE, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('REFUND_COMPLETED', 'CUSTOMER', 'CUSTOMER_REFUND', 'CREDIT', 'REVERSED', TRUE, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO wallet_status_master (status_code, display_label, active, sort_order, created_at, updated_at)
VALUES
    ('ACTIVE', 'Active', TRUE, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('SUSPENDED', 'Suspended', TRUE, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
