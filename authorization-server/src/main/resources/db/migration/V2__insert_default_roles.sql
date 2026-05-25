INSERT INTO role (role_name, description, created_at)
VALUES
    ('USER', 'Default application user', CURRENT_TIMESTAMP(6)),
    ('ADMIN', 'Administrator with user-management privileges', CURRENT_TIMESTAMP(6)),
    ('BUYER', 'Buyer account role', CURRENT_TIMESTAMP(6)),
    ('SELLER', 'Seller account role', CURRENT_TIMESTAMP(6)),
    ('SUPPORT', 'Support staff account role', CURRENT_TIMESTAMP(6));
