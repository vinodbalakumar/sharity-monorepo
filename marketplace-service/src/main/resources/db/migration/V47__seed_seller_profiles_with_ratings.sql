-- Seed realistic seller profiles with varied ratings
INSERT INTO seller_profile (provider_account_public_id, seller_name, seller_rating, completed_orders, total_reviews, verification_status)
VALUES
-- Premium sellers (4.8+ rating)
('11111111-1111-1111-1111-111111111101', 'Sharity Digital Studio', 4.8, 245, 156, 'PREMIUM'),
('11111111-1111-1111-1111-111111111103', 'Sharity Jewellery Atelier', 4.9, 312, 198, 'PREMIUM'),

-- Verified sellers with good ratings (4.5-4.7)
('7e3a917e-924a-4584-a546-3a2fecd45cdc', 'TechHub Pro', 4.7, 158, 89, 'VERIFIED'),
('4ec78bab-d02e-4183-9ae6-801456538080', 'GiftCard Express', 4.6, 203, 124, 'VERIFIED'),
('bdaa03b3-4ed7-47c4-baa9-d24215590aef', 'Gaming Elite Store', 4.7, 189, 142, 'VERIFIED'),
('be748292-939a-4eb5-8253-dbb83ec2cd78', 'Jewel Crafts', 4.5, 167, 95, 'VERIFIED'),
('624aaf7c-214f-4e71-b531-689b768de4c3', 'Premium Accessories', 4.6, 195, 128, 'VERIFIED'),
('12c18f84-bcc0-4bd2-8b7c-df1086a46993', 'Digital Codes Hub', 4.8, 278, 167, 'PREMIUM'),
('dbb5300b-7d93-42c6-aa4b-0c4f09d2c3d2', 'Electronics World', 4.5, 142, 78, 'VERIFIED'),
('2ed8d864-8076-4ccd-ab48-7a25e864f4bc', 'Fashion & Beauty', 4.6, 201, 135, 'VERIFIED'),
('5acf66f7-a7be-449a-993e-8042dbdd7b54', 'Luxury Brands', 4.7, 223, 156, 'PREMIUM'),
('547427c6-985f-42f1-90ea-a1e511a0c0c1', 'Home Essentials', 4.4, 98, 52, 'VERIFIED'),
('a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', 'Quick Delivery Plus', 4.5, 156, 92, 'VERIFIED'),
('b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7', 'Trusted Marketplace', 4.8, 312, 201, 'PREMIUM'),
('c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8', 'Value Sellers Co', 4.3, 87, 44, 'VERIFIED'),
('d4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9', 'Expert Traders', 4.6, 234, 167, 'VERIFIED'),
('e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0', 'Premium Quality Hub', 4.7, 267, 189, 'PREMIUM'),
('f6g7h8i9-j0k1-l2m3-n4o5-p6q7r8s9t0u1', 'Verified Reseller', 4.5, 143, 81, 'VERIFIED'),
('g7h8i9j0-k1l2-m3n4-o5p6-q7r8s9t0u1v2', 'Flash Sale Master', 4.6, 189, 114, 'VERIFIED'),
('h8i9j0k1-l2m3-n4o5-p6q7-r8s9t0u1v2w3', 'Certified Seller', 4.8, 298, 203, 'PREMIUM'),
('i9j0k1l2-m3n4-o5p6-q7r8-s9t0u1v2w3x4', 'Bulk Distributor', 4.4, 125, 67, 'VERIFIED'),
('j0k1l2m3-n4o5-p6q7-r8s9-t0u1v2w3x4y5', 'Same Day Delivery', 4.7, 212, 145, 'VERIFIED')
ON DUPLICATE KEY UPDATE
    seller_rating = VALUES(seller_rating),
    completed_orders = VALUES(completed_orders),
    total_reviews = VALUES(total_reviews),
    verification_status = VALUES(verification_status),
    updated_at = NOW(6);
