ALTER TABLE category_master ADD COLUMN IF NOT EXISTS vertical_code VARCHAR(50) NOT NULL DEFAULT 'MARKETPLACE';
ALTER TABLE listing ADD COLUMN IF NOT EXISTS vertical_code VARCHAR(50) NOT NULL DEFAULT 'MARKETPLACE';

UPDATE category_master
SET vertical_code = COALESCE(NULLIF(vertical_code, ''), 'MARKETPLACE')
WHERE vertical_code IS NULL OR vertical_code = '';

UPDATE listing
SET vertical_code = COALESCE(NULLIF(vertical_code, ''), 'MARKETPLACE')
WHERE vertical_code IS NULL OR vertical_code = '';