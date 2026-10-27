-- Seed listings with SOLD status to represent top-selling categories
-- This ensures RINGS and EARRINGS have high sales counts

-- Add more SOLD listings for RINGS category (top seller)
INSERT INTO listing (
  public_id, provider_account_public_id, created_by_user_public_id, title, description,
  category_code, vertical_code, product_type, delivery_type, fulfillment_scope,
  provider_country_code, currency_code, price_amount, original_price_amount,
  image_key, condition_label, stock_quantity, seller_display_name, featured,
  verified_seller, source_type, source_name, license_note, demo_seed, listing_status, created_at, updated_at
)
VALUES
-- RINGS - Establish as top seller with 12 SOLD + 4 ACTIVE = 16 total
('sold-rings-001', '12c18f84-bcc0-4bd2-8b7c-df1086a46993', '22222222-2222-2222-2222-222222222205',
 'Classic Gold Band', 'Timeless gold ring for everyday wear', 'RINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'US', 'USD', 45.00, 89.99,
 'listings/rings_001.jpg', 'New', 0, 'Seller 12c18f84', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

('sold-rings-002', 'e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0', '22222222-2222-2222-2222-222222222206',
 'Silver Ring Set', 'Premium silver ring collection', 'RINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'IN', 'USD', 35.00, 74.99,
 'listings/rings_002.jpg', 'New', 0, 'Verified Reseller', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

('sold-rings-003', 'b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7', '22222222-2222-2222-2222-222222222207',
 'Diamond Style Ring', 'Beautiful diamond-inspired ring', 'RINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'US', 'USD', 52.00, 99.99,
 'listings/rings_003.jpg', 'New', 0, 'Trusted Marketplace', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

('sold-rings-004', 'h8i9j0k1-l2m3-n4o5-p6q7-r8s9t0u1v2w3', '22222222-2222-2222-2222-222222222208',
 'Vintage Style Ring', 'Elegant vintage-inspired design', 'RINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'UK', 'USD', 48.00, 85.00,
 'listings/rings_004.jpg', 'Like New', 0, 'Certified Seller', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

('sold-rings-005', 'f6g7h8i9-j0k1-l2m3-n4o5-p6q7r8s9t0u1', '22222222-2222-2222-2222-222222222209',
 'Cubic Zirconia Ring', 'Sparkling cubic zirconia stone ring', 'RINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'CA', 'USD', 32.00, 69.99,
 'listings/rings_005.jpg', 'New', 0, 'Premium Quality Hub', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

('sold-rings-006', 'd4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9', '22222222-2222-2222-2222-222222222210',
 'Pearl Ring', 'Elegant pearl accent ring', 'RINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'US', 'USD', 42.00, 79.99,
 'listings/rings_006.jpg', 'New', 0, 'Jewel Crafts', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

('sold-rings-007', 'c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8', '22222222-2222-2222-2222-222222222211',
 'Adjustable Ring', 'One-size-fits-all adjustable ring', 'RINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'AU', 'USD', 28.00, 59.99,
 'listings/rings_007.jpg', 'New', 0, 'Expert Traders', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

('sold-rings-008', 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', '22222222-2222-2222-2222-222222222212',
 'Rose Gold Ring', 'Trendy rose gold finish ring', 'RINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'US', 'USD', 38.00, 84.99,
 'listings/rings_008.jpg', 'New', 0, 'TechHub Pro', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

('sold-rings-009', 'j0k1l2m3-n4o5-p6q7-r8s9-t0u1v2w3x4y5', '22222222-2222-2222-2222-222222222213',
 'Crystal Ring', 'Sparkling crystal stone ring', 'RINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'NZ', 'USD', 40.00, 79.99,
 'listings/rings_009.jpg', 'New', 0, 'Same Day Delivery', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

('sold-rings-010', 'i9j0k1l2-m3n4-o5p6-q7r8-s9t0u1v2w3x4', '22222222-2222-2222-2222-222222222214',
 'Minimalist Ring', 'Simple elegant ring design', 'RINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'SG', 'USD', 25.00, 49.99,
 'listings/rings_010.jpg', 'New', 0, 'Bulk Distributor', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

-- EARRINGS - High seller with 10 SOLD + 4 ACTIVE = 14 total
('sold-earrings-001', '5acf66f7-a7be-449a-993e-8042dbdd7b54', '22222222-2222-2222-2222-222222222215',
 'Pearl Stud Earrings', 'Classic pearl studs for everyday', 'EARRINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'US', 'USD', 22.00, 45.00,
 'listings/earrings_001.jpg', 'New', 0, 'Luxury Brands', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

('sold-earrings-002', 'g7h8i9j0-k1l2-m3n4-o5p6-q7r8s9t0u1v2', '22222222-2222-2222-2222-222222222216',
 'Gold Drop Earrings', 'Elegant gold drop design', 'EARRINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'IN', 'USD', 28.00, 65.00,
 'listings/earrings_002.jpg', 'New', 0, 'Flash Sale Master', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

('sold-earrings-003', 'e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0', '22222222-2222-2222-2222-222222222217',
 'Crystal Hoop Earrings', 'Sparkling crystal hoops', 'EARRINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'UK', 'USD', 24.00, 55.00,
 'listings/earrings_003.jpg', 'New', 0, 'Premium Quality Hub', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

('sold-earrings-004', 'b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7', '22222222-2222-2222-2222-222222222218',
 'Silver Chandelier Earrings', 'Gorgeous silver chandelier style', 'EARRINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'US', 'USD', 31.00, 72.00,
 'listings/earrings_004.jpg', 'New', 0, 'Trusted Marketplace', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

('sold-earrings-005', 'd4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9', '22222222-2222-2222-2222-222222222219',
 'Rose Gold Studs', 'Trendy rose gold stud earrings', 'EARRINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'CA', 'USD', 19.00, 42.00,
 'listings/earrings_005.jpg', 'New', 0, 'Value Sellers Co', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

('sold-earrings-006', 'h8i9j0k1-l2m3-n4o5-p6q7-r8s9t0u1v2w3', '22222222-2222-2222-2222-222222222220',
 'Turquoise Earrings', 'Colorful turquoise stone earrings', 'EARRINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'AU', 'USD', 26.00, 58.00,
 'listings/earrings_006.jpg', 'New', 0, 'Certified Seller', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

('sold-earrings-007', 'f6g7h8i9-j0k1-l2m3-n4o5-p6q7r8s9t0u1', '22222222-2222-2222-2222-222222222221',
 'Beaded Earrings', 'Colorful beaded design earrings', 'EARRINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'NZ', 'USD', 20.00, 48.00,
 'listings/earrings_007.jpg', 'New', 0, 'GiftCard Express', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

('sold-earrings-008', 'j0k1l2m3-n4o5-p6q7-r8s9-t0u1v2w3x4y5', '22222222-2222-2222-2222-222222222222',
 'Statement Earrings', 'Bold statement style earrings', 'EARRINGS', 'IMITATION_JEWELLERY',
 'PHYSICAL', 'SHIPPING', 'GLOBAL', 'SG', 'USD', 29.00, 67.00,
 'listings/earrings_008.jpg', 'New', 0, 'Gaming Elite Store', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

-- GIFT_CARDS - Medium seller with more SOLD
('sold-giftcard-001', '12c18f84-bcc0-4bd2-8b7c-df1086a46993', '22222222-2222-2222-2222-222222222223',
 'iTunes Gift Card $50', '50 dollar iTunes gift card', 'GIFT_CARDS', 'DIGITAL_MARKETPLACE',
 'DIGITAL', 'INSTANT', 'GLOBAL', 'US', 'USD', 39.00, 50.00,
 'listings/giftcard_001.jpg', 'Digital', 100, 'Digital Codes Hub', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

('sold-giftcard-002', 'b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7', '22222222-2222-2222-2222-222222222224',
 'Amazon Gift Card $100', '100 dollar Amazon card', 'GIFT_CARDS', 'DIGITAL_MARKETPLACE',
 'DIGITAL', 'INSTANT', 'GLOBAL', 'US', 'USD', 82.00, 100.00,
 'listings/giftcard_002.jpg', 'Digital', 100, 'Trusted Marketplace', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6)),

-- GAMING - Medium seller
('sold-gaming-001', 'bdaa03b3-4ed7-47c4-baa9-d24215590aef', '22222222-2222-2222-2222-222222222225',
 'PlayStation Plus 12 Months', 'Full year PS Plus subscription', 'GAMING', 'DIGITAL_MARKETPLACE',
 'DIGITAL', 'INSTANT', 'GLOBAL', 'US', 'USD', 45.00, 60.00,
 'listings/gaming_001.jpg', 'Digital', 100, 'Gaming Elite Store', FALSE, TRUE, 'DEMO', 'Sharity Seed', 'Demo listing', TRUE, 'SOLD', NOW(6), NOW(6));

-- Add indices for performance on top category queries
ALTER TABLE listing ADD INDEX idx_category_status (category_code, listing_status);
ALTER TABLE listing ADD INDEX idx_fulfillment_country (fulfillment_scope, provider_country_code);
ALTER TABLE listing ADD INDEX idx_discount_calc (original_price_amount, price_amount);
