-- Correct legacy/imported physical inventory after all earlier seed migrations.
-- Keep pickup and valid shipping methods; digital inventory is untouched.
UPDATE listing
SET delivery_type = 'SHIPPING', updated_at = CURRENT_TIMESTAMP
WHERE UPPER(TRIM(product_type)) = 'PHYSICAL'
  AND UPPER(TRIM(delivery_type)) NOT IN ('SHIPPING', 'SHIPPING_REQUIRED', 'LOCAL_PICKUP');

-- Open carts hold a delivery snapshot; repair it without rewriting order history.
UPDATE cart_item
SET delivery_type = 'SHIPPING', updated_at = CURRENT_TIMESTAMP
WHERE UPPER(TRIM(delivery_type)) NOT IN ('SHIPPING', 'SHIPPING_REQUIRED', 'LOCAL_PICKUP')
  AND EXISTS (SELECT 1 FROM listing l WHERE l.public_id = cart_item.listing_id
              AND UPPER(TRIM(l.product_type)) = 'PHYSICAL'
              AND l.delivery_type = 'SHIPPING');
