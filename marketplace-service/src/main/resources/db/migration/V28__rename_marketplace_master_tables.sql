SET @old_category_exists := (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'marketplace_category'
);
SET @new_category_exists := (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'category_master'
);
SET @sql := IF(@old_category_exists > 0 AND @new_category_exists = 0,
    'RENAME TABLE marketplace_category TO category_master',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @old_vertical_exists := (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'marketplace_vertical'
);
SET @new_vertical_exists := (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = 'verticals_master'
);
SET @sql := IF(@old_vertical_exists > 0 AND @new_vertical_exists = 0,
    'RENAME TABLE marketplace_vertical TO verticals_master',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
