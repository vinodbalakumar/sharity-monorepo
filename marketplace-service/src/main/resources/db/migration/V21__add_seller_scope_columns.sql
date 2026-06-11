-- Add seller scope columns for managing seller marketplace eligibility and fulfillment capabilities

ALTER TABLE seller ADD COLUMN IF NOT EXISTS seller_scope_digital BOOLEAN DEFAULT false;
ALTER TABLE seller ADD COLUMN IF NOT EXISTS seller_scope_jewelry BOOLEAN DEFAULT false;
ALTER TABLE seller ADD COLUMN IF NOT EXISTS seller_scope_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE seller ADD COLUMN IF NOT EXISTS seller_scope_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add fulfillment scope columns for tracking seller fulfillment capabilities
ALTER TABLE seller ADD COLUMN IF NOT EXISTS fulfillment_scope_physical BOOLEAN DEFAULT false;
ALTER TABLE seller ADD COLUMN IF NOT EXISTS fulfillment_scope_digital BOOLEAN DEFAULT false;
ALTER TABLE seller ADD COLUMN IF NOT EXISTS fulfillment_scope_reveal BOOLEAN DEFAULT false;

-- Create index for faster scope-based queries
CREATE INDEX IF NOT EXISTS idx_seller_scope ON seller(seller_scope_digital, seller_scope_jewelry);
CREATE INDEX IF NOT EXISTS idx_fulfillment_scope ON seller(fulfillment_scope_physical, fulfillment_scope_digital, fulfillment_scope_reveal);
