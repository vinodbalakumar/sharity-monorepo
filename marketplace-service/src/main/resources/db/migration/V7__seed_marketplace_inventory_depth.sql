INSERT INTO marketplace_category (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'MARKETPLACE_GIFT_CARDS', 'Gift Cards', 'marketplace-gift-cards', 'MARKETPLACE', 'card_giftcard', TRUE, 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM marketplace_category WHERE category_code = 'MARKETPLACE_GIFT_CARDS');

INSERT INTO marketplace_category (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'MARKETPLACE_GAMING', 'Gaming', 'marketplace-gaming', 'MARKETPLACE', 'sports_esports', TRUE, 2, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM marketplace_category WHERE category_code = 'MARKETPLACE_GAMING');

INSERT INTO marketplace_category (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'MARKETPLACE_ELECTRONICS', 'Electronics', 'marketplace-electronics', 'MARKETPLACE', 'devices', TRUE, 3, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM marketplace_category WHERE category_code = 'MARKETPLACE_ELECTRONICS');

INSERT INTO marketplace_category (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'MARKETPLACE_COLLECTIBLES', 'Collectibles', 'marketplace-collectibles', 'MARKETPLACE', 'auto_awesome', TRUE, 4, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM marketplace_category WHERE category_code = 'MARKETPLACE_COLLECTIBLES');

INSERT INTO marketplace_category (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'MARKETPLACE_LOCAL_DEALS', 'Local Deals', 'marketplace-local-deals', 'MARKETPLACE', 'local_offer', TRUE, 5, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM marketplace_category WHERE category_code = 'MARKETPLACE_LOCAL_DEALS');

INSERT INTO marketplace_category (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'GROCERY_PACKAGED', 'Packaged Food', 'grocery-packaged', 'GROCERY', 'inventory_2', TRUE, 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM marketplace_category WHERE category_code = 'GROCERY_PACKAGED');

INSERT INTO marketplace_category (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'GROCERY_EVERYDAY', 'Everyday Essentials', 'grocery-everyday', 'GROCERY', 'shopping_basket', TRUE, 2, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM marketplace_category WHERE category_code = 'GROCERY_EVERYDAY');

INSERT INTO marketplace_category (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'MEAT_SHOP_FRESH', 'Fresh Cuts', 'meat-shop-fresh', 'MEAT_SHOP', 'set_meal', TRUE, 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM marketplace_category WHERE category_code = 'MEAT_SHOP_FRESH');

INSERT INTO marketplace_category (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'MEAT_SHOP_SEAFOOD', 'Seafood', 'meat-shop-seafood', 'MEAT_SHOP', 'water', TRUE, 2, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM marketplace_category WHERE category_code = 'MEAT_SHOP_SEAFOOD');

INSERT INTO marketplace_category (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'OTC_WELLNESS', 'OTC Wellness', 'otc-wellness', 'PHARMACY', 'medical_services', TRUE, 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM marketplace_category WHERE category_code = 'OTC_WELLNESS');

INSERT INTO marketplace_category (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'PERSONAL_CARE', 'Personal Care', 'personal-care', 'PHARMACY', 'spa', TRUE, 2, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM marketplace_category WHERE category_code = 'PERSONAL_CARE');

INSERT INTO marketplace_category (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'AUTOMOTIVE_ACCESSORIES', 'Accessories', 'automotive-accessories', 'AUTOMOTIVE', 'directions_car', TRUE, 1, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM marketplace_category WHERE category_code = 'AUTOMOTIVE_ACCESSORIES');

INSERT INTO marketplace_category (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'AUTOMOTIVE_CARE', 'Care Kits', 'automotive-care', 'AUTOMOTIVE', 'car_wash', TRUE, 2, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM marketplace_category WHERE category_code = 'AUTOMOTIVE_CARE');

INSERT IGNORE INTO listing (
    public_id, title, description, product_type, delivery_type, currency_code,
    price_amount, original_price_amount, image_url, condition_label, stock_quantity,
    source_type, source_name, source_url, license_note, demo_seed,
    seller_display_name, verified_seller, category_code, vertical_code, listing_status, created_at, updated_at
)
VALUES
('9f1f89eb-88b8-4b1b-b7a0-100000000001', 'Sharity Credit Bundle 500', 'Synthetic marketplace gift card style credit bundle for safe browse depth.', 'DIGITAL', 'MANUAL', 'USD', 425.00, 450.00, NULL, 'Digital', 12, 'SYNTHETIC', 'Sharity Seed Studio', NULL, 'Original synthetic listing created for Sharity browse depth.', TRUE, 'Sharity Credits', TRUE, 'GIFT_CARDS', 'MARKETPLACE', 'PUBLISHED', NOW(6), NOW(6)),
('9f1f89eb-88b8-4b1b-b7a0-100000000002', 'Weekend Game Pass Voucher', 'Original demo-safe game voucher listing for browse density.', 'DIGITAL', 'MANUAL', 'USD', 34.00, 39.00, NULL, 'Digital', 18, 'SYNTHETIC', 'Sharity Seed Studio', NULL, 'Original synthetic listing created for Sharity browse depth.', TRUE, 'NovaTrade', TRUE, 'GIFT_CARDS', 'MARKETPLACE', 'PUBLISHED', NOW(6), NOW(6)),
('9f1f89eb-88b8-4b1b-b7a0-100000000003', 'Indie Headset Pro', 'Noise-isolating headset with padded ear cups and mic boom.', 'PHYSICAL', 'SHIPPING', 'USD', 79.00, 99.00, NULL, 'New', 7, 'SYNTHETIC', 'Sharity Seed Studio', NULL, 'Original synthetic listing created for Sharity browse depth.', TRUE, 'PixelArc Studio', TRUE, 'ELECTRONICS', 'MARKETPLACE', 'PUBLISHED', NOW(6), NOW(6)),
('9f1f89eb-88b8-4b1b-b7a0-100000000004', 'Collectible Card Vault Pack', 'Curated starter pack of sealed collectible cards for hobby buyers.', 'PHYSICAL', 'SHIPPING', 'USD', 42.00, 58.00, NULL, 'New', 15, 'SYNTHETIC', 'Sharity Seed Studio', NULL, 'Original synthetic listing created for Sharity browse depth.', TRUE, 'Collectify House', TRUE, 'COLLECTIBLES', 'MARKETPLACE', 'PUBLISHED', NOW(6), NOW(6)),
('9f1f89eb-88b8-4b1b-b7a0-100000000005', 'City Cleanup Labor Voucher', 'Local services listing for mobile car wash and basic pickup support.', 'SERVICE', 'LOCAL_PICKUP', 'USD', 55.00, 70.00, NULL, 'New', 20, 'SYNTHETIC', 'Sharity Seed Studio', NULL, 'Original synthetic listing created for Sharity browse depth.', TRUE, 'MetroTask Local', TRUE, 'SERVICES', 'MARKETPLACE', 'PUBLISHED', NOW(6), NOW(6)),
('9f1f89eb-88b8-4b1b-b7a0-100000000006', 'Cloud Console Game Key', 'Instant delivery digital code for a fictional indie game platform.', 'DIGITAL', 'INSTANT', 'USD', 29.00, 35.00, NULL, 'Digital', 50, 'SYNTHETIC', 'Sharity Seed Studio', NULL, 'Original synthetic listing created for Sharity browse depth.', TRUE, 'KeySprint', TRUE, 'GAMING', 'MARKETPLACE', 'PUBLISHED', NOW(6), NOW(6)),
('9f1f89eb-88b8-4b1b-b7a0-100000000007', 'Organic Pantry Essentials Box', 'Packaged pantry starter box with everyday essentials for families.', 'PHYSICAL', 'SHIPPING', 'USD', 31.00, 38.00, NULL, 'New', 24, 'SYNTHETIC', 'Sharity Seed Studio', NULL, 'Original synthetic listing created for Sharity browse depth.', TRUE, 'Sharity Grocer', TRUE, 'GROCERY_PACKAGED', 'GROCERY', 'PUBLISHED', NOW(6), NOW(6)),
('9f1f89eb-88b8-4b1b-b7a0-100000000008', 'Daily Essentials Value Cart', 'Everyday essentials bundle with convenient repeat-buy items.', 'PHYSICAL', 'SHIPPING', 'USD', 24.00, 29.00, NULL, 'New', 30, 'SYNTHETIC', 'Sharity Seed Studio', NULL, 'Original synthetic listing created for Sharity browse depth.', TRUE, 'Sharity Grocer', TRUE, 'GROCERY_EVERYDAY', 'GROCERY', 'PUBLISHED', NOW(6), NOW(6)),
('9f1f89eb-88b8-4b1b-b7a0-100000000009', 'Seafood Sampler Box', 'Frozen seafood selection for seafood meal planning.', 'PHYSICAL', 'SHIPPING', 'USD', 48.00, 59.00, NULL, 'New', 16, 'SYNTHETIC', 'Sharity Seed Studio', NULL, 'Original synthetic listing created for Sharity browse depth.', TRUE, 'NorthWave Foods', TRUE, 'MEAT_SHOP_SEAFOOD', 'MEAT_SHOP', 'PUBLISHED', NOW(6), NOW(6)),
('9f1f89eb-88b8-4b1b-b7a0-100000000010', 'Poultry Meal Prep Pack', 'Protein pack with convenient portioned meal prep selection.', 'PHYSICAL', 'SHIPPING', 'USD', 36.00, 44.00, NULL, 'Fresh', 22, 'SYNTHETIC', 'Sharity Seed Studio', NULL, 'Original synthetic listing created for Sharity browse depth.', TRUE, 'NorthWave Foods', TRUE, 'MEAT_SHOP_FRESH', 'MEAT_SHOP', 'PUBLISHED', NOW(6), NOW(6)),
('9f1f89eb-88b8-4b1b-b7a0-100000000011', 'OTC Wellness Starter Kit', 'General wellness kit with permitted OTC wellness support items.', 'PHYSICAL', 'SHIPPING', 'USD', 18.00, 23.00, NULL, 'New', 40, 'SYNTHETIC', 'Sharity Seed Studio', NULL, 'Original synthetic listing created for Sharity browse depth.', TRUE, 'WellSpring OTC', TRUE, 'OTC_WELLNESS', 'PHARMACY', 'PUBLISHED', NOW(6), NOW(6)),
('9f1f89eb-88b8-4b1b-b7a0-100000000012', 'Personal Care Travel Pack', 'Travel-friendly self-care essentials and daily care items.', 'PHYSICAL', 'SHIPPING', 'USD', 22.00, 27.00, NULL, 'New', 26, 'SYNTHETIC', 'Sharity Seed Studio', NULL, 'Original synthetic listing created for Sharity browse depth.', TRUE, 'WellSpring OTC', TRUE, 'PERSONAL_CARE', 'PHARMACY', 'PUBLISHED', NOW(6), NOW(6)),
('9f1f89eb-88b8-4b1b-b7a0-100000000013', 'Car Care Essentials Kit', 'Automotive cleaning and quick-detail starter kit.', 'PHYSICAL', 'SHIPPING', 'USD', 28.00, 35.00, NULL, 'New', 19, 'SYNTHETIC', 'Sharity Seed Studio', NULL, 'Original synthetic listing created for Sharity browse depth.', TRUE, 'DriveLine Supply', TRUE, 'AUTOMOTIVE_CARE', 'AUTOMOTIVE', 'PUBLISHED', NOW(6), NOW(6)),
('9f1f89eb-88b8-4b1b-b7a0-100000000014', 'USB Fast Charge Adapter', 'Compact charging adapter for vehicle and home use.', 'PHYSICAL', 'SHIPPING', 'USD', 16.00, 20.00, NULL, 'New', 55, 'SYNTHETIC', 'Sharity Seed Studio', NULL, 'Original synthetic listing created for Sharity browse depth.', TRUE, 'DriveLine Supply', TRUE, 'AUTOMOTIVE_ACCESSORIES', 'AUTOMOTIVE', 'PUBLISHED', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE updated_at = VALUES(updated_at);
