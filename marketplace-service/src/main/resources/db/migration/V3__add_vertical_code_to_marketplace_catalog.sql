SET @sql := IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'marketplace_category' AND column_name = 'vertical_code') = 0,
    'ALTER TABLE marketplace_category ADD COLUMN vertical_code VARCHAR(50) NOT NULL DEFAULT ''MARKETPLACE'' AFTER category_slug',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'listing' AND column_name = 'vertical_code') = 0,
    'ALTER TABLE listing ADD COLUMN vertical_code VARCHAR(50) NOT NULL DEFAULT ''MARKETPLACE'' AFTER category_code',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE marketplace_category
SET vertical_code = COALESCE(NULLIF(vertical_code, ''), 'MARKETPLACE')
WHERE vertical_code IS NULL OR vertical_code = '';

UPDATE listing
SET vertical_code = COALESCE(NULLIF(vertical_code, ''), 'MARKETPLACE')
WHERE vertical_code IS NULL OR vertical_code = '';
