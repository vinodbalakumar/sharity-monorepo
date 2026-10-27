CREATE TABLE IF NOT EXISTS category_master (
    id BIGINT NOT NULL AUTO_INCREMENT,
    category_code VARCHAR(50) NOT NULL,
    category_name VARCHAR(120) NOT NULL,
    category_slug VARCHAR(120) NOT NULL,
    icon_ref VARCHAR(255) NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_category_master_code UNIQUE (category_code),
    CONSTRAINT uk_category_master_slug UNIQUE (category_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET @sql := IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'listing' AND column_name = 'seller_display_name') = 0,
    'ALTER TABLE listing ADD COLUMN seller_display_name VARCHAR(150) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'listing' AND column_name = 'original_price_amount') = 0,
    'ALTER TABLE listing ADD COLUMN original_price_amount DECIMAL(12,2) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'listing' AND column_name = 'image_url') = 0,
    'ALTER TABLE listing ADD COLUMN image_url VARCHAR(500) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'listing' AND column_name = 'featured') = 0,
    'ALTER TABLE listing ADD COLUMN featured BOOLEAN NOT NULL DEFAULT FALSE',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'listing' AND column_name = 'verified_seller') = 0,
    'ALTER TABLE listing ADD COLUMN verified_seller BOOLEAN NOT NULL DEFAULT FALSE',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO category_master (category_code, category_name, category_slug, icon_ref, active, display_order, created_at, updated_at)
SELECT 'GIFT_CARDS', 'Gift Cards', 'gift-cards', 'card_giftcard', TRUE, 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM category_master WHERE category_code = 'GIFT_CARDS');

INSERT INTO category_master (category_code, category_name, category_slug, icon_ref, active, display_order, created_at, updated_at)
SELECT 'GAMING', 'Gaming', 'gaming', 'sports_esports', TRUE, 2, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM category_master WHERE category_code = 'GAMING');

INSERT INTO category_master (category_code, category_name, category_slug, icon_ref, active, display_order, created_at, updated_at)
SELECT 'ELECTRONICS', 'Electronics', 'electronics', 'devices', TRUE, 3, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM category_master WHERE category_code = 'ELECTRONICS');

INSERT INTO category_master (category_code, category_name, category_slug, icon_ref, active, display_order, created_at, updated_at)
SELECT 'COLLECTIBLES', 'Collectibles', 'collectibles', 'auto_awesome', TRUE, 4, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM category_master WHERE category_code = 'COLLECTIBLES');

INSERT INTO category_master (category_code, category_name, category_slug, icon_ref, active, display_order, created_at, updated_at)
SELECT 'FASHION', 'Fashion', 'fashion', 'checkroom', TRUE, 5, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM category_master WHERE category_code = 'FASHION');

INSERT INTO category_master (category_code, category_name, category_slug, icon_ref, active, display_order, created_at, updated_at)
SELECT 'SERVICES', 'Services', 'services', 'design_services', TRUE, 6, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM category_master WHERE category_code = 'SERVICES');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, product_type,
    delivery_type, provider_country_code, currency_code, price_amount, listing_status, created_at, updated_at,
    seller_display_name, original_price_amount, image_url, featured, verified_seller
)
SELECT
    'f8d6d40c-9bd4-4af7-a8ba-782a39d2b001', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201',
    'PlayStation Store Digital Gift Card', 'Digital code delivery for instant wallet top-up.', 'GIFT_CARDS', 'DIGITAL',
    'INSTANT', 'USA', 'USD', 45.00, 'ACTIVE', NOW(6), NOW(6),
    'PixelVault Store', 50.00, 'https://picsum.photos/seed/ps-gift-card/640/400', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b001');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, product_type,
    delivery_type, provider_country_code, currency_code, price_amount, listing_status, created_at, updated_at,
    seller_display_name, original_price_amount, image_url, featured, verified_seller
)
SELECT
    'f8d6d40c-9bd4-4af7-a8ba-782a39d2b002', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202',
    'Xbox Wireless Controller', 'Latest generation controller in excellent condition.', 'GAMING', 'PHYSICAL',
    'SHIPPING', 'USA', 'USD', 52.00, 'ACTIVE', NOW(6), NOW(6),
    'Nova Console Hub', 59.00, 'https://picsum.photos/seed/xbox-controller/640/400', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b002');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, product_type,
    delivery_type, provider_country_code, currency_code, price_amount, listing_status, created_at, updated_at,
    seller_display_name, original_price_amount, image_url, featured, verified_seller
)
SELECT
    'f8d6d40c-9bd4-4af7-a8ba-782a39d2b003', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222203',
    'Wireless Gaming Headset', 'Low-latency headset with clear voice chat.', 'ELECTRONICS', 'PHYSICAL',
    'SHIPPING', 'USA', 'USD', 79.00, 'ACTIVE', NOW(6), NOW(6),
    'Orbit Tech Outlet', 99.00, 'https://picsum.photos/seed/gaming-headset/640/400', TRUE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b003');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, product_type,
    delivery_type, provider_country_code, currency_code, price_amount, listing_status, created_at, updated_at,
    seller_display_name, original_price_amount, image_url, featured, verified_seller
)
SELECT
    'f8d6d40c-9bd4-4af7-a8ba-782a39d2b004', '11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222204',
    'Collector Trading Card Bundle', 'Curated bundle of graded and near-mint cards.', 'COLLECTIBLES', 'PHYSICAL',
    'SHIPPING', 'USA', 'USD', 129.00, 'ACTIVE', NOW(6), NOW(6),
    'RareShelf Collectibles', 149.00, 'https://picsum.photos/seed/trading-cards/640/400', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b004');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, product_type,
    delivery_type, provider_country_code, currency_code, price_amount, listing_status, created_at, updated_at,
    seller_display_name, original_price_amount, image_url, featured, verified_seller
)
SELECT
    'f8d6d40c-9bd4-4af7-a8ba-782a39d2b005', '11111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222205',
    'Smartwatch Series Case', 'Protective case with tempered glass edge coverage.', 'FASHION', 'PHYSICAL',
    'SHIPPING', 'USA', 'USD', 21.00, 'ACTIVE', NOW(6), NOW(6),
    'StyleGrid Essentials', 29.00, 'https://picsum.photos/seed/watch-case/640/400', FALSE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b005');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, product_type,
    delivery_type, provider_country_code, currency_code, price_amount, listing_status, created_at, updated_at,
    seller_display_name, original_price_amount, image_url, featured, verified_seller
)
SELECT
    'f8d6d40c-9bd4-4af7-a8ba-782a39d2b006', '11111111-1111-1111-1111-111111111106', '22222222-2222-2222-2222-222222222206',
    'Digital Design Service Voucher', 'Redeemable voucher for logo and social media kit design.', 'SERVICES', 'DIGITAL',
    'MANUAL', 'USA', 'USD', 95.00, 'ACTIVE', NOW(6), NOW(6),
    'CraftedPixel Studio', 120.00, 'https://picsum.photos/seed/design-voucher/640/400', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b006');
