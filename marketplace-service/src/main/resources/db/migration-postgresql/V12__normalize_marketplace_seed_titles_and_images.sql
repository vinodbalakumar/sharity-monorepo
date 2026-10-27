UPDATE listing
SET title = CASE
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b001' THEN 'PlayStation Digital Gift Card'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b002' THEN 'Wireless Game Controller'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b003' THEN 'Gaming Headset Pro'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b004' THEN 'Trading Card Vault Pack'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b005' THEN 'Fashion Watch Case'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b006' THEN 'Creative Design Service Voucher'
        ELSE title
    END,
    description = CASE
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b001' THEN 'Digital code delivery for instant wallet top-up.'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b002' THEN 'Latest generation controller in excellent condition.'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b003' THEN 'Low-latency headset with clear voice chat.'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b004' THEN 'Curated bundle of graded and near-mint cards.'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b005' THEN 'Protective case with tempered glass edge coverage.'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b006' THEN 'Redeemable voucher for logo and social media kit design.'
        ELSE description
    END,
    seller_display_name = CASE
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b001' THEN 'PixelVault Store'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b002' THEN 'Nova Console Hub'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b003' THEN 'Orbit Tech Outlet'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b004' THEN 'RareShelf Collectibles'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b005' THEN 'StyleGrid Essentials'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b006' THEN 'CraftedPixel Studio'
        ELSE seller_display_name
    END,
    image_url = CASE
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b001' THEN 'marketplace/placeholders/gift_cards.png'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b002' THEN 'marketplace/placeholders/gaming.png'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b003' THEN 'marketplace/placeholders/electronics.png'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b004' THEN 'marketplace/placeholders/collectibles.png'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b005' THEN 'marketplace/placeholders/fashion.png'
        WHEN public_id = 'f8d6d40c-9bd4-4af7-a8ba-782a39d2b006' THEN 'marketplace/placeholders/services.png'
        ELSE image_url
    END,
    updated_at = CURRENT_TIMESTAMP(6)
WHERE public_id IN (
    'f8d6d40c-9bd4-4af7-a8ba-782a39d2b001',
    'f8d6d40c-9bd4-4af7-a8ba-782a39d2b002',
    'f8d6d40c-9bd4-4af7-a8ba-782a39d2b003',
    'f8d6d40c-9bd4-4af7-a8ba-782a39d2b004',
    'f8d6d40c-9bd4-4af7-a8ba-782a39d2b005',
    'f8d6d40c-9bd4-4af7-a8ba-782a39d2b006'
);
