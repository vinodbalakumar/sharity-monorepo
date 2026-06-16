UPDATE delivery_type_master
SET display_label = 'Instant Digital Delivery',
    description = 'Delivered automatically after payment.',
    updated_at = NOW(6)
WHERE delivery_type_code = 'DIGITAL';

INSERT INTO delivery_type_master (delivery_type_code, display_label, description, digital_delivery, active, sort_order, created_at, updated_at)
SELECT 'SECURE_DIGITAL', 'Secure Digital Delivery', 'Delivered through a protected reveal or download flow.', TRUE, TRUE, 15, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM delivery_type_master WHERE delivery_type_code = 'SECURE_DIGITAL');

INSERT INTO delivery_type_master (delivery_type_code, display_label, description, digital_delivery, active, sort_order, created_at, updated_at)
SELECT 'MANUAL', 'Manual Delivery', 'Delivered after seller action or review.', TRUE, TRUE, 20, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM delivery_type_master WHERE delivery_type_code = 'MANUAL');

INSERT INTO delivery_type_master (delivery_type_code, display_label, description, digital_delivery, active, sort_order, created_at, updated_at)
SELECT 'COORDINATED_TRANSFER', 'Coordinated Transfer', 'Buyer and seller coordinate the handoff or transfer.', TRUE, TRUE, 30, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM delivery_type_master WHERE delivery_type_code = 'COORDINATED_TRANSFER');

INSERT INTO delivery_type_master (delivery_type_code, display_label, description, digital_delivery, active, sort_order, created_at, updated_at)
SELECT 'TRANSFER', 'Direct Transfer', 'Seller transfers access or ownership directly after checkout.', TRUE, TRUE, 40, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM delivery_type_master WHERE delivery_type_code = 'TRANSFER');

INSERT INTO delivery_type_master (delivery_type_code, display_label, description, digital_delivery, active, sort_order, created_at, updated_at)
SELECT 'LOCAL_PICKUP', 'Local Pickup', 'Buyer collects the item locally from the seller.', FALSE, TRUE, 50, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM delivery_type_master WHERE delivery_type_code = 'LOCAL_PICKUP');

INSERT INTO delivery_type_master (delivery_type_code, display_label, description, digital_delivery, active, sort_order, created_at, updated_at)
SELECT 'DOWNLOAD', 'Secure Download', 'Buyer downloads the product through a protected path.', TRUE, TRUE, 60, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM delivery_type_master WHERE delivery_type_code = 'DOWNLOAD');
