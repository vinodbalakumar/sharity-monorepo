ALTER TABLE category_master
    ADD COLUMN country_code VARCHAR(3) NULL AFTER vertical_code;

CREATE INDEX idx_category_master_country_scope
    ON category_master (active, country_code, vertical_code, display_order, category_name);

INSERT INTO category_master (
    category_code, category_name, category_slug, vertical_code, country_code, icon_ref, active, display_order, created_at, updated_at
)
SELECT 'ONE_GRAM_JEWELLERY', 'One Gram Jewellery', 'one-gram-jewellery', 'MARKETPLACE', 'IND', 'diamond', TRUE, 6, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM category_master WHERE category_code = 'ONE_GRAM_JEWELLERY');

INSERT INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id, title, description, category_code, vertical_code,
    product_type, delivery_type, provider_country_code, currency_code, price_amount, original_price_amount, image_url,
    condition_label, stock_quantity, seller_display_name, featured, verified_seller, source_type, source_name, source_url,
    license_note, demo_seed, listing_status, created_at, updated_at
)
SELECT 'a140c2c0-0000-4000-8000-000000000147', '11111111-1111-1111-1111-111111111247', '22222222-2222-2222-2222-222222222247',
       'One Gram Jewellery Pendant', 'Lightweight one gram jewellery style pendant for Indian shoppers.', 'ONE_GRAM_JEWELLERY', 'MARKETPLACE',
       'PHYSICAL', 'SHIPPING', 'IND', 'INR', 2499.00, 2999.00, 'marketplace/placeholders/collectibles.png', 'NEW', 10,
       'ShineCraft India', TRUE, TRUE, 'SYNTHETIC', 'Sharity Country Seed Studio', NULL,
       'Synthetic country-specific seed listing for safe browse localization.', TRUE, 'PUBLISHED', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM listing WHERE public_id = 'a140c2c0-0000-4000-8000-000000000147');
