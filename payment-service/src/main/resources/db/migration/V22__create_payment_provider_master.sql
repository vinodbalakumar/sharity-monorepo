CREATE TABLE payment_provider_master (
    provider_code VARCHAR(50) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    gateway_mode VARCHAR(50) NOT NULL,
    active BOOLEAN NOT NULL,
    sort_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT pk_payment_provider_master PRIMARY KEY (provider_code)
);

INSERT INTO payment_provider_master (provider_code, display_name, description, gateway_mode, active, sort_order, created_at, updated_at)
VALUES
    ('MOCK', 'Sandbox Gateway', 'Local sandbox gateway that always succeeds without moving real money.', 'mock', TRUE, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('STRIPE_TEST', 'Stripe Test Adapter', 'Stripe-shaped adapter that returns test references without calling the real Stripe API.', 'stripe-test', TRUE, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PAYPAL_MOCK', 'PayPal Sandbox Adapter', 'PayPal-shaped sandbox adapter for country routing and admin previews.', 'paypal-mock', TRUE, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
