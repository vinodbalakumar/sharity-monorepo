-- Seed data for Digital Marketplace and Imitation Jewellery categories (PostgreSQL version)
-- This migration is idempotent and cleans existing categories before seeding

-- Delete existing categories to ensure clean state
DELETE FROM category_master
WHERE vertical_code IN ('MARKETPLACE', 'JEWELLERY');

-- Move the identity sequence past every surviving row. Other verticals keep their
-- existing ids, so restarting at 1 would collide with them (e.g. id 7).
SELECT setval(
    pg_get_serial_sequence('category_master', 'id'),
    COALESCE((SELECT MAX(id) FROM category_master), 0) + 1,
    false
);

-- ============================================
-- DIGITAL MARKETPLACE CATEGORIES (16 total)
-- ============================================

INSERT INTO category_master (
    category_code, category_name, category_slug, vertical_code, country_code, icon_ref, active, display_order, image_url, created_at, updated_at
) VALUES
-- 1. Gift Cards
('GIFT_CARDS', 'Gift Cards', 'gift-cards', 'MARKETPLACE', NULL, 'gift-outline', TRUE, 1,
 '/assets/categories/digital-marketplace/gift-cards.png', NOW(), NOW()),

-- 2. Gaming
('GAMING', 'Gaming', 'gaming', 'MARKETPLACE', NULL, 'game-controller-outline', TRUE, 2,
 '/assets/categories/digital-marketplace/gaming.png', NOW(), NOW()),

-- 3. Software & Licenses
('SOFTWARE_LICENSES', 'Software & Licenses', 'software-licenses', 'MARKETPLACE', NULL, 'code-outline', TRUE, 3,
 '/assets/categories/digital-marketplace/software-licenses.png', NOW(), NOW()),

-- 4. Subscriptions
('SUBSCRIPTIONS', 'Subscriptions', 'subscriptions', 'MARKETPLACE', NULL, 'notifications-outline', TRUE, 4,
 '/assets/categories/digital-marketplace/subscriptions.png', NOW(), NOW()),

-- 5. Digital Services
('DIGITAL_SERVICES', 'Digital Services', 'digital-services', 'MARKETPLACE', NULL, 'briefcase-outline', TRUE, 5,
 '/assets/categories/digital-marketplace/digital-services.png', NOW(), NOW()),

-- 6. Templates & Digital Assets
('TEMPLATES_DIGITAL_ASSETS', 'Templates & Digital Assets', 'templates-digital-assets', 'MARKETPLACE', NULL, 'layers-outline', TRUE, 6,
 '/assets/categories/digital-marketplace/templates-digital-assets.png', NOW(), NOW()),

-- 7. E-books & Study Material
('EBOOKS_STUDY_MATERIAL', 'E-books & Study Material', 'ebooks-study-material', 'MARKETPLACE', NULL, 'book-outline', TRUE, 7,
 '/assets/categories/digital-marketplace/ebooks-study-material.png', NOW(), NOW()),

-- 8. Courses & Learning
('COURSES_LEARNING', 'Courses & Learning', 'courses-learning', 'MARKETPLACE', NULL, 'school-outline', TRUE, 8,
 '/assets/categories/digital-marketplace/courses-learning.png', NOW(), NOW()),

-- 9. Digital Art & Design
('DIGITAL_ART_DESIGN', 'Digital Art & Design', 'digital-art-design', 'MARKETPLACE', NULL, 'palette-outline', TRUE, 9,
 '/assets/categories/digital-marketplace/digital-art-design.png', NOW(), NOW()),

-- 10. Music & Audio
('MUSIC_AUDIO', 'Music & Audio', 'music-audio', 'MARKETPLACE', NULL, 'musical-notes-outline', TRUE, 10,
 '/assets/categories/digital-marketplace/music-audio.png', NOW(), NOW()),

-- 11. Video & Media Assets
('VIDEO_MEDIA_ASSETS', 'Video & Media Assets', 'video-media-assets', 'MARKETPLACE', NULL, 'videocam-outline', TRUE, 11,
 '/assets/categories/digital-marketplace/video-media-assets.png', NOW(), NOW()),

-- 12. Social Media & Marketing
('SOCIAL_MEDIA_MARKETING', 'Social Media & Marketing', 'social-media-marketing', 'MARKETPLACE', NULL, 'megaphone-outline', TRUE, 12,
 '/assets/categories/digital-marketplace/social-media-marketing.png', NOW(), NOW()),

-- 13. Accounts & Access
('ACCOUNTS_ACCESS', 'Accounts & Access', 'accounts-access', 'MARKETPLACE', NULL, 'key-outline', TRUE, 13,
 '/assets/categories/digital-marketplace/accounts-access.png', NOW(), NOW()),

-- 14. Domains & Web Assets
('DOMAINS_WEB_ASSETS', 'Domains & Web Assets', 'domains-web-assets', 'MARKETPLACE', NULL, 'globe-outline', TRUE, 14,
 '/assets/categories/digital-marketplace/domains-web-assets.png', NOW(), NOW()),

-- 15. Finance & Business Digital Products
('FINANCE_BUSINESS_DIGITAL_PRODUCTS', 'Finance & Business Digital Products', 'finance-business-digital-products', 'MARKETPLACE', NULL, 'trending-up-outline', TRUE, 15,
 '/assets/categories/digital-marketplace/finance-business-digital-products.png', NOW(), NOW()),

-- 16. Mobile & Desktop Apps
('MOBILE_DESKTOP_APPS', 'Mobile & Desktop Apps', 'mobile-desktop-apps', 'MARKETPLACE', NULL, 'phone-portrait-outline', TRUE, 16,
 '/assets/categories/digital-marketplace/mobile-desktop-apps.png', NOW(), NOW());

-- ============================================
-- IMITATION JEWELLERY CATEGORIES (16 total)
-- ============================================

INSERT INTO category_master (
    category_code, category_name, category_slug, vertical_code, country_code, icon_ref, active, display_order, image_url, created_at, updated_at
) VALUES
-- 1. Necklace Sets
('NECKLACE_SETS', 'Necklace Sets', 'necklace-sets', 'JEWELLERY', NULL, 'diamond-outline', TRUE, 1,
 '/assets/categories/imitation-jewellery/necklace-sets.png', NOW(), NOW()),

-- 2. Earrings
('EARRINGS', 'Earrings', 'earrings', 'JEWELLERY', NULL, 'diamond-outline', TRUE, 2,
 '/assets/categories/imitation-jewellery/earrings.png', NOW(), NOW()),

-- 3. Bangles & Bracelets
('BANGLES_BRACELETS', 'Bangles & Bracelets', 'bangles-bracelets', 'JEWELLERY', NULL, 'diamond-outline', TRUE, 3,
 '/assets/categories/imitation-jewellery/bangles-bracelets.png', NOW(), NOW()),

-- 4. Rings
('RINGS', 'Rings', 'rings', 'JEWELLERY', NULL, 'diamond-outline', TRUE, 4,
 '/assets/categories/imitation-jewellery/rings.png', NOW(), NOW()),

-- 5. Mangalsutra
('MANGALSUTRA', 'Mangalsutra', 'mangalsutra', 'JEWELLERY', NULL, 'diamond-outline', TRUE, 5,
 '/assets/categories/imitation-jewellery/mangalsutra.png', NOW(), NOW()),

-- 6. Anklets & Toe Rings
('ANKLETS_TOE_RINGS', 'Anklets & Toe Rings', 'anklets-toe-rings', 'JEWELLERY', NULL, 'diamond-outline', TRUE, 6,
 '/assets/categories/imitation-jewellery/anklets-toe-rings.png', NOW(), NOW()),

-- 7. Hair Accessories
('HAIR_ACCESSORIES', 'Hair Accessories', 'hair-accessories', 'JEWELLERY', NULL, 'diamond-outline', TRUE, 7,
 '/assets/categories/imitation-jewellery/hair-accessories.png', NOW(), NOW()),

-- 8. Nose Jewellery
('NOSE_JEWELLERY', 'Nose Jewellery', 'nose-jewellery', 'JEWELLERY', NULL, 'diamond-outline', TRUE, 8,
 '/assets/categories/imitation-jewellery/nose-jewellery.png', NOW(), NOW()),

-- 9. Waist Jewellery
('WAIST_JEWELLERY', 'Waist Jewellery', 'waist-jewellery', 'JEWELLERY', NULL, 'diamond-outline', TRUE, 9,
 '/assets/categories/imitation-jewellery/waist-jewellery.png', NOW(), NOW()),

-- 10. Jewellery Combo Sets
('JEWELLERY_COMBO_SETS', 'Jewellery Combo Sets', 'jewellery-combo-sets', 'JEWELLERY', NULL, 'diamond-outline', TRUE, 10,
 '/assets/categories/imitation-jewellery/jewellery-combo-sets.png', NOW(), NOW()),

-- 11. Men's Jewellery
('MENS_JEWELLERY', 'Men''s Jewellery', 'mens-jewellery', 'JEWELLERY', NULL, 'diamond-outline', TRUE, 11,
 '/assets/categories/imitation-jewellery/mens-jewellery.png', NOW(), NOW()),

-- 12. Kids Jewellery
('KIDS_JEWELLERY', 'Kids Jewellery', 'kids-jewellery', 'JEWELLERY', NULL, 'diamond-outline', TRUE, 12,
 '/assets/categories/imitation-jewellery/kids-jewellery.png', NOW(), NOW()),

-- 13. Oxidised Jewellery
('OXIDISED_JEWELLERY', 'Oxidised Jewellery', 'oxidised-jewellery', 'JEWELLERY', NULL, 'diamond-outline', TRUE, 13,
 '/assets/categories/imitation-jewellery/oxidised-jewellery.png', NOW(), NOW()),

-- 14. Pearl Jewellery
('PEARL_JEWELLERY', 'Pearl Jewellery', 'pearl-jewellery', 'JEWELLERY', NULL, 'diamond-outline', TRUE, 14,
 '/assets/categories/imitation-jewellery/pearl-jewellery.png', NOW(), NOW()),

-- 15. Kundan Jewellery
('KUNDAN_JEWELLERY', 'Kundan Jewellery', 'kundan-jewellery', 'JEWELLERY', NULL, 'diamond-outline', TRUE, 15,
 '/assets/categories/imitation-jewellery/kundan-jewellery.png', NOW(), NOW()),

-- 16. Temple Jewellery
('TEMPLE_JEWELLERY', 'Temple Jewellery', 'temple-jewellery', 'JEWELLERY', NULL, 'diamond-outline', TRUE, 16,
 '/assets/categories/imitation-jewellery/temple-jewellery.png', NOW(), NOW());

-- Verify insertions
SELECT 'Digital Marketplace Categories' AS category_type, COUNT(*) as total_count
FROM category_master WHERE vertical_code = 'MARKETPLACE';

SELECT 'Imitation Jewellery Categories' AS category_type, COUNT(*) as total_count
FROM category_master WHERE vertical_code = 'JEWELLERY';

-- Show sample data
SELECT category_code, category_name, vertical_code, image_url, active, display_order
FROM category_master
WHERE vertical_code IN ('MARKETPLACE', 'JEWELLERY')
ORDER BY vertical_code, display_order
LIMIT 40;
