CREATE TABLE IF NOT EXISTS order_status_master (
    status_code VARCHAR(50) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    customer_visible BOOLEAN NOT NULL DEFAULT TRUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (status_code)
);

CREATE TABLE IF NOT EXISTS payment_status_master (
    status_code VARCHAR(50) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    customer_visible BOOLEAN NOT NULL DEFAULT TRUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (status_code)
);

CREATE TABLE IF NOT EXISTS payment_method_master (
    method_code VARCHAR(50) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (method_code)
);

CREATE TABLE IF NOT EXISTS refund_reason_master (
    reason_code VARCHAR(80) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (reason_code)
);

CREATE TABLE IF NOT EXISTS dispute_reason_master (
    reason_code VARCHAR(80) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (reason_code)
);

INSERT INTO order_status_master (status_code, display_label, description, customer_visible, active, sort_order, created_at, updated_at)
SELECT 'PENDING', 'Pending', 'Order placed and waiting for capture', TRUE, TRUE, 10, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM order_status_master WHERE status_code = 'PENDING');

INSERT INTO order_status_master (status_code, display_label, description, customer_visible, active, sort_order, created_at, updated_at)
SELECT 'CAPTURED', 'Captured', 'Payment captured successfully', TRUE, TRUE, 20, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM order_status_master WHERE status_code = 'CAPTURED');

INSERT INTO payment_status_master (status_code, display_label, description, customer_visible, active, sort_order, created_at, updated_at)
SELECT 'AUTHORIZED', 'Authorized', 'Payment authorized', TRUE, TRUE, 10, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM payment_status_master WHERE status_code = 'AUTHORIZED');

INSERT INTO payment_status_master (status_code, display_label, description, customer_visible, active, sort_order, created_at, updated_at)
SELECT 'CAPTURED', 'Captured', 'Payment captured', TRUE, TRUE, 20, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM payment_status_master WHERE status_code = 'CAPTURED');

INSERT INTO payment_method_master (method_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'CARD', 'Card', 'Debit or credit card payment method', TRUE, 10, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM payment_method_master WHERE method_code = 'CARD');

INSERT INTO payment_method_master (method_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'PAYPAL', 'PayPal', 'PayPal payment method', TRUE, 20, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM payment_method_master WHERE method_code = 'PAYPAL');

INSERT INTO refund_reason_master (reason_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'DID_NOT_RECEIVE', 'Did not receive order', 'Customer did not receive the order', TRUE, 10, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM refund_reason_master WHERE reason_code = 'DID_NOT_RECEIVE');

INSERT INTO refund_reason_master (reason_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'NOT_AS_DESCRIBED', 'Not as described', 'Item or delivery did not match listing', TRUE, 20, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM refund_reason_master WHERE reason_code = 'NOT_AS_DESCRIBED');

INSERT INTO dispute_reason_master (reason_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'SELLER_SHARED_CODE_IN_CHAT', 'Seller shared code in chat', 'Digital code was shared outside the approved flow', TRUE, 10, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM dispute_reason_master WHERE reason_code = 'SELLER_SHARED_CODE_IN_CHAT');

INSERT INTO dispute_reason_master (reason_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'REFUND_REJECTED_UNFAIRLY', 'Refund rejected unfairly', 'Customer disputes a refund decision', TRUE, 20, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM dispute_reason_master WHERE reason_code = 'REFUND_REJECTED_UNFAIRLY');
