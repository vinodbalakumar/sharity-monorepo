-- Clean up all existing data
DELETE FROM marketplace_event_outbox WHERE 1=1;
DELETE FROM dispute_case WHERE 1=1;
DELETE FROM customer_acceptance WHERE 1=1;
DELETE FROM delivery_submission WHERE 1=1;
DELETE FROM order_status_history WHERE 1=1;
DELETE FROM order_header WHERE 1=1;
DELETE FROM listing WHERE 1=1;

-- Reset auto-increment counters
ALTER TABLE listing AUTO_INCREMENT = 1;
ALTER TABLE order_header AUTO_INCREMENT = 1;
ALTER TABLE asset AUTO_INCREMENT = 1;
ALTER TABLE asset_storage_provider AUTO_INCREMENT = 1;

-- Reseed marketplace listings with high-quality digital products
-- Fixed UUIDs for testing and reproducibility
INSERT INTO listing (
    id, public_id, provider_account_public_id, created_by_user_public_id,
    title, description, category_code, product_type, delivery_type,
    provider_country_code, currency_code, price_amount, listing_status,
    created_at, updated_at
) VALUES
-- Gift Cards (Popular)
(1, 'LIST-GIFTCARD-AMAZON-001', 'ACCT-SELLER-VERIFIED-001', 'USER-SELLER-001',
 'Amazon Gift Card $25 USD',
 'Amazon Digital Gift Card for $25 USD. Instant delivery after payment. Can be used for any purchase on Amazon.com.',
 'GIFT_CARDS', 'DIGITAL', 'INSTANT',
 'US', 'USD', 25.00, 'ACTIVE', NOW(), NOW()),

(2, 'LIST-GIFTCARD-STEAM-002', 'ACCT-SELLER-VERIFIED-001', 'USER-SELLER-001',
 'Steam Gift Card $50 USD',
 'Steam Wallet gift card for $50 USD. Instantly delivered. Use for PC gaming on Steam platform.',
 'GIFT_CARDS', 'DIGITAL', 'INSTANT',
 'US', 'USD', 50.00, 'ACTIVE', NOW(), NOW()),

(3, 'LIST-GIFTCARD-APPLE-003', 'ACCT-SELLER-VERIFIED-002', 'USER-SELLER-002',
 'Apple iTunes Gift Card $15 USD',
 'iTunes Gift Card $15 USD. Instant email delivery. Use for apps, music, movies, and more.',
 'GIFT_CARDS', 'DIGITAL', 'INSTANT',
 'US', 'USD', 15.00, 'ACTIVE', NOW(), NOW()),

(4, 'LIST-GIFTCARD-NETFLIX-004', 'ACCT-SELLER-VERIFIED-002', 'USER-SELLER-002',
 'Netflix 3-Month Subscription',
 'Netflix subscription for 3 months. Access to all Netflix content. Code delivery within 24 hours.',
 'GIFT_CARDS', 'DIGITAL', 'MANUAL',
 'US', 'USD', 45.00, 'ACTIVE', NOW(), NOW()),

-- Game Accounts & Game Codes
(5, 'LIST-GAME-FORTNITE-005', 'ACCT-SELLER-VERIFIED-003', 'USER-SELLER-003',
 'Fortnite V-Bucks $19.99 USD',
 '2000 Fortnite V-Bucks. Instant delivery of redemption code. Use in Fortnite Battle Royale.',
 'GAMING', 'DIGITAL', 'INSTANT',
 'US', 'USD', 19.99, 'ACTIVE', NOW(), NOW()),

(6, 'LIST-GAME-ROBLOX-006', 'ACCT-SELLER-VERIFIED-003', 'USER-SELLER-003',
 'Roblox 400 Robux',
 'Roblox 400 Robux. Instant redemption code delivery. Use to purchase in-game items.',
 'GAMING', 'DIGITAL', 'INSTANT',
 'US', 'USD', 4.99, 'ACTIVE', NOW(), NOW()),

(7, 'LIST-GAME-COD-007', 'ACCT-SELLER-VERIFIED-004', 'USER-SELLER-004',
 'Call of Duty Warzone Season Pass',
 'Call of Duty Warzone 2400 CP season pass. Instant code delivery. Access premium battle pass content.',
 'GAMING', 'DIGITAL', 'INSTANT',
 'US', 'USD', 9.99, 'ACTIVE', NOW(), NOW()),

-- Software & Licenses
(8, 'LIST-SOFTWARE-OFFICE-008', 'ACCT-SELLER-VERIFIED-005', 'USER-SELLER-005',
 'Microsoft Office 365 1-Year License',
 'Office 365 Home subscription for 1 year. Valid for 6 devices. Instant code delivery via email.',
 'SOFTWARE', 'DIGITAL', 'INSTANT',
 'US', 'USD', 69.99, 'ACTIVE', NOW(), NOW()),

(9, 'LIST-SOFTWARE-PHOTOSHOP-009', 'ACCT-SELLER-VERIFIED-005', 'USER-SELLER-005',
 'Adobe Creative Cloud Single App License',
 'Adobe CC single app (Photoshop). 1-year subscription. Instant delivery.',
 'SOFTWARE', 'DIGITAL', 'INSTANT',
 'US', 'USD', 54.99, 'ACTIVE', NOW(), NOW()),

(10, 'LIST-SOFTWARE-ANTIVIRUS-010', 'ACCT-SELLER-VERIFIED-006', 'USER-SELLER-006',
 'Norton 360 Deluxe 1-Year 5-Devices',
 'Norton antivirus protection for 5 devices, 1 year subscription. Instant key delivery.',
 'SOFTWARE', 'DIGITAL', 'INSTANT',
 'US', 'USD', 39.99, 'ACTIVE', NOW(), NOW()),

-- Courses & Learning
(11, 'LIST-COURSE-PYTHON-011', 'ACCT-SELLER-VERIFIED-007', 'USER-SELLER-007',
 'Complete Python Programming Course',
 'Comprehensive Python course covering basics to advanced topics. 30+ hours of video content. Lifetime access.',
 'COURSES', 'DIGITAL', 'INSTANT',
 'US', 'USD', 14.99, 'ACTIVE', NOW(), NOW()),

(12, 'LIST-COURSE-WEBDEV-012', 'ACCT-SELLER-VERIFIED-007', 'USER-SELLER-007',
 'Web Development Bootcamp 2024',
 'Full-stack web development course. HTML, CSS, JavaScript, React, Node.js. Lifetime access and updates.',
 'COURSES', 'DIGITAL', 'INSTANT',
 'US', 'USD', 29.99, 'ACTIVE', NOW(), NOW()),

(13, 'LIST-COURSE-DATAANALYSIS-013', 'ACCT-SELLER-VERIFIED-008', 'USER-SELLER-008',
 'Data Analysis with Python & Power BI',
 'Learn data analysis, visualization, and reporting. Includes real-world projects. Certificate of completion.',
 'COURSES', 'DIGITAL', 'INSTANT',
 'US', 'USD', 24.99, 'ACTIVE', NOW(), NOW()),

-- Templates & Design Assets
(14, 'LIST-TEMPLATE-WORDPRESS-014', 'ACCT-SELLER-VERIFIED-009', 'USER-SELLER-009',
 'WordPress E-Commerce Template Pack',
 'Professional WordPress templates for e-commerce. Includes 10+ designs. Instant download with documentation.',
 'TEMPLATES', 'DIGITAL', 'INSTANT',
 'US', 'USD', 19.99, 'ACTIVE', NOW(), NOW()),

(15, 'LIST-TEMPLATE-FIGMA-015', 'ACCT-SELLER-VERIFIED-009', 'USER-SELLER-009',
 'Mobile App UI Kit - Figma',
 'Complete mobile app UI kit for Figma. 200+ components. Instant download link.',
 'TEMPLATES', 'DIGITAL', 'INSTANT',
 'US', 'USD', 29.99, 'ACTIVE', NOW(), NOW()),

(16, 'LIST-TEMPLATE-RESUME-016', 'ACCT-SELLER-VERIFIED-010', 'USER-SELLER-010',
 '50 Professional Resume Templates',
 '50 customizable resume templates in Word and PDF. Instant download. ATS-friendly design.',
 'TEMPLATES', 'DIGITAL', 'INSTANT',
 'US', 'USD', 9.99, 'ACTIVE', NOW(), NOW()),

-- E-Books & Digital Books
(17, 'LIST-EBOOK-FICTION-017', 'ACCT-SELLER-VERIFIED-011', 'USER-SELLER-011',
 'The Lost Kingdom - Fantasy Novel',
 'Epic fantasy novel. 500+ pages. Available in EPUB and PDF formats. Instant download after purchase.',
 'EBOOKS', 'DIGITAL', 'INSTANT',
 'US', 'USD', 4.99, 'ACTIVE', NOW(), NOW()),

(18, 'LIST-EBOOK-BUSINESSGUIDE-018', 'ACCT-SELLER-VERIFIED-011', 'USER-SELLER-011',
 'Startup Guide: From Idea to Launch',
 'Complete guide to starting your own business. Real case studies and templates included. PDF format.',
 'EBOOKS', 'DIGITAL', 'INSTANT',
 'US', 'USD', 19.99, 'ACTIVE', NOW(), NOW()),

(19, 'LIST-EBOOK-COOKBOOK-019', 'ACCT-SELLER-VERIFIED-012', 'USER-SELLER-012',
 'Healthy Recipes Cookbook - 100 Dishes',
 '100 healthy recipes with nutrition info. Instant EPUB/PDF download. Professional formatting.',
 'EBOOKS', 'DIGITAL', 'INSTANT',
 'US', 'USD', 9.99, 'ACTIVE', NOW(), NOW()),

-- Streaming & Entertainment
(20, 'LIST-STREAM-HULU-020', 'ACCT-SELLER-VERIFIED-013', 'USER-SELLER-013',
 'Hulu Ad-Free 2-Month Subscription',
 'Hulu without ads subscription for 2 months. Access all Hulu content. Code sent within 24 hours.',
 'GIFT_CARDS', 'DIGITAL', 'MANUAL',
 'US', 'USD', 19.98, 'ACTIVE', NOW(), NOW());

-- Verify data was inserted
SELECT COUNT(*) as total_listings FROM listing;
SELECT COUNT(DISTINCT product_type) as unique_categories FROM listing;
