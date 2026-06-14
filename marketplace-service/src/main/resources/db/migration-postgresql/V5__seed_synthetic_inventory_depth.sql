INSERT INTO category_master (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'GROCERY_PACKAGED', 'Packaged Food', 'grocery-packaged', 'GROCERY', 'inventory_2', TRUE, 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM category_master WHERE category_code = 'GROCERY_PACKAGED');

INSERT INTO category_master (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'GROCERY_EVERYDAY', 'Everyday Essentials', 'grocery-everyday', 'GROCERY', 'shopping_basket', TRUE, 2, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM category_master WHERE category_code = 'GROCERY_EVERYDAY');

INSERT INTO category_master (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'MEAT_SHOP_FRESH', 'Fresh Cuts', 'meat-shop-fresh', 'MEAT_SHOP', 'set_meal', TRUE, 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM category_master WHERE category_code = 'MEAT_SHOP_FRESH');

INSERT INTO category_master (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'MEAT_SHOP_SEAFOOD', 'Seafood', 'meat-shop-seafood', 'MEAT_SHOP', 'water', TRUE, 2, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM category_master WHERE category_code = 'MEAT_SHOP_SEAFOOD');

INSERT INTO category_master (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'OTC_WELLNESS', 'OTC Wellness', 'otc-wellness', 'PHARMACY', 'medical_services', TRUE, 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM category_master WHERE category_code = 'OTC_WELLNESS');

INSERT INTO category_master (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'PERSONAL_CARE', 'Personal Care', 'personal-care', 'PHARMACY', 'spa', TRUE, 2, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM category_master WHERE category_code = 'PERSONAL_CARE');

INSERT INTO category_master (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'AUTOMOTIVE_ACCESSORIES', 'Accessories', 'automotive-accessories', 'AUTOMOTIVE', 'directions_car', TRUE, 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM category_master WHERE category_code = 'AUTOMOTIVE_ACCESSORIES');

INSERT INTO category_master (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'AUTOMOTIVE_CLEANING', 'Cleaning Kits', 'automotive-cleaning', 'AUTOMOTIVE', 'cleaning_services', TRUE, 2, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM category_master WHERE category_code = 'AUTOMOTIVE_CLEANING');

INSERT INTO category_master (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'GIFT_CARDS_RETAIL', 'Retail Gift Cards', 'gift-cards-retail', 'GIFT_CARDS', 'card_giftcard', TRUE, 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM category_master WHERE category_code = 'GIFT_CARDS_RETAIL');

INSERT INTO category_master (
    category_code, category_name, category_slug, vertical_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'GIFT_CARDS_DIGITAL', 'Digital Gift Cards', 'gift-cards-digital', 'GIFT_CARDS', 'qr_code_2', TRUE, 2, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM category_master WHERE category_code = 'GIFT_CARDS_DIGITAL');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c101', '11111111-1111-1111-1111-111111111201', '22222222-2222-2222-2222-222222222201',
       'PlayStation Plus 3-Month Code', 'Original synthetic gift-card style listing with instant delivery.', 'GIFT_CARDS', 'MARKETPLACE',
       'DIGITAL', 'INSTANT', 'USA', 'USD', 41.99, 49.99, '', 'DIGITAL', 25, 'PixelVault Store', TRUE, TRUE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c101');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c102', '11111111-1111-1111-1111-111111111202', '22222222-2222-2222-2222-222222222202',
       'Steam Wallet $50 Code', 'Synthetic digital currency-style code with clear instant redemption.', 'GIFT_CARDS', 'MARKETPLACE',
       'DIGITAL', 'INSTANT', 'USA', 'USD', 46.00, 50.00, '', 'DIGITAL', 40, 'VaultPay Codes', TRUE, TRUE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c102');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c103', '11111111-1111-1111-1111-111111111203', '22222222-2222-2222-2222-222222222203',
       'Xbox Wireless Controller', 'Refurbished controller for console play and streaming sessions.', 'GAMING', 'MARKETPLACE',
       'PHYSICAL', 'SHIPPING', 'USA', 'USD', 52.00, 59.00, '', 'USED', 12, 'Nova Console Hub', TRUE, TRUE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c103');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c104', '11111111-1111-1111-1111-111111111204', '22222222-2222-2222-2222-222222222204',
       'Wireless Headset Bundle', 'Clear audio bundle with accessory case and fast shipping.', 'ELECTRONICS', 'MARKETPLACE',
       'PHYSICAL', 'SHIPPING', 'USA', 'USD', 79.00, 99.00, '', 'NEW', 9, 'Orbit Tech Outlet', TRUE, FALSE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c104');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c105', '11111111-1111-1111-1111-111111111205', '22222222-2222-2222-2222-222222222205',
       'Collector Trading Card Bundle', 'Curated card bundle for collectors and hobby fans.', 'COLLECTIBLES', 'MARKETPLACE',
       'PHYSICAL', 'SHIPPING', 'USA', 'USD', 129.00, 149.00, '', 'NEW', 5, 'RareShelf Collectibles', TRUE, TRUE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c105');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c106', '11111111-1111-1111-1111-111111111206', '22222222-2222-2222-2222-222222222206',
       'Local Pickup Desk Lamp', 'Practical local-deal listing with pickup-ready availability.', 'LOCAL_DEALS', 'MARKETPLACE',
       'PHYSICAL', 'LOCAL_PICKUP', 'USA', 'USD', 18.99, 24.99, '', 'NEW', 14, 'Local Deal Pro', TRUE, TRUE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c106');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c107', '11111111-1111-1111-1111-111111111207', '22222222-2222-2222-2222-222222222207',
       'Digital Design Service Voucher', 'Voucher for logo, banner, and social media design services.', 'SERVICES', 'MARKETPLACE',
       'DIGITAL', 'MANUAL', 'USA', 'USD', 95.00, 120.00, '', 'DIGITAL', 10, 'CraftedPixel Studio', TRUE, TRUE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c107');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c108', '11111111-1111-1111-1111-111111111208', '22222222-2222-2222-2222-222222222208',
       'Designer Crossbody Bag', 'Fashion accessory with clean style and safe condition notes.', 'FASHION', 'MARKETPLACE',
       'PHYSICAL', 'SHIPPING', 'USA', 'USD', 84.50, 109.00, '', 'USED', 4, 'Style Circle', FALSE, FALSE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c108');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c109', '11111111-1111-1111-1111-111111111209', '22222222-2222-2222-2222-222222222209',
       'Pantry Essentials Pack', 'Synthetic grocery bundle with packaged pantry basics.', 'GROCERY_PACKAGED', 'GROCERY',
       'PHYSICAL', 'SHIPPING', 'USA', 'USD', 26.99, 31.99, '', 'NEW', 18, 'FreshCart Pantry', TRUE, TRUE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c109');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c110', '11111111-1111-1111-1111-111111111210', '22222222-2222-2222-2222-222222222210',
       'Everyday Essentials Bundle', 'Household basics with safe synthetic merchandising copy.', 'GROCERY_EVERYDAY', 'GROCERY',
       'PHYSICAL', 'LOCAL_PICKUP', 'USA', 'USD', 19.99, 24.99, '', 'NEW', 22, 'DailyDrop Grocery', FALSE, TRUE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c110');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c111', '11111111-1111-1111-1111-111111111211', '22222222-2222-2222-2222-222222222211',
       'Chicken Breast Family Pack', 'Fresh meat-shop listing with clear cut and portion sizing.', 'MEAT_SHOP_FRESH', 'MEAT_SHOP',
       'PHYSICAL', 'SHIPPING', 'USA', 'USD', 34.99, 41.99, '', 'NEW', 11, 'PrimeCut Market', TRUE, TRUE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c111');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c112', '11111111-1111-1111-1111-111111111212', '22222222-2222-2222-2222-222222222212',
       'Seafood Grill Box', 'Seafood bundle with family-friendly portions and freshness notes.', 'MEAT_SHOP_SEAFOOD', 'MEAT_SHOP',
       'PHYSICAL', 'SHIPPING', 'USA', 'USD', 29.99, 36.99, '', 'NEW', 7, 'OceanButcher', FALSE, TRUE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c112');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c113', '11111111-1111-1111-1111-111111111213', '22222222-2222-2222-2222-222222222213',
       'OTC Vitamin Wellness Pack', 'OTC wellness bundle for everyday personal care.', 'OTC_WELLNESS', 'PHARMACY',
       'PHYSICAL', 'SHIPPING', 'USA', 'USD', 16.99, 21.99, '', 'NEW', 30, 'CareFirst OTC', TRUE, TRUE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c113');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c114', '11111111-1111-1111-1111-111111111214', '22222222-2222-2222-2222-222222222214',
       'Personal Care Starter Kit', 'Synthetic care bundle with everyday grooming essentials.', 'PERSONAL_CARE', 'PHARMACY',
       'PHYSICAL', 'LOCAL_PICKUP', 'USA', 'USD', 12.99, 15.99, '', 'NEW', 24, 'Wellness Loop', FALSE, TRUE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c114');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c115', '11111111-1111-1111-1111-111111111215', '22222222-2222-2222-2222-222222222215',
       'Car Cleaning Kit', 'Automotive cleaning and detailing starter bundle.', 'AUTOMOTIVE_CLEANING', 'AUTOMOTIVE',
       'PHYSICAL', 'SHIPPING', 'USA', 'USD', 22.99, 29.99, '', 'NEW', 17, 'DriveClean Supply', TRUE, TRUE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c115');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c116', '11111111-1111-1111-1111-111111111216', '22222222-2222-2222-2222-222222222216',
       'USB-C Fast Charger Mount', 'Useful automotive accessory for travel and charging.', 'AUTOMOTIVE_ACCESSORIES', 'AUTOMOTIVE',
       'PHYSICAL', 'SHIPPING', 'USA', 'USD', 14.49, 19.99, '', 'NEW', 35, 'RoadKit Garage', FALSE, TRUE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c116');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c117', '11111111-1111-1111-1111-111111111217', '22222222-2222-2222-2222-222222222217',
       'Retail Gift Card Bundle', 'Synthetic retail gift cards with clear delivery terms.', 'GIFT_CARDS_RETAIL', 'GIFT_CARDS',
       'DIGITAL', 'INSTANT', 'USA', 'USD', 86.00, 100.00, '', 'DIGITAL', 20, 'RetailCard Vault', TRUE, TRUE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c117');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c118', '11111111-1111-1111-1111-111111111218', '22222222-2222-2222-2222-222222222218',
       'Digital Gift Card Quick Send', 'Instant digital gift card delivery for quick checkout.', 'GIFT_CARDS_DIGITAL', 'GIFT_CARDS',
       'DIGITAL', 'DIGITAL', 'USA', 'USD', 48.00, 55.00, '', 'DIGITAL', 16, 'GiftByte Express', FALSE, TRUE,
       'SYNTHETIC', 'Sharity Seed Catalog', NULL, 'Synthetic seed inventory for safe demo use.', TRUE, 'PUBLISHED', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c118');
