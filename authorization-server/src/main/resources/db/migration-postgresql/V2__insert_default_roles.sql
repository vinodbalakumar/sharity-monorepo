INSERT INTO role (role_name, description, created_at)
VALUES
    ('USER', 'Default application user', CURRENT_TIMESTAMP),
    ('ADMIN', 'Administrator with user-management privileges', CURRENT_TIMESTAMP),
    ('BUYER', 'Buyer account role', CURRENT_TIMESTAMP),
    ('SELLER', 'Seller account role', CURRENT_TIMESTAMP),
    ('SUPPORT', 'Support staff account role', CURRENT_TIMESTAMP);
