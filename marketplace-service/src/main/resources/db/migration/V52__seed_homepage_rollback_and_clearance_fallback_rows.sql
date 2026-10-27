-- Inserts fallback rows for the homepage rollback and clearance sections when the
-- existing seeded inventory is missing in a QA/local MySQL database.

INSERT IGNORE INTO listing (
    public_id, provider_account_public_id, created_by_user_public_id,
    title, description, category_code, vertical_code, product_type, delivery_type,
    fulfillment_scope, provider_country_code, currency_code, price_amount,
    original_price_amount, image_key, condition_label, stock_quantity,
    seller_display_name, featured, verified_seller, source_type, source_name,
    source_url, license_note, rollback_offer_expires_at, demo_seed,
    listing_status, created_at, updated_at
) VALUES
('home-rbcl-001', 'ACCT-SELLER-VERIFIED-001', 'USER-SELLER-001',
 'PlayStation Plus 3-Month Code', 'Instant digital code with a rollback timer and deep discount for testing the homepage shelf.', 'GIFT_CARDS', 'GIFT_CARDS', 'DIGITAL', 'INSTANT',
 'GLOBAL', 'US', 'USD', 24.99, 49.99, 'marketplace/placeholders/gift_cards.png', 'Digital', 1,
 'Sharity Demo Seller', TRUE, TRUE, 'SYNTHETIC', 'Sharity Demo', NULL,
 'Homepage rollback test seed', DATE_ADD(NOW(6), INTERVAL 45 DAY), TRUE,
 'PUBLISHED', DATE_SUB(NOW(6), INTERVAL 120 DAY), NOW(6)),

('home-rbcl-002', 'ACCT-SELLER-VERIFIED-001', 'USER-SELLER-001',
 'Steam Wallet $50', 'High-value digital gift card listing used to populate rollback offers and clearance rows.', 'GIFT_CARDS', 'GIFT_CARDS', 'DIGITAL', 'INSTANT',
 'GLOBAL', 'US', 'USD', 19.99, 39.99, 'marketplace/placeholders/gift_cards.png', 'Digital', 1,
 'Sharity Demo Seller', TRUE, TRUE, 'SYNTHETIC', 'Sharity Demo', NULL,
 'Homepage rollback test seed', DATE_ADD(NOW(6), INTERVAL 45 DAY), TRUE,
 'PUBLISHED', DATE_SUB(NOW(6), INTERVAL 120 DAY), NOW(6)),

('home-rbcl-003', 'ACCT-SELLER-VERIFIED-002', 'USER-SELLER-002',
 'Spotify Premium 12 Months', 'Clear discounted listing that qualifies for the rollback and clearance shelves.', 'GIFT_CARDS', 'GIFT_CARDS', 'DIGITAL', 'INSTANT',
 'GLOBAL', 'US', 'USD', 14.99, 29.99, 'marketplace/placeholders/gift_cards.png', 'Digital', 1,
 'Sharity Demo Seller', TRUE, TRUE, 'SYNTHETIC', 'Sharity Demo', NULL,
 'Homepage rollback test seed', DATE_ADD(NOW(6), INTERVAL 45 DAY), TRUE,
 'PUBLISHED', DATE_SUB(NOW(6), INTERVAL 120 DAY), NOW(6)),

('home-rbcl-004', 'ACCT-SELLER-VERIFIED-002', 'USER-SELLER-002',
 'Web Development Bootcamp', 'Aged course listing with a strong markdown to show the clearance section immediately.', 'COURSES', 'COURSES', 'DIGITAL', 'INSTANT',
 'GLOBAL', 'US', 'USD', 39.99, 79.99, 'marketplace/placeholders/sample_listing.png', 'Digital', 1,
 'Sharity Demo Seller', TRUE, TRUE, 'SYNTHETIC', 'Sharity Demo', NULL,
 'Homepage rollback test seed', DATE_ADD(NOW(6), INTERVAL 45 DAY), TRUE,
 'PUBLISHED', DATE_SUB(NOW(6), INTERVAL 120 DAY), NOW(6)),

('home-rbcl-005', 'ACCT-SELLER-VERIFIED-003', 'USER-SELLER-003',
 'Gold Necklace Set', 'Jewellery listing seeded for the homepage rollback and clearance rails.', 'JEWELLERY', 'JEWELLERY', 'PHYSICAL', 'SHIPPING',
 'NATIONAL', 'US', 'USD', 89.99, 179.99, 'marketplace/placeholders/jewellery.png', 'New', 1,
 'Sharity Demo Seller', TRUE, TRUE, 'SYNTHETIC', 'Sharity Demo', NULL,
 'Homepage rollback test seed', DATE_ADD(NOW(6), INTERVAL 45 DAY), TRUE,
 'PUBLISHED', DATE_SUB(NOW(6), INTERVAL 120 DAY), NOW(6)),

('home-rbcl-006', 'ACCT-SELLER-VERIFIED-003', 'USER-SELLER-003',
 'Gold Earrings Bundle', 'Another jewellery clearance seed with a visible discount for homepage testing.', 'JEWELLERY', 'JEWELLERY', 'PHYSICAL', 'SHIPPING',
 'NATIONAL', 'US', 'USD', 59.99, 119.99, 'marketplace/placeholders/jewellery.png', 'New', 1,
 'Sharity Demo Seller', TRUE, TRUE, 'SYNTHETIC', 'Sharity Demo', NULL,
 'Homepage rollback test seed', DATE_ADD(NOW(6), INTERVAL 45 DAY), TRUE,
 'PUBLISHED', DATE_SUB(NOW(6), INTERVAL 120 DAY), NOW(6)),

('home-rbcl-007', 'ACCT-SELLER-VERIFIED-004', 'USER-SELLER-004',
 'Organic Pantry Essentials Box', 'Grocery clearance seed to keep the public home page populated.', 'GROCERY', 'GROCERY', 'PHYSICAL', 'SHIPPING',
 'LOCAL', 'US', 'USD', 29.99, 59.99, 'marketplace/placeholders/sample_listing.png', 'Fresh', 1,
 'Sharity Demo Seller', TRUE, TRUE, 'SYNTHETIC', 'Sharity Demo', NULL,
 'Homepage rollback test seed', DATE_ADD(NOW(6), INTERVAL 45 DAY), TRUE,
 'PUBLISHED', DATE_SUB(NOW(6), INTERVAL 120 DAY), NOW(6)),

('home-rbcl-008', 'ACCT-SELLER-VERIFIED-004', 'USER-SELLER-004',
 'Fresh Meat Value Pack', 'Another discounted aged listing for the clearance section.', 'MEAT_SHOP', 'MEAT_SHOP', 'PHYSICAL', 'SHIPPING',
 'LOCAL', 'US', 'USD', 34.99, 69.99, 'marketplace/placeholders/sample_listing.png', 'Fresh', 1,
 'Sharity Demo Seller', TRUE, TRUE, 'SYNTHETIC', 'Sharity Demo', NULL,
 'Homepage rollback test seed', DATE_ADD(NOW(6), INTERVAL 45 DAY), TRUE,
 'PUBLISHED', DATE_SUB(NOW(6), INTERVAL 120 DAY), NOW(6)),

('home-rbcl-009', 'ACCT-SELLER-VERIFIED-005', 'USER-SELLER-005',
 'Car Care Essentials Kit', 'Automotive deal row for the rollback and clearance shelves.', 'AUTOMOTIVE', 'AUTOMOTIVE', 'PHYSICAL', 'SHIPPING',
 'NATIONAL', 'US', 'USD', 21.99, 43.99, 'marketplace/placeholders/sample_listing.png', 'New', 1,
 'Sharity Demo Seller', TRUE, TRUE, 'SYNTHETIC', 'Sharity Demo', NULL,
 'Homepage rollback test seed', DATE_ADD(NOW(6), INTERVAL 45 DAY), TRUE,
 'PUBLISHED', DATE_SUB(NOW(6), INTERVAL 120 DAY), NOW(6)),

('home-rbcl-010', 'ACCT-SELLER-VERIFIED-006', 'USER-SELLER-006',
 'Microsoft Office 365 License', 'Software license discounted enough to qualify for clearance.', 'SOFTWARE', 'SOFTWARE', 'DIGITAL', 'INSTANT',
 'GLOBAL', 'US', 'USD', 44.99, 89.99, 'marketplace/placeholders/sample_listing.png', 'Digital', 1,
 'Sharity Demo Seller', TRUE, TRUE, 'SYNTHETIC', 'Sharity Demo', NULL,
 'Homepage rollback test seed', DATE_ADD(NOW(6), INTERVAL 45 DAY), TRUE,
 'PUBLISHED', DATE_SUB(NOW(6), INTERVAL 120 DAY), NOW(6));
