-- Create Cart table
CREATE TABLE cart (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_id VARCHAR(50) NOT NULL UNIQUE,
    customer_id VARCHAR(100) NOT NULL,
    total_items INT DEFAULT 0,
    subtotal DECIMAL(19, 4) DEFAULT 0,
    discount_amount DECIMAL(19, 4) DEFAULT 0,
    tax_amount DECIMAL(19, 4) DEFAULT 0,
    total DECIMAL(19, 4) DEFAULT 0,
    currency_code VARCHAR(3) DEFAULT 'USD',
    cart_status VARCHAR(20) DEFAULT 'ACTIVE',
    last_modified_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    INDEX idx_cart_customer_id (customer_id),
    INDEX idx_cart_created_at (created_at)
);

-- Create CartItem table
CREATE TABLE cart_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_item_id VARCHAR(50) NOT NULL UNIQUE,
    cart_id BIGINT NOT NULL,
    listing_id VARCHAR(100) NOT NULL,
    listing_title VARCHAR(500) NOT NULL,
    provider_id VARCHAR(100) NOT NULL,
    provider_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(19, 4) NOT NULL,
    line_total DECIMAL(19, 4),
    discount_per_unit DECIMAL(19, 4) DEFAULT 0,
    line_discount DECIMAL(19, 4) DEFAULT 0,
    delivery_type VARCHAR(50),
    vertical_code VARCHAR(50),
    item_status VARCHAR(20) DEFAULT 'ADDED',
    added_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
    INDEX idx_cart_item_cart_id (cart_id),
    INDEX idx_cart_item_listing_id (listing_id)
);
