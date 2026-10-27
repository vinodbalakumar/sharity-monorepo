-- No-op migration kept to clear the failed historical entry on MySQL.
-- The marketplace schema in this workspace uses order_header/order_status_history,
-- not seller_order tables, so the previous version of this migration could not run.
SELECT 1;
