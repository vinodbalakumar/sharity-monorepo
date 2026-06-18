-- Ensure database is in the correct state for image handling
-- This migration is idempotent and safe to run multiple times
-- (It will only run if V42/V43 failed and didn't add the columns)

-- Ensure image_key columns have proper values for marketplace categories
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

UPDATE category_master
SET image_key = CONCAT('marketplace/', LOWER(REPLACE(category_name, ' ', '-')), '-category.jpg')
WHERE image_key IS NULL OR image_key = '';
