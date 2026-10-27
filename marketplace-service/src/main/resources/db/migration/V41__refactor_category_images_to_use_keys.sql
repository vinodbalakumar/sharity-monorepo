-- Refactor category images to use keys only (not full URLs)
-- This allows easy migration between CDN providers (R2, S3, etc)

-- Add image_key column
ALTER TABLE category_master
ADD COLUMN image_key VARCHAR(255) NULL AFTER image_url;

-- Populate image_key from image_url
-- Extract the filename from the URL path (everything after the last /)
UPDATE category_master
SET image_key = SUBSTRING_INDEX(image_url, '/', -1)
WHERE image_url IS NOT NULL AND image_url != '';

-- Update image_key to use lowercase standardized format
UPDATE category_master
SET image_key = LOWER(
  REPLACE(
    REPLACE(
      REPLACE(image_key, '.png', ''),
      '.svg', ''),
    '_', '-')
)
WHERE image_key IS NOT NULL;

-- Add marketplace folder prefix to organize images in CDN
UPDATE category_master
SET image_key = CONCAT('marketplace/', image_key)
WHERE image_key IS NOT NULL AND image_key NOT LIKE 'marketplace/%';

-- Verify migration worked
-- SELECT id, category_name, image_key, image_url FROM category_master LIMIT 5;

-- Note: image_url can remain temporarily for backward compatibility
-- Frontend/API should use image_key to construct URLs from configuration
-- Future: Remove image_url column after confirming no code depends on it

-- For now, we keep both columns:
-- - image_key: used by new code (recommended)
-- - image_url: deprecated, kept for backward compatibility only
