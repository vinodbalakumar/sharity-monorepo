INSERT INTO asset (
    public_id, provider_code, bucket_name, object_key, public_url, thumbnail_url, asset_type,
    owner_type, owner_id, content_type, file_size_bytes, width_pixels, height_pixels, alt_text,
    checksum_sha256, visibility, asset_status, created_by_user_public_id, created_at, updated_at
)
SELECT gen_random_uuid()::text, 'CLOUDFLARE_R2_PRIMARY', 'sharity-assets', seed.object_key,
       CONCAT('https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/', seed.object_key),
       NULL, 'CATEGORY_IMAGE', 'CATEGORY', seed.owner_id, 'image/svg+xml', NULL, 1200, 800,
       seed.alt_text, NULL, 'PUBLIC', 'ACTIVE', NULL, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM (
    SELECT 'marketplace/categories/gaming.svg' AS object_key, 'GAMING' AS owner_id, 'Gaming category image' AS alt_text
    UNION ALL SELECT 'marketplace/categories/gaming.svg', 'MARKETPLACE_GAMING', 'Gaming category image'
    UNION ALL SELECT 'marketplace/categories/collectibles.svg', 'COLLECTIBLES', 'Collectibles category image'
    UNION ALL SELECT 'marketplace/categories/collectibles.svg', 'MARKETPLACE_COLLECTIBLES', 'Collectibles category image'
    UNION ALL SELECT 'marketplace/categories/services.svg', 'SERVICES', 'Services category image'
    UNION ALL SELECT 'marketplace/categories/local-deals.svg', 'LOCAL_DEALS', 'Local deals category image'
    UNION ALL SELECT 'marketplace/categories/local-deals.svg', 'MARKETPLACE_LOCAL_DEALS', 'Local deals category image'
    UNION ALL SELECT 'marketplace/categories/electronics.svg', 'MARKETPLACE_ELECTRONICS', 'Electronics category image'
    UNION ALL SELECT 'marketplace/categories/gift-cards.svg', 'MARKETPLACE_GIFT_CARDS', 'Gift cards category image'
) seed
WHERE NOT EXISTS (
    SELECT 1
    FROM asset existing
    WHERE existing.provider_code = 'CLOUDFLARE_R2_PRIMARY'
      AND existing.bucket_name = 'sharity-assets'
      AND existing.object_key = seed.object_key
      AND existing.owner_type = 'CATEGORY'
      AND existing.owner_id = seed.owner_id
);

UPDATE listing
SET image_url = CASE
    WHEN category_code IN ('GAMING', 'MARKETPLACE_GAMING') THEN 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/marketplace/categories/gaming.svg'
    WHEN category_code IN ('COLLECTIBLES', 'MARKETPLACE_COLLECTIBLES') THEN 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/marketplace/categories/collectibles.svg'
    WHEN category_code IN ('SERVICES') THEN 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/marketplace/categories/services.svg'
    WHEN category_code IN ('LOCAL_DEALS', 'MARKETPLACE_LOCAL_DEALS') THEN 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/marketplace/categories/local-deals.svg'
    WHEN category_code IN ('MARKETPLACE_ELECTRONICS') THEN 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/marketplace/categories/electronics.svg'
    WHEN category_code IN ('MARKETPLACE_GIFT_CARDS') THEN 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/marketplace/categories/gift-cards.svg'
    ELSE image_url
END
WHERE image_url IS NULL
   OR image_url = ''
   OR image_url LIKE 'marketplace/placeholders/%'
   OR image_url LIKE 'https://picsum.photos/%';
