-- Add fulfillment tracking columns for enhanced seller order management

ALTER TABLE seller_order ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE seller_order ADD COLUMN IF NOT EXISTS fulfillment_type VARCHAR(50) DEFAULT 'PHYSICAL';
ALTER TABLE seller_order ADD COLUMN IF NOT EXISTS fulfillment_method VARCHAR(100);
ALTER TABLE seller_order ADD COLUMN IF NOT EXISTS estimated_fulfillment_date TIMESTAMP;
ALTER TABLE seller_order ADD COLUMN IF NOT EXISTS actual_fulfillment_date TIMESTAMP;

-- Add tracking for digital vs physical fulfillment
ALTER TABLE seller_order_item ADD COLUMN IF NOT EXISTS digital_delivery_status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE seller_order_item ADD COLUMN IF NOT EXISTS digital_delivery_initiated_at TIMESTAMP;
ALTER TABLE seller_order_item ADD COLUMN IF NOT EXISTS digital_payload_received_at TIMESTAMP;
ALTER TABLE seller_order_item ADD COLUMN IF NOT EXISTS digital_payload_validated_at TIMESTAMP;

-- Add fulfillment tracking table
CREATE TABLE IF NOT EXISTS fulfillment_tracking (
    id SERIAL PRIMARY KEY,
    seller_order_id BIGINT NOT NULL,
    fulfillment_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    FOREIGN KEY (seller_order_id) REFERENCES seller_order(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fulfillment_tracking_seller_order ON fulfillment_tracking(seller_order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_tracking_status ON fulfillment_tracking(status);
CREATE INDEX IF NOT EXISTS idx_seller_order_fulfillment_status ON seller_order(fulfillment_status);
