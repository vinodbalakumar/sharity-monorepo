SELECT setval(
    pg_get_serial_sequence('asset', 'id'),
    COALESCE((SELECT MAX(id) FROM asset), 1)
);

INSERT INTO asset (
    public_id, provider_code, bucket_name, object_key, public_url, thumbnail_url,
    asset_type, owner_type, owner_id, content_type, file_size_bytes,
    visibility, asset_status, created_at, updated_at
)
SELECT asset_public_id, 'CLOUDFLARE_R2_PRIMARY', 'sharity-assets', object_key, public_url, NULL,
       'LISTING_IMAGE', 'LISTING_IMAGE_SEED', asset_public_id, 'image/jpeg', 45000,
       'PUBLIC', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
    SELECT 'ASSET-PRODUCT-001' AS asset_public_id, 'listings/product_001.jpg' AS object_key, 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_001.jpg' AS public_url
    UNION ALL SELECT 'ASSET-PRODUCT-002', 'listings/product_002.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_002.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-003', 'listings/product_003.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_003.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-004', 'listings/product_004.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_004.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-005', 'listings/product_005.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_005.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-006', 'listings/product_006.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_006.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-007', 'listings/product_007.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_007.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-008', 'listings/product_008.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_008.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-009', 'listings/product_009.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_009.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-010', 'listings/product_010.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_010.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-011', 'listings/product_011.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_011.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-012', 'listings/product_012.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_012.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-013', 'listings/product_013.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_013.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-014', 'listings/product_014.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_014.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-015', 'listings/product_015.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_015.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-016', 'listings/product_016.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_016.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-017', 'listings/product_017.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_017.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-018', 'listings/product_018.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_018.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-019', 'listings/product_019.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_019.jpg'
    UNION ALL SELECT 'ASSET-PRODUCT-020', 'listings/product_020.jpg', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_020.jpg'
) seeded
WHERE NOT EXISTS (
    SELECT 1 FROM asset existing WHERE existing.public_id = seeded.asset_public_id
);

SELECT COUNT(*) as total_assets FROM asset WHERE asset_type = 'LISTING_IMAGE';