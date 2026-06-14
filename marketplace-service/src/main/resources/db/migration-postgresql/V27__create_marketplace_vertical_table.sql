CREATE TABLE verticals_master (
    module_code VARCHAR(50) NOT NULL,
    module_name VARCHAR(120) NOT NULL,
    description VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL,
    display_order INT NOT NULL,
    icon_key VARCHAR(50) NOT NULL,
    module_type VARCHAR(50) NOT NULL,
    frontend_route VARCHAR(120) NOT NULL,
    api_audience VARCHAR(80) NOT NULL,
    customer_access_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    provider_access_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    requires_provider_approval BOOLEAN NOT NULL DEFAULT TRUE,
    available_to_customer BOOLEAN NOT NULL DEFAULT TRUE,
    provider_access_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (module_code),
    CONSTRAINT uk_verticals_master_module_name UNIQUE (module_name),
    CONSTRAINT uk_verticals_master_frontend_route UNIQUE (frontend_route),
    CONSTRAINT uk_verticals_master_api_audience UNIQUE (api_audience)
);

INSERT INTO verticals_master (
    module_code, module_name, description, status, display_order, icon_key, module_type,
    frontend_route, api_audience, customer_access_enabled, provider_access_enabled,
    requires_provider_approval, available_to_customer, provider_access_active, created_at, updated_at
)
SELECT
    'MARKETPLACE', 'Marketplace', 'Protected resale and everyday commerce', 'ACTIVE', 10, 'store', 'COMMERCE_VERTICAL',
    '/marketplace', 'MARKETPLACE_API', TRUE, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM verticals_master WHERE module_code = 'MARKETPLACE');

INSERT INTO verticals_master (
    module_code, module_name, description, status, display_order, icon_key, module_type,
    frontend_route, api_audience, customer_access_enabled, provider_access_enabled,
    requires_provider_approval, available_to_customer, provider_access_active, created_at, updated_at
)
SELECT
    'GROCERY', 'Grocery', 'Fresh pantry and household essentials', 'ACTIVE', 20, 'shopping_basket', 'COMMERCE_VERTICAL',
    '/grocery', 'GROCERY_API', TRUE, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM verticals_master WHERE module_code = 'GROCERY');

INSERT INTO verticals_master (
    module_code, module_name, description, status, display_order, icon_key, module_type,
    frontend_route, api_audience, customer_access_enabled, provider_access_enabled,
    requires_provider_approval, available_to_customer, provider_access_active, created_at, updated_at
)
SELECT
    'MEAT_SHOP', 'Meat Shop', 'Cut-to-order meats and seafood', 'ACTIVE', 30, 'set_meal', 'COMMERCE_VERTICAL',
    '/meat-shop', 'MEAT_SHOP_API', TRUE, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM verticals_master WHERE module_code = 'MEAT_SHOP');

INSERT INTO verticals_master (
    module_code, module_name, description, status, display_order, icon_key, module_type,
    frontend_route, api_audience, customer_access_enabled, provider_access_enabled,
    requires_provider_approval, available_to_customer, provider_access_active, created_at, updated_at
)
SELECT
    'PHARMACY', 'Pharmacy', 'OTC wellness and personal-care goods', 'ACTIVE', 40, 'medical_services', 'COMMERCE_VERTICAL',
    '/pharmacy', 'PHARMACY_API', TRUE, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM verticals_master WHERE module_code = 'PHARMACY');

INSERT INTO verticals_master (
    module_code, module_name, description, status, display_order, icon_key, module_type,
    frontend_route, api_audience, customer_access_enabled, provider_access_enabled,
    requires_provider_approval, available_to_customer, provider_access_active, created_at, updated_at
)
SELECT
    'AUTOMOTIVE', 'Automotive', 'Accessories and maintenance products', 'ACTIVE', 50, 'directions_car', 'COMMERCE_VERTICAL',
    '/automotive', 'AUTOMOTIVE_API', TRUE, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM verticals_master WHERE module_code = 'AUTOMOTIVE');

INSERT INTO verticals_master (
    module_code, module_name, description, status, display_order, icon_key, module_type,
    frontend_route, api_audience, customer_access_enabled, provider_access_enabled,
    requires_provider_approval, available_to_customer, provider_access_active, created_at, updated_at
)
SELECT
    'JEWELLERY', 'One Gram Gold & Imitation Jewellery', 'One gram gold, imitation jewellery, fashion jewellery, and accessories', 'ACTIVE', 60, 'diamond', 'COMMERCE_VERTICAL',
    '/jewellery', 'JEWELLERY_API', TRUE, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM verticals_master WHERE module_code = 'JEWELLERY');

INSERT INTO verticals_master (
    module_code, module_name, description, status, display_order, icon_key, module_type,
    frontend_route, api_audience, customer_access_enabled, provider_access_enabled,
    requires_provider_approval, available_to_customer, provider_access_active, created_at, updated_at
)
SELECT
    'GIFT_CARDS', 'Gift Cards', 'Digital and value cards for popular brands', 'ACTIVE', 70, 'card_giftcard', 'COMMERCE_VERTICAL',
    '/gift-cards', 'GIFT_CARD_API', TRUE, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
WHERE NOT EXISTS (SELECT 1 FROM verticals_master WHERE module_code = 'GIFT_CARDS');
