SET @category_image_url_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'category_master'
      AND column_name = 'image_url'
);

SET @category_image_url_sql = IF(
    @category_image_url_exists = 0,
    'ALTER TABLE category_master ADD COLUMN image_url VARCHAR(500) NULL AFTER icon_ref',
    'SELECT 1'
);

PREPARE category_image_url_stmt FROM @category_image_url_sql;
EXECUTE category_image_url_stmt;
DEALLOCATE PREPARE category_image_url_stmt;

UPDATE category_master
SET image_url = CASE category_code
    WHEN 'GIFT_CARDS' THEN 'marketplace/verticals/digital-marketplace/gift-cards-verticals.png'
    WHEN 'GAMING' THEN 'marketplace/verticals/digital-marketplace/gaming-verticals.png'
    WHEN 'ONE_GRAM_JEWELLERY' THEN 'marketplace/verticals/imitation-jewellery-marketplace/imitation-jewellery.png'
    ELSE image_url
END,
    updated_at = NOW(6)
WHERE category_code IN ('GIFT_CARDS', 'GAMING', 'ONE_GRAM_JEWELLERY');
