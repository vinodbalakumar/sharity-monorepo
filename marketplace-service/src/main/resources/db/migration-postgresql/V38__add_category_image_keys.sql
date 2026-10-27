ALTER TABLE category_master
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

UPDATE category_master
SET image_url = CASE category_code
    WHEN 'GIFT_CARDS' THEN 'marketplace/verticals/digital-marketplace/gift-cards-verticals.png'
    WHEN 'GAMING' THEN 'marketplace/verticals/digital-marketplace/gaming-verticals.png'
    WHEN 'ONE_GRAM_JEWELLERY' THEN 'marketplace/verticals/imitation-jewellery-marketplace/imitation-jewellery.png'
    ELSE image_url
END,
    updated_at = CURRENT_TIMESTAMP(6)
WHERE category_code IN ('GIFT_CARDS', 'GAMING', 'ONE_GRAM_JEWELLERY');

