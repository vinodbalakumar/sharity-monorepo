-- Remove image_url columns and use only image_keys with asset_storage_provider
-- This ensures all images are loaded from configured CDN provider

-- Step 1: Remove image_url from category_master (keep image_key)
ALTER TABLE category_master DROP COLUMN IF EXISTS image_url;

-- Step 2: Remove image_url from marketplace_vertical (keep image_key)
ALTER TABLE marketplace_vertical DROP COLUMN IF EXISTS image_url;

-- Step 3: Remove image_url from listing
ALTER TABLE listing DROP COLUMN IF EXISTS image_url;

-- Step 4: Ensure image_key columns have proper values for marketplace images
UPDATE category_master
SET image_key = CASE
    WHEN category_code = 'GAMES' THEN 'marketplace/games-category.jpg'
    WHEN category_code = 'GIFTCARDS' THEN 'marketplace/giftcards-category.jpg'
    WHEN category_code = 'GIFT_CARDS' THEN 'marketplace/gift-cards-category.jpg'
    WHEN category_code = 'SOFTWARE' THEN 'marketplace/software-category.jpg'
    WHEN category_code = 'COURSES' THEN 'marketplace/courses-category.jpg'
    WHEN category_code = 'EARRINGS' THEN 'marketplace/earrings-category.jpg'
    WHEN category_code = 'NECKLACES' THEN 'marketplace/necklaces-category.jpg'
    WHEN category_code = 'RINGS' THEN 'marketplace/rings-category.jpg'
    WHEN category_code = 'BANGLES' THEN 'marketplace/bangles-category.jpg'
    ELSE image_key
END
WHERE image_key IS NULL OR image_key = '';

-- Step 5: Add default image_key for any missing values
UPDATE category_master
SET image_key = 'marketplace/' || LOWER(REPLACE(category_name, ' ', '-')) || '-category.jpg'
WHERE image_key IS NULL OR image_key = '';

-- Verify the migration
-- SELECT id, category_code, category_name, image_key FROM category_master LIMIT 10;
