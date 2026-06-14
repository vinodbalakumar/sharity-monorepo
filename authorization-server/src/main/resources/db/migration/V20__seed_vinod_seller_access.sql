-- No-op migration kept to clear the failed historical entry on MySQL.
-- Seller seeding is environment-specific and should not block auth startup.
SELECT 1;
