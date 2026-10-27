CREATE TABLE IF NOT EXISTS currency_master (
    currency_code VARCHAR(3) NOT NULL,
    currency_name VARCHAR(120) NOT NULL,
    currency_symbol VARCHAR(10) NOT NULL,
    usd_exchange_rate DECIMAL(18,8) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (currency_code)
);

INSERT INTO currency_master (currency_code, currency_name, currency_symbol, usd_exchange_rate, active, sort_order, created_at, updated_at)
SELECT 'USD', 'US Dollar', '$', 1.00000000, TRUE, 10, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM currency_master WHERE currency_code = 'USD');

INSERT INTO currency_master (currency_code, currency_name, currency_symbol, usd_exchange_rate, active, sort_order, created_at, updated_at)
SELECT 'INR', 'Indian Rupee', '₹', 0.01200000, TRUE, 20, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM currency_master WHERE currency_code = 'INR');

INSERT INTO currency_master (currency_code, currency_name, currency_symbol, usd_exchange_rate, active, sort_order, created_at, updated_at)
SELECT 'GBP', 'British Pound', '£', 1.27000000, TRUE, 30, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM currency_master WHERE currency_code = 'GBP');

INSERT INTO currency_master (currency_code, currency_name, currency_symbol, usd_exchange_rate, active, sort_order, created_at, updated_at)
SELECT 'EUR', 'Euro', '€', 1.09000000, TRUE, 40, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM currency_master WHERE currency_code = 'EUR');

INSERT INTO currency_master (currency_code, currency_name, currency_symbol, usd_exchange_rate, active, sort_order, created_at, updated_at)
SELECT 'CAD', 'Canadian Dollar', 'C$', 0.74000000, TRUE, 50, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM currency_master WHERE currency_code = 'CAD');

INSERT INTO currency_master (currency_code, currency_name, currency_symbol, usd_exchange_rate, active, sort_order, created_at, updated_at)
SELECT 'AUD', 'Australian Dollar', 'A$', 0.66000000, TRUE, 60, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM currency_master WHERE currency_code = 'AUD');

INSERT INTO currency_master (currency_code, currency_name, currency_symbol, usd_exchange_rate, active, sort_order, created_at, updated_at)
SELECT 'AED', 'UAE Dirham', 'د.إ', 0.27230000, TRUE, 70, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM currency_master WHERE currency_code = 'AED');

INSERT INTO currency_master (currency_code, currency_name, currency_symbol, usd_exchange_rate, active, sort_order, created_at, updated_at)
SELECT 'JPY', 'Japanese Yen', '¥', 0.00670000, TRUE, 80, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM currency_master WHERE currency_code = 'JPY');
