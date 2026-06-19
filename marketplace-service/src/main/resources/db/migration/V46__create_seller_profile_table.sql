-- Create seller profile master table with ratings and verification status
CREATE TABLE IF NOT EXISTS seller_profile (
    seller_id INT PRIMARY KEY AUTO_INCREMENT,
    provider_account_public_id VARCHAR(255) UNIQUE NOT NULL,
    seller_name VARCHAR(255) NOT NULL,
    seller_rating DECIMAL(3,2) NOT NULL DEFAULT 4.5,
    completed_orders INT NOT NULL DEFAULT 0,
    total_reviews INT NOT NULL DEFAULT 0,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'VERIFIED',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY uk_provider_account_public_id (provider_account_public_id),
    INDEX idx_seller_rating (seller_rating),
    INDEX idx_completed_orders (completed_orders),
    INDEX idx_verification_status (verification_status)
);

-- Seed seller profiles from existing providers
INSERT INTO seller_profile (provider_account_public_id, seller_name, seller_rating, completed_orders, total_reviews, verification_status)
SELECT DISTINCT
    provider_account_public_id,
    seller_display_name,
    4.8,
    COUNT(*) as completed_orders,
    0,
    'VERIFIED'
FROM listing
WHERE provider_account_public_id IS NOT NULL
  AND seller_display_name IS NOT NULL
GROUP BY provider_account_public_id, seller_display_name
ON DUPLICATE KEY UPDATE
    completed_orders = VALUES(completed_orders),
    updated_at = NOW(6);
