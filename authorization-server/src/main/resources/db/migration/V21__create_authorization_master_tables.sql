CREATE TABLE IF NOT EXISTS permission_master (
    permission_code VARCHAR(80) NOT NULL,
    permission_name VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (permission_code)
);

CREATE TABLE IF NOT EXISTS role_permission_mapping (
    id BIGINT NOT NULL AUTO_INCREMENT,
    role_name VARCHAR(80) NOT NULL,
    permission_code VARCHAR(80) NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_role_permission_mapping_role_permission UNIQUE (role_name, permission_code)
);

CREATE TABLE IF NOT EXISTS account_status_master (
    status_code VARCHAR(50) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (status_code)
);

CREATE TABLE IF NOT EXISTS seller_status_master (
    status_code VARCHAR(50) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (status_code)
);

CREATE TABLE IF NOT EXISTS seller_verification_document_master (
    document_code VARCHAR(80) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    required_for_onboarding BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (document_code)
);

CREATE TABLE IF NOT EXISTS notification_event_master (
    event_code VARCHAR(80) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (event_code)
);

CREATE TABLE IF NOT EXISTS notification_template_master (
    template_code VARCHAR(80) NOT NULL,
    event_code VARCHAR(80) NOT NULL,
    channel VARCHAR(30) NOT NULL,
    subject VARCHAR(180) NOT NULL,
    body_template TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (template_code),
    CONSTRAINT fk_notification_template_event FOREIGN KEY (event_code) REFERENCES notification_event_master (event_code)
);

CREATE TABLE IF NOT EXISTS admin_action_type_master (
    action_code VARCHAR(80) NOT NULL,
    display_label VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (action_code)
);

INSERT INTO permission_master (permission_code, permission_name, description, active, sort_order, created_at, updated_at)
SELECT 'USER_READ', 'User Read', 'View user records', TRUE, 10, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM permission_master WHERE permission_code = 'USER_READ');

INSERT INTO permission_master (permission_code, permission_name, description, active, sort_order, created_at, updated_at)
SELECT 'USER_WRITE', 'User Write', 'Create and update user records', TRUE, 20, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM permission_master WHERE permission_code = 'USER_WRITE');

INSERT INTO account_status_master (status_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'ACTIVE', 'Active', 'Account is active', TRUE, 10, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM account_status_master WHERE status_code = 'ACTIVE');

INSERT INTO account_status_master (status_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'PENDING_VERIFICATION', 'Pending Verification', 'Account needs verification', TRUE, 20, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM account_status_master WHERE status_code = 'PENDING_VERIFICATION');

INSERT INTO seller_status_master (status_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'PENDING', 'Pending', 'Seller request pending', TRUE, 10, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM seller_status_master WHERE status_code = 'PENDING');

INSERT INTO seller_status_master (status_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'APPROVED', 'Approved', 'Seller approved', TRUE, 20, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM seller_status_master WHERE status_code = 'APPROVED');

INSERT INTO seller_verification_document_master (document_code, display_label, description, required_for_onboarding, active, sort_order, created_at, updated_at)
SELECT 'GOV_ID', 'Government ID', 'Government issued identity document', TRUE, TRUE, 10, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM seller_verification_document_master WHERE document_code = 'GOV_ID');

INSERT INTO seller_verification_document_master (document_code, display_label, description, required_for_onboarding, active, sort_order, created_at, updated_at)
SELECT 'BUSINESS_PROOF', 'Business Proof', 'Business registration or proof of ownership', FALSE, TRUE, 20, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM seller_verification_document_master WHERE document_code = 'BUSINESS_PROOF');

INSERT INTO notification_event_master (event_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'USER_REGISTERED', 'User Registered', 'New account created', TRUE, 10, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM notification_event_master WHERE event_code = 'USER_REGISTERED');

INSERT INTO notification_event_master (event_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'SELLER_APPROVED', 'Seller Approved', 'Seller onboarding completed', TRUE, 20, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM notification_event_master WHERE event_code = 'SELLER_APPROVED');

INSERT INTO notification_template_master (template_code, event_code, channel, subject, body_template, active, sort_order, created_at, updated_at)
SELECT 'WELCOME_EMAIL', 'USER_REGISTERED', 'EMAIL', 'Welcome to Sharity', 'Welcome {{firstName}}', TRUE, 10, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM notification_template_master WHERE template_code = 'WELCOME_EMAIL');

INSERT INTO admin_action_type_master (action_code, display_label, description, active, sort_order, created_at, updated_at)
SELECT 'USER_STATUS_UPDATE', 'User Status Update', 'Change account status', TRUE, 10, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM admin_action_type_master WHERE action_code = 'USER_STATUS_UPDATE');
