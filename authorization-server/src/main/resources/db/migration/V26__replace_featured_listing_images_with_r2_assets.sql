-- No-op migration kept to clear the failed historical entry on MySQL.
-- Marketplace listing image updates should run in the marketplace service, not auth.
SELECT 1;
