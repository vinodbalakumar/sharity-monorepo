# Database Schema - Sharity MVP

**Version:** 1.0  
**Database:** MySQL 8.0  
**Last Updated:** June 7, 2026

---

## 📊 SCHEMA OVERVIEW

```sql
-- Users & Authentication
users
├── user_id (UUID, PK)
├── email (VARCHAR, UNIQUE)
├── password_hash (VARCHAR)
├── first_name, last_name
├── country_code, phone
├── profile_image_url
├── created_at, updated_at
└── deleted_at

user_roles
├── user_id (FK)
├── role (ENUM: BUYER, SELLER, ADMIN)
└── created_at

-- Marketplace Products
categories
├── category_id (UUID, PK)
├── name (VARCHAR, UNIQUE)
├── description (TEXT)
├── icon_url
├── status (ACTIVE, INACTIVE)
├── created_at, updated_at
└── deleted_at

products
├── product_id (UUID, PK)
├── seller_id (FK)
├── category_id (FK)
├── name (VARCHAR)
├── description (TEXT)
├── price (DECIMAL)
├── original_price (DECIMAL)
├── status (ACTIVE, INACTIVE, DELETED)
├── digital_product_flag (BOOLEAN)
├── inventory_count (INT, nullable)
├── created_at, updated_at
└── deleted_at

product_images
├── image_id (UUID, PK)
├── product_id (FK)
├── image_url (VARCHAR, stored in R2)
├── sort_order (INT)
├── created_at
└── deleted_at

-- Cart & Checkout
shopping_carts
├── cart_id (UUID, PK)
├── user_id (FK, UNIQUE)
├── created_at, updated_at
└── deleted_at

cart_items
├── cart_item_id (UUID, PK)
├── cart_id (FK)
├── product_id (FK)
├── quantity (INT)
├── price_at_time (DECIMAL)
├── created_at, updated_at
└── deleted_at

coupons
├── coupon_id (UUID, PK)
├── code (VARCHAR, UNIQUE)
├── discount_type (PERCENTAGE, FIXED)
├── discount_value (DECIMAL)
├── max_uses (INT)
├── current_uses (INT)
├── valid_from, valid_until
├── status (ACTIVE, INACTIVE)
├── created_at, updated_at
└── deleted_at

-- Orders & Payments
orders
├── order_id (UUID, PK)
├── buyer_id (FK)
├── seller_id (FK)
├── status (PENDING, AUTHORIZED, CAPTURED, SHIPPED, DELIVERED, REFUNDED)
├── subtotal (DECIMAL)
├── taxes (DECIMAL)
├── fees (DECIMAL)
├── total (DECIMAL)
├── shipping_address (VARCHAR)
├── tracking_number (VARCHAR, nullable)
├── created_at, updated_at
└── deleted_at

order_items
├── order_item_id (UUID, PK)
├── order_id (FK)
├── product_id (FK)
├── quantity (INT)
├── price_at_purchase (DECIMAL)
├── digital_content_key (VARCHAR, encrypted, nullable)
├── created_at
└── deleted_at

payments
├── payment_id (UUID, PK)
├── order_id (FK, UNIQUE)
├── buyer_id (FK)
├── amount (DECIMAL)
├── status (AUTHORIZED, CAPTURED, REFUNDED, FAILED)
├── payment_method (PAYPAL, STRIPE_LATER, etc.)
├── transaction_id (VARCHAR, from PayPal)
├── auth_token (VARCHAR, from PayPal)
├── created_at, updated_at
└── deleted_at

refunds
├── refund_id (UUID, PK)
├── payment_id (FK)
├── amount (DECIMAL)
├── reason (VARCHAR)
├── status (REQUESTED, APPROVED, PROCESSED, REJECTED)
├── created_at, updated_at
└── deleted_at

-- Seller Management
sellers
├── seller_id (UUID, PK)
├── user_id (FK, UNIQUE)
├── business_name (VARCHAR)
├── bank_account (VARCHAR, encrypted)
├── tax_id (VARCHAR, encrypted)
├── status (PENDING, VERIFIED, SUSPENDED, DEACTIVATED)
├── created_at, updated_at
└── deleted_at

seller_earnings
├── earnings_id (UUID, PK)
├── seller_id (FK)
├── order_id (FK)
├── gross_amount (DECIMAL)
├── commission (DECIMAL)
├── platform_fee (DECIMAL)
├── net_amount (DECIMAL)
├── status (EARNED, HELD, PAID)
├── created_at
└── deleted_at

payouts
├── payout_id (UUID, PK)
├── seller_id (FK)
├── amount (DECIMAL)
├── status (REQUESTED, PROCESSING, COMPLETED, FAILED)
├── created_at, processed_at
└── deleted_at

-- Disputes & Reviews
disputes
├── dispute_id (UUID, PK)
├── order_id (FK)
├── initiator_id (FK)
├── reason (VARCHAR)
├── description (TEXT)
├── status (OPEN, IN_REVIEW, RESOLVED, CLOSED)
├── resolution (TEXT, nullable)
├── created_at, resolved_at
└── deleted_at

reviews
├── review_id (UUID, PK)
├── product_id (FK)
├── buyer_id (FK)
├── rating (INT: 1-5)
├── title (VARCHAR)
├── comment (TEXT)
├── helpful_count (INT)
├── created_at, updated_at
└── deleted_at

-- Notifications
notifications
├── notification_id (UUID, PK)
├── user_id (FK)
├── type (ORDER_CREATED, PAYMENT_RECEIVED, REFUND_REQUESTED, etc.)
├── title (VARCHAR)
├── message (TEXT)
├── is_read (BOOLEAN)
├── related_order_id (FK, nullable)
├── created_at
└── read_at (nullable)
```

---

## 🔑 KEY RELATIONSHIPS

```
User (1) ──→ (Many) Orders
User (1) ──→ (Many) Products (as seller)
User (1) ──→ (Many) Reviews
User (1) ──→ (Many) Notifications
User (1) ──→ (1) Seller (optional)
User (1) ──→ (1) ShoppingCart

Order (1) ──→ (Many) OrderItems
Order (1) ──→ (1) Payment
Order (1) ──→ (Many) Refunds
Order (1) ──→ (Many) Disputes

Product (1) ──→ (Many) ProductImages
Product (1) ──→ (Many) CartItems
Product (1) ──→ (Many) OrderItems
Product (1) ──→ (Many) Reviews

Seller (1) ──→ (Many) Products
Seller (1) ──→ (Many) SellerEarnings
Seller (1) ──→ (Many) Payouts

ShoppingCart (1) ──→ (Many) CartItems
CartItem (Many) ──→ (1) Product
```

---

## 📑 INDEXES (Performance Optimization)

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Product searches
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Cart operations
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_shopping_carts_user_id ON shopping_carts(user_id, UNIQUE);

-- Order lookups
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Payment tracking
CREATE INDEX idx_payments_order_id ON payments(order_id, UNIQUE);
CREATE INDEX idx_payments_buyer_id ON payments(buyer_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Refund tracking
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);

-- Seller management
CREATE INDEX idx_sellers_user_id ON sellers(user_id, UNIQUE);
CREATE INDEX idx_sellers_status ON sellers(status);

-- Earnings tracking
CREATE INDEX idx_seller_earnings_seller_id ON seller_earnings(seller_id);
CREATE INDEX idx_seller_earnings_status ON seller_earnings(status);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Search optimization
CREATE FULLTEXT INDEX idx_products_search ON products(name, description);
```

---

## 🔐 ENCRYPTION FIELDS

```
Fields encrypted at rest (AES-256):
├── sellers.bank_account
├── sellers.tax_id
├── order_items.digital_content_key
├── payments.auth_token
└── users.password_hash (hashed with BCrypt, not encrypted)
```

---

## 📈 PARTITIONING STRATEGY (Phase 2+)

```
orders: Partition by date (yearly)
  ├── orders_2026
  ├── orders_2027
  └── orders_2028 (future)

payments: Partition by date (yearly)
seller_earnings: Partition by date (yearly)
notifications: Partition by date (monthly, auto-purge after 3 months)
```

---

## 🗑️ DATA RETENTION POLICY

```
Users: Retain indefinitely (GDPR right to erasure = soft delete)
Orders: Retain 7 years (tax/audit requirement)
Payments: Retain 7 years (PCI DSS compliance)
Notifications: Retain 3 months, then archive/delete
Refunds: Retain 7 years (tax/audit requirement)
Reviews: Retain indefinitely
Logs: Retain 90 days, then archive
Deleted items: Soft delete (retain data), hard delete after 90 days
```

---

## 🔄 MIGRATION MANAGEMENT (Flyway)

```
Location: src/main/resources/db/migration/
Format: V{version}__{description}.sql

Naming convention:
  V1__create_users_table.sql
  V2__create_products_table.sql
  V3__add_indexes.sql
  V4__create_orders_table.sql
  etc.

Key principles:
  ✅ Always additive (no destructive changes)
  ✅ Idempotent (safe to run multiple times)
  ✅ Tested locally before production
  ✅ Reversible (keep old migration if needed)
  ✅ Version control all migrations
```

---

## 📊 DATABASE STATISTICS

### Current MVP Scale
```
Estimated Growth (Year 1):
├─ Users: 100K → 1M
├─ Products: 10K → 100K
├─ Orders: 1K → 500K
├─ Payments: 1K → 500K
└─ Database size: 5GB → 50GB
```

---

**Database Status:** ✅ Ready for Phase 2  
**Last Updated:** June 7, 2026
