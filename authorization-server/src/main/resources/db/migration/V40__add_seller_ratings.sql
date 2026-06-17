-- Add seller rating columns to provider_account for marketplace trust signals
-- This migration adds:
-- 1. seller_rating: Average rating (0-5.0) based on buyer reviews
-- 2. completed_orders: Count of successfully completed/accepted orders

-- Add seller_rating column
SET @rating_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'provider_account'
      AND column_name = 'seller_rating'
);

SET @rating_sql = IF(
    @rating_exists = 0,
    'ALTER TABLE provider_account ADD COLUMN seller_rating DECIMAL(3, 2) DEFAULT 0.00 AFTER overall_status',
    'SELECT 1'
);

PREPARE rating_stmt FROM @rating_sql;
EXECUTE rating_stmt;
DEALLOCATE PREPARE rating_stmt;

-- Add completed_orders column
SET @orders_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'provider_account'
      AND column_name = 'completed_orders'
);

SET @orders_sql = IF(
    @orders_exists = 0,
    'ALTER TABLE provider_account ADD COLUMN completed_orders INT DEFAULT 0 AFTER seller_rating',
    'SELECT 1'
);

PREPARE orders_stmt FROM @orders_sql;
EXECUTE orders_stmt;
DEALLOCATE PREPARE orders_stmt;

-- Create index for seller rating queries (for sorting by rating)
SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'provider_account'
      AND index_name = 'idx_provider_account_rating'
);

SET @index_sql = IF(
    @index_exists = 0,
    'CREATE INDEX idx_provider_account_rating ON provider_account (seller_rating DESC, completed_orders DESC, overall_status)',
    'SELECT 1'
);

PREPARE index_stmt FROM @index_sql;
EXECUTE index_stmt;
DEALLOCATE PREPARE index_stmt;

-- Seed initial ratings from existing sellers (sample data for demo)
-- In production, this would be calculated from actual order reviews
UPDATE provider_account
SET seller_rating = ROUND(RAND() * 5, 2),
    completed_orders = FLOOR(RAND() * 100),
    updated_at = NOW(6)
WHERE seller_rating = 0 AND overall_status = 'ACTIVE';

-- Verify migration
SELECT 'Migration V40 Complete' as status;
SELECT COUNT(*) as provider_count,
       AVG(seller_rating) as avg_rating,
       SUM(completed_orders) as total_orders
FROM provider_account
WHERE overall_status = 'ACTIVE';
