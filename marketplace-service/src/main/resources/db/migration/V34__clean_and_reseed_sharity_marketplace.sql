DELETE FROM marketplace_event_outbox WHERE 1=1;
DELETE FROM dispute_case WHERE 1=1;
DELETE FROM customer_acceptance WHERE 1=1;
DELETE FROM delivery_submission WHERE 1=1;
DELETE FROM order_status_history WHERE 1=1;
DELETE FROM order_header WHERE 1=1;
DELETE FROM listing WHERE 1=1;

ALTER TABLE listing AUTO_INCREMENT = 1;
ALTER TABLE order_header AUTO_INCREMENT = 1;

UPDATE verticals_master
SET status = 'COMING_SOON',
    customer_access_enabled = FALSE,
    provider_access_enabled = FALSE,
    requires_provider_approval = TRUE,
    available_to_customer = FALSE,
    provider_access_active = FALSE,
    updated_at = NOW(6)
WHERE module_code NOT IN ('MARKETPLACE', 'JEWELLERY');

UPDATE verticals_master
SET module_name = 'Digital Marketplace',
    description = 'Digital codes, gift cards, and gaming products',
    status = 'ACTIVE',
    display_order = 10,
    icon_key = 'keypad',
    module_type = 'COMMERCE_VERTICAL',
    frontend_route = '/marketplace',
    api_audience = 'MARKETPLACE_API',
    customer_access_enabled = TRUE,
    provider_access_enabled = TRUE,
    requires_provider_approval = TRUE,
    available_to_customer = TRUE,
    provider_access_active = TRUE,
    updated_at = NOW(6)
WHERE module_code = 'MARKETPLACE';

UPDATE verticals_master
SET module_name = 'Imitation Jewellery',
    description = 'Imitation jewellery and one-gram gold style products',
    status = 'ACTIVE',
    display_order = 20,
    icon_key = 'diamond',
    module_type = 'COMMERCE_VERTICAL',
    frontend_route = '/jewellery',
    api_audience = 'JEWELLERY_API',
    customer_access_enabled = TRUE,
    provider_access_enabled = TRUE,
    requires_provider_approval = TRUE,
    available_to_customer = TRUE,
    provider_access_active = TRUE,
    updated_at = NOW(6)
WHERE module_code = 'JEWELLERY';

UPDATE category_master
SET active = FALSE,
    updated_at = NOW(6)
WHERE category_code NOT IN ('GIFT_CARDS', 'GAMING', 'ONE_GRAM_JEWELLERY');

UPDATE category_master
SET category_name = 'Gift Cards',
    category_slug = 'gift-cards',
    vertical_code = 'MARKETPLACE',
    country_code = NULL,
    icon_ref = 'card_giftcard',
    active = TRUE,
    display_order = 1,
    updated_at = NOW(6)
WHERE category_code = 'GIFT_CARDS';

UPDATE category_master
SET category_name = 'Gaming',
    category_slug = 'gaming',
    vertical_code = 'MARKETPLACE',
    country_code = NULL,
    icon_ref = 'sports_esports',
    active = TRUE,
    display_order = 2,
    updated_at = NOW(6)
WHERE category_code = 'GAMING';

UPDATE category_master
SET category_name = 'Imitation Jewellery',
    category_slug = 'imitation-jewellery',
    vertical_code = 'JEWELLERY',
    country_code = NULL,
    icon_ref = 'diamond',
    active = TRUE,
    display_order = 3,
    updated_at = NOW(6)
WHERE category_code = 'ONE_GRAM_JEWELLERY';

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, fulfillment_scope, provider_country_code, currency_code, price_amount, original_price_amount,
    image_url, condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name,
    source_url, license_note, demo_seed, listing_status, created_at, updated_at
)
VALUES
('sharity-digital-gift-001', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201',
 'Premium Digital Gift Card Bundle', 'Curated instant-delivery digital gift cards for everyday purchases.', 'GIFT_CARDS', 'MARKETPLACE',
 'DIGITAL', 'INSTANT', 'GLOBAL', 'US', 'USD', 25.00, 35.00,
 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_001.jpg', 'Digital', 25, 'Sharity Digital Studio',
 TRUE, TRUE, 'CURATED', 'Sharity Seed Studio', NULL, 'Curated seed listing for the live digital marketplace.', TRUE, 'ACTIVE', NOW(6), NOW(6)),
('sharity-digital-gift-002', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202',
 'Gaming Code Value Pack', 'Popular game code bundle with instant redemption and safe delivery.', 'GAMING', 'MARKETPLACE',
 'DIGITAL', 'MANUAL', 'GLOBAL', 'US', 'USD', 44.00, 59.00,
 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_002.jpg', 'Digital', 14, 'Sharity Digital Studio',
 FALSE, TRUE, 'CURATED', 'Sharity Seed Studio', NULL, 'Curated seed listing for the live digital marketplace.', TRUE, 'SOLD', NOW(6), NOW(6)),
('sharity-jewellery-001', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222203',
 'Imitation Jewellery Pendant Set', 'Elegant imitation jewellery set with a polished finish and gift-ready packaging.', 'ONE_GRAM_JEWELLERY', 'JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'US', 'USD', 79.00, 109.00,
 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_003.jpg', 'New', 20, 'Sharity Jewellery Atelier',
 TRUE, TRUE, 'CURATED', 'Sharity Seed Studio', NULL, 'Curated seed listing for the live jewellery marketplace.', TRUE, 'ACTIVE', NOW(6), NOW(6)),
('sharity-jewellery-002', '11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222204',
 'Imitation Gold Earrings Duo', 'Lightweight imitation gold earrings with secure clasp and premium finish.', 'ONE_GRAM_JEWELLERY', 'JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'US', 'USD', 59.00, 89.00,
 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_004.jpg', 'New', 8, 'Sharity Jewellery Atelier',
 FALSE, TRUE, 'CURATED', 'Sharity Seed Studio', NULL, 'Curated seed listing for the live jewellery marketplace.', TRUE, 'SOLD', NOW(6), NOW(6));
