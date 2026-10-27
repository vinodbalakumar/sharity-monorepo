-- Validation script for category seed data
-- Run this after applying the V39__seed_marketplace_categories.sql migration

-- ============================================
-- 1. COUNT VALIDATION
-- ============================================
SELECT '=== CATEGORY COUNT VALIDATION ===' as validation_type;

SELECT
    'DIGITAL_MARKETPLACE' as marketplace_type,
    COUNT(*) as total_categories,
    SUM(CASE WHEN active = TRUE THEN 1 ELSE 0 END) as active_categories
FROM category_master
WHERE vertical_code = 'MARKETPLACE';

SELECT
    'IMITATION_JEWELLERY' as marketplace_type,
    COUNT(*) as total_categories,
    SUM(CASE WHEN active = TRUE THEN 1 ELSE 0 END) as active_categories
FROM category_master
WHERE vertical_code = 'JEWELLERY';

-- ============================================
-- 2. DUPLICATE CHECK
-- ============================================
SELECT '=== DUPLICATE CODE CHECK ===' as validation_type;

SELECT category_code, COUNT(*) as duplicate_count
FROM category_master
WHERE vertical_code IN ('MARKETPLACE', 'JEWELLERY')
GROUP BY category_code
HAVING COUNT(*) > 1;

-- No duplicates expected - should return empty result

-- ============================================
-- 3. SAMPLE DATA - DIGITAL MARKETPLACE
-- ============================================
SELECT '=== DIGITAL MARKETPLACE SAMPLE DATA ===' as validation_type;

SELECT
    category_code,
    category_name,
    vertical_code,
    image_url,
    active,
    display_order,
    icon_ref
FROM category_master
WHERE vertical_code = 'MARKETPLACE'
ORDER BY display_order
LIMIT 16;

-- ============================================
-- 4. SAMPLE DATA - IMITATION JEWELLERY
-- ============================================
SELECT '=== IMITATION JEWELLERY SAMPLE DATA ===' as validation_type;

SELECT
    category_code,
    category_name,
    vertical_code,
    image_url,
    active,
    display_order,
    icon_ref
FROM category_master
WHERE vertical_code = 'JEWELLERY'
ORDER BY display_order
LIMIT 16;

-- ============================================
-- 5. IMAGE URL FORMAT VALIDATION
-- ============================================
SELECT '=== IMAGE URL FORMAT VALIDATION ===' as validation_type;

-- Check Digital Marketplace image URLs
SELECT
    'DIGITAL_MARKETPLACE' as marketplace,
    COUNT(*) as correct_format_count,
    SUM(CASE WHEN image_url LIKE '/assets/categories/digital-marketplace/%' THEN 1 ELSE 0 END) as matching_pattern
FROM category_master
WHERE vertical_code = 'MARKETPLACE';

-- Check Imitation Jewellery image URLs
SELECT
    'IMITATION_JEWELLERY' as marketplace,
    COUNT(*) as correct_format_count,
    SUM(CASE WHEN image_url LIKE '/assets/categories/imitation-jewellery/%' THEN 1 ELSE 0 END) as matching_pattern
FROM category_master
WHERE vertical_code = 'JEWELLERY';

-- ============================================
-- 6. COMPLETE DATA CHECK
-- ============================================
SELECT '=== COMPLETE DATA FOR ALL CATEGORIES ===' as validation_type;

SELECT
    vertical_code,
    COUNT(*) as total,
    MIN(display_order) as min_order,
    MAX(display_order) as max_order,
    SUM(CASE WHEN active = TRUE THEN 1 ELSE 0 END) as active_count
FROM category_master
WHERE vertical_code IN ('MARKETPLACE', 'JEWELLERY')
GROUP BY vertical_code;

-- ============================================
-- 7. MISSING IMAGE URL CHECK
-- ============================================
SELECT '=== MISSING IMAGE URL CHECK ===' as validation_type;

SELECT category_code, category_name, vertical_code
FROM category_master
WHERE vertical_code IN ('MARKETPLACE', 'JEWELLERY')
  AND (image_url IS NULL OR image_url = '')
ORDER BY vertical_code, display_order;

-- No records expected - should return empty result

-- ============================================
-- 8. DISPLAY ORDER VALIDATION
-- ============================================
SELECT '=== DISPLAY ORDER VALIDATION ===' as validation_type;

-- Check for gaps in display order
SELECT
    vertical_code,
    display_order,
    COUNT(*) as count
FROM category_master
WHERE vertical_code IN ('MARKETPLACE', 'JEWELLERY')
GROUP BY vertical_code, display_order
HAVING COUNT(*) > 1
ORDER BY vertical_code, display_order;

-- No records expected - should return empty result
