UPDATE listing
SET provider_country_code = 'USA'
WHERE vertical_code = 'MARKETPLACE'
  AND (provider_country_code IS NULL OR TRIM(provider_country_code) = '');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'a140c2c0-0000-4000-8000-000000000141', '11111111-1111-1111-1111-111111111241', '22222222-2222-2222-2222-222222222241',
       'Retail Gift Card Bundle Canada', 'Country-localized gift card bundle for Canadian shoppers.', 'GIFT_CARDS_RETAIL', 'MARKETPLACE',
       'DIGITAL', 'INSTANT', 'CAN', 'CAD', 58.00, 64.00, 'marketplace/placeholders/gift_cards.png', 'DIGITAL', 18,
       'RetailCard Vault CA', TRUE, TRUE, 'SYNTHETIC', 'Sharity Country Seed Studio', NULL,
       'Synthetic country-specific seed listing for safe browse localization.', TRUE, 'PUBLISHED', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'a140c2c0-0000-4000-8000-000000000141');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'a140c2c0-0000-4000-8000-000000000142', '11111111-1111-1111-1111-111111111242', '22222222-2222-2222-2222-222222222242',
       'Gaming Headset Pro UK', 'UK-local gaming headset listing with fast shipping.', 'GAMING', 'MARKETPLACE',
       'PHYSICAL', 'SHIPPING', 'GBR', 'GBP', 69.00, 82.00, 'marketplace/placeholders/gaming.png', 'NEW', 12,
       'PixelArc London', TRUE, TRUE, 'SYNTHETIC', 'Sharity Country Seed Studio', NULL,
       'Synthetic country-specific seed listing for safe browse localization.', TRUE, 'PUBLISHED', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'a140c2c0-0000-4000-8000-000000000142');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'a140c2c0-0000-4000-8000-000000000143', '11111111-1111-1111-1111-111111111243', '22222222-2222-2222-2222-222222222243',
       'Everyday Essentials Pack India', 'Local pantry and household essentials for Indian shoppers.', 'GROCERY_EVERYDAY', 'GROCERY',
       'PHYSICAL', 'SHIPPING', 'IND', 'INR', 1599.00, 1899.00, 'marketplace/placeholders/grocery.png', 'NEW', 26,
       'DailyDrop Mumbai', TRUE, TRUE, 'SYNTHETIC', 'Sharity Country Seed Studio', NULL,
       'Synthetic country-specific seed listing for safe browse localization.', TRUE, 'PUBLISHED', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'a140c2c0-0000-4000-8000-000000000143');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'a140c2c0-0000-4000-8000-000000000144', '11111111-1111-1111-1111-111111111244', '22222222-2222-2222-2222-222222222244',
       'Car Care Essentials Kit Australia', 'Auto care and cleaning kit for Australian shoppers.', 'AUTOMOTIVE_CARE', 'AUTOMOTIVE',
       'PHYSICAL', 'SHIPPING', 'AUS', 'AUD', 42.00, 49.00, 'marketplace/placeholders/automotive.png', 'NEW', 14,
       'DriveLine Sydney', TRUE, TRUE, 'SYNTHETIC', 'Sharity Country Seed Studio', NULL,
       'Synthetic country-specific seed listing for safe browse localization.', TRUE, 'PUBLISHED', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'a140c2c0-0000-4000-8000-000000000144');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'a140c2c0-0000-4000-8000-000000000145', '11111111-1111-1111-1111-111111111245', '22222222-2222-2222-2222-222222222245',
       'Collectibles Vault Germany', 'Curated collectible bundle for German shoppers.', 'COLLECTIBLES', 'MARKETPLACE',
       'PHYSICAL', 'SHIPPING', 'DEU', 'EUR', 79.00, 94.00, 'marketplace/placeholders/collectibles.png', 'NEW', 8,
       'RareShelf Berlin', TRUE, TRUE, 'SYNTHETIC', 'Sharity Country Seed Studio', NULL,
       'Synthetic country-specific seed listing for safe browse localization.', TRUE, 'PUBLISHED', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'a140c2c0-0000-4000-8000-000000000145');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'a140c2c0-0000-4000-8000-000000000146', '11111111-1111-1111-1111-111111111246', '22222222-2222-2222-2222-222222222246',
       'Digital Code Pack France', 'Fast delivery digital code bundle for French shoppers.', 'MARKETPLACE_GIFT_CARDS', 'MARKETPLACE',
       'DIGITAL', 'INSTANT', 'FRA', 'EUR', 44.00, 52.00, 'marketplace/placeholders/gift_cards.png', 'DIGITAL', 19,
       'CodeSprint Paris', TRUE, TRUE, 'SYNTHETIC', 'Sharity Country Seed Studio', NULL,
       'Synthetic country-specific seed listing for safe browse localization.', TRUE, 'PUBLISHED', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'a140c2c0-0000-4000-8000-000000000146');
