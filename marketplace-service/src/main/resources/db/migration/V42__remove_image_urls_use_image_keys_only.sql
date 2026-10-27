-- Migrate persisted image references to provider-neutral object keys.

SET @listing_image_key_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'listing'
      AND column_name = 'image_key'
);
SET @sql = IF(
    @listing_image_key_exists = 0,
    'ALTER TABLE listing ADD COLUMN image_key VARCHAR(500) NULL AFTER original_price_amount',
    'SELECT 1'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

UPDATE listing
SET image_key = image_url
WHERE (image_key IS NULL OR image_key = '')
  AND image_url IS NOT NULL
  AND image_url <> '';

-- Populate image_key columns for marketplace categories
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

-- Add default image_key for any missing values
UPDATE category_master
SET image_key = CONCAT('marketplace/', LOWER(REPLACE(category_name, ' ', '-')), '-category.jpg')
WHERE image_key IS NULL OR image_key = '';

SET @category_image_url_exists = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'category_master' AND column_name = 'image_url'
);
SET @sql = IF(@category_image_url_exists > 0,
    'ALTER TABLE category_master DROP COLUMN image_url', 'SELECT 1');
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SET @vertical_image_url_exists = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'verticals_master' AND column_name = 'image_url'
);
SET @sql = IF(@vertical_image_url_exists > 0,
    'ALTER TABLE verticals_master DROP COLUMN image_url', 'SELECT 1');
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SET @listing_image_url_exists = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'listing' AND column_name = 'image_url'
);
SET @sql = IF(@listing_image_url_exists > 0,
    'ALTER TABLE listing DROP COLUMN image_url', 'SELECT 1');
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;
