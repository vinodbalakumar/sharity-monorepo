ALTER TABLE verticals_master
    ADD COLUMN IF NOT EXISTS image_keys VARCHAR(1000);

UPDATE verticals_master
SET image_keys = CASE module_code
    WHEN 'MARKETPLACE' THEN 'marketplace/verticals/digital-marketplace/gift-cards-verticals.png,marketplace/verticals/digital-marketplace/gaming-verticals.png,marketplace/verticals/digital-marketplace/software-license-verticals.png,marketplace/verticals/digital-marketplace/subscriptions-verticals.png,marketplace/verticals/digital-marketplace/course-learning-verticals.png'
    WHEN 'JEWELLERY' THEN 'marketplace/verticals/imitation-jewellery-marketplace/imitation-jewellery.png,marketplace/verticals/imitation-jewellery-marketplace/necklace-sets-verticals.png,marketplace/verticals/imitation-jewellery-marketplace/mangalsutra-vericals.png,marketplace/verticals/imitation-jewellery-marketplace/ear-rings-verticals.png,marketplace/verticals/imitation-jewellery-marketplace/bangles-bracelets-verticals.png,marketplace/verticals/imitation-jewellery-marketplace/rings-verticals.png'
    ELSE image_keys
END,
    image_url = NULL
WHERE module_code IN ('MARKETPLACE', 'JEWELLERY');
