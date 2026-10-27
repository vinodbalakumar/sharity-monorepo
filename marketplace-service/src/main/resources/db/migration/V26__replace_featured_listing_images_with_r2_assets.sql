UPDATE listing
SET image_url = CASE
    WHEN category_code IN ('GAMING', 'MARKETPLACE_GAMING') THEN 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/marketplace/categories/gaming.svg'
    WHEN category_code IN ('COLLECTIBLES', 'MARKETPLACE_COLLECTIBLES') THEN 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/marketplace/categories/collectibles.svg'
    WHEN category_code IN ('SERVICES') THEN 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/marketplace/categories/services.svg'
    WHEN category_code IN ('LOCAL_DEALS', 'MARKETPLACE_LOCAL_DEALS') THEN 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/marketplace/categories/local-deals.svg'
    WHEN category_code IN ('ELECTRONICS', 'MARKETPLACE_ELECTRONICS') THEN 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/marketplace/categories/electronics.svg'
    WHEN category_code IN ('GIFT_CARDS', 'MARKETPLACE_GIFT_CARDS') THEN 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/marketplace/categories/gift-cards.svg'
    ELSE image_url
END
WHERE featured = TRUE
  AND (
    image_url LIKE 'https://images.unsplash.com/%'
    OR image_url LIKE 'marketplace/placeholders/%'
    OR image_url LIKE 'https://picsum.photos/%'
  );
