ALTER TABLE verticals_master
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

UPDATE verticals_master
SET image_url = CASE module_code
    WHEN 'MARKETPLACE' THEN 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/marketplace/verticals/gift-card-carousel.png'
    WHEN 'JEWELLERY' THEN 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/marketplace/verticals/Imitation-carousel2.png'
    ELSE image_url
END
WHERE module_code IN ('MARKETPLACE', 'JEWELLERY');
