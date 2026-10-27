UPDATE listing
SET image_url = CASE
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2c101' THEN 'marketplace/placeholders/gift_cards.png'
        WHEN category_code = 'GIFT_CARDS' THEN 'marketplace/placeholders/gift_cards.png'
        WHEN category_code = 'GAMING' THEN 'marketplace/placeholders/gaming.png'
        WHEN category_code = 'ELECTRONICS' THEN 'marketplace/placeholders/electronics.png'
        WHEN category_code = 'COLLECTIBLES' THEN 'marketplace/placeholders/collectibles.png'
        WHEN category_code = 'FASHION' THEN 'marketplace/placeholders/fashion.png'
        WHEN category_code = 'LOCAL_DEALS' THEN 'marketplace/placeholders/local_deals.png'
        WHEN category_code = 'SERVICES' THEN 'marketplace/placeholders/services.png'
        WHEN category_code = 'GROCERY' THEN 'marketplace/placeholders/grocery.png'
        WHEN category_code = 'MEAT_SHOP' THEN 'marketplace/placeholders/meat_shop.png'
        WHEN category_code = 'PHARMACY' THEN 'marketplace/placeholders/pharmacy.png'
        WHEN category_code = 'AUTOMOTIVE' THEN 'marketplace/placeholders/automotive.png'
        ELSE 'marketplace/placeholders/sample_listing.png'
    END,
    updated_at = NOW(6)
WHERE vertical_code = 'MARKETPLACE'
  AND (image_url IS NULL OR TRIM(image_url) = '');
