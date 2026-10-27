-- Add featured listing image columns for seller listing showcase

ALTER TABLE listing ADD COLUMN IF NOT EXISTS featured_image_id VARCHAR(255);
ALTER TABLE listing ADD COLUMN IF NOT EXISTS featured_image_url VARCHAR(1024);
ALTER TABLE listing ADD COLUMN IF NOT EXISTS featured_image_alt_text VARCHAR(500);
ALTER TABLE listing ADD COLUMN IF NOT EXISTS featured_image_position INT DEFAULT 1;

-- Add index for featured image queries
CREATE INDEX IF NOT EXISTS idx_listing_featured_image ON listing(featured_image_id);

-- Add listing_image table if not already defined (for multi-image support)
CREATE TABLE IF NOT EXISTS listing_image (
    id SERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL,
    image_id VARCHAR(255) NOT NULL,
    image_url VARCHAR(1024) NOT NULL,
    alt_text VARCHAR(500),
    position INT DEFAULT 1,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listing(id) ON DELETE CASCADE,
    UNIQUE(listing_id, image_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_image_listing ON listing_image(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_image_featured ON listing_image(listing_id, is_featured);
