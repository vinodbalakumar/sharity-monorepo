-- Add product images for marketplace listings
-- Images uploaded to Cloudflare R2 and linked to listings

INSERT INTO asset (
    public_id, asset_type, file_name, mime_type, file_size_bytes,
    storage_provider_code, remote_path, created_at, updated_at
) VALUES
('ASSET-PRODUCT-001', 'LISTING_IMAGE', 'product_001.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_001.jpg', NOW(), NOW()),

('ASSET-PRODUCT-002', 'LISTING_IMAGE', 'product_002.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_002.jpg', NOW(), NOW()),

('ASSET-PRODUCT-003', 'LISTING_IMAGE', 'product_003.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_003.jpg', NOW(), NOW()),

('ASSET-PRODUCT-004', 'LISTING_IMAGE', 'product_004.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_004.jpg', NOW(), NOW()),

('ASSET-PRODUCT-005', 'LISTING_IMAGE', 'product_005.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_005.jpg', NOW(), NOW()),

('ASSET-PRODUCT-006', 'LISTING_IMAGE', 'product_006.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_006.jpg', NOW(), NOW()),

('ASSET-PRODUCT-007', 'LISTING_IMAGE', 'product_007.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_007.jpg', NOW(), NOW()),

('ASSET-PRODUCT-008', 'LISTING_IMAGE', 'product_008.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_008.jpg', NOW(), NOW()),

('ASSET-PRODUCT-009', 'LISTING_IMAGE', 'product_009.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_009.jpg', NOW(), NOW()),

('ASSET-PRODUCT-010', 'LISTING_IMAGE', 'product_010.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_010.jpg', NOW(), NOW()),

('ASSET-PRODUCT-011', 'LISTING_IMAGE', 'product_011.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_011.jpg', NOW(), NOW()),

('ASSET-PRODUCT-012', 'LISTING_IMAGE', 'product_012.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_012.jpg', NOW(), NOW()),

('ASSET-PRODUCT-013', 'LISTING_IMAGE', 'product_013.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_013.jpg', NOW(), NOW()),

('ASSET-PRODUCT-014', 'LISTING_IMAGE', 'product_014.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_014.jpg', NOW(), NOW()),

('ASSET-PRODUCT-015', 'LISTING_IMAGE', 'product_015.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_015.jpg', NOW(), NOW()),

('ASSET-PRODUCT-016', 'LISTING_IMAGE', 'product_016.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_016.jpg', NOW(), NOW()),

('ASSET-PRODUCT-017', 'LISTING_IMAGE', 'product_017.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_017.jpg', NOW(), NOW()),

('ASSET-PRODUCT-018', 'LISTING_IMAGE', 'product_018.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_018.jpg', NOW(), NOW()),

('ASSET-PRODUCT-019', 'LISTING_IMAGE', 'product_019.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_019.jpg', NOW(), NOW()),

('ASSET-PRODUCT-020', 'LISTING_IMAGE', 'product_020.jpg', 'image/jpeg', 45000,
 'CLOUDFLARE_R2_PRIMARY', 'https://pub-c431ffbb16cd4884aa6a22a5f177f00b.r2.dev/listings/product_020.jpg', NOW(), NOW());

-- Verify assets were inserted
SELECT COUNT(*) as total_assets FROM asset WHERE asset_type = 'LISTING_IMAGE';
