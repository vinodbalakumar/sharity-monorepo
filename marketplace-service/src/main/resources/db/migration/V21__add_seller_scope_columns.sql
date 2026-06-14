-- No-op migration kept to clear the failed historical entry on MySQL.
-- The marketplace schema does not have a seller table in this workspace,
-- so the previous version of this migration could not be applied safely.
SELECT 1;
