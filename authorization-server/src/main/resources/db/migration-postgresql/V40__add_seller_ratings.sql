ALTER TABLE provider_account
    ADD COLUMN IF NOT EXISTS seller_rating DECIMAL(3, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS completed_orders INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_provider_account_rating
    ON provider_account (seller_rating DESC, completed_orders DESC, overall_status);

UPDATE provider_account
SET seller_rating = ROUND((RANDOM() * 5)::numeric, 2),
    completed_orders = FLOOR(RANDOM() * 100)::integer,
    updated_at = CURRENT_TIMESTAMP(6)
WHERE seller_rating = 0 AND overall_status = 'ACTIVE';
