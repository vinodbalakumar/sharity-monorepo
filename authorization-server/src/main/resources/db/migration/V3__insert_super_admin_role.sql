INSERT INTO role (role_name, description, created_at)
SELECT 'SUPER_ADMIN', 'Highest privilege administrator', CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (
    SELECT 1 FROM role WHERE role_name = 'SUPER_ADMIN'
);
