-- Create Dispute table
CREATE TABLE dispute (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dispute_id VARCHAR(50) NOT NULL UNIQUE,
    customer_id VARCHAR(100) NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    payment_id VARCHAR(100),
    dispute_reason VARCHAR(500) NOT NULL,
    dispute_description TEXT,
    dispute_status VARCHAR(50) DEFAULT 'OPENED',
    resolution_status VARCHAR(50),
    claimed_amount DECIMAL(19, 4),
    refunded_amount DECIMAL(19, 4) DEFAULT 0,
    currency_code VARCHAR(3) DEFAULT 'USD',
    merchant_id VARCHAR(100),
    evidence_count INT DEFAULT 0,
    notes TEXT,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    INDEX idx_dispute_customer_id (customer_id),
    INDEX idx_dispute_order_id (order_id),
    INDEX idx_dispute_status (dispute_status),
    INDEX idx_dispute_created_at (created_at)
);

-- Create DisputeEvidence table
CREATE TABLE dispute_evidence (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    evidence_id VARCHAR(50) UNIQUE,
    dispute_id BIGINT NOT NULL,
    evidence_type VARCHAR(50) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    description TEXT,
    uploaded_by VARCHAR(100),
    uploaded_at TIMESTAMP NOT NULL,
    FOREIGN KEY (dispute_id) REFERENCES dispute(id) ON DELETE CASCADE,
    INDEX idx_evidence_dispute_id (dispute_id)
);

-- Create DisputeEvent table (Timeline)
CREATE TABLE dispute_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(50) UNIQUE,
    dispute_id BIGINT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_description TEXT,
    actor VARCHAR(100),
    visibility VARCHAR(50) DEFAULT 'BOTH',
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (dispute_id) REFERENCES dispute(id) ON DELETE CASCADE,
    INDEX idx_event_dispute_id (dispute_id),
    INDEX idx_event_created_at (created_at)
);
