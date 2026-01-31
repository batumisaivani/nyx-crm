-- Create promos table for promotional offers and discounts

CREATE TABLE IF NOT EXISTS promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,

  -- Promo details
  code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Discount configuration
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),

  -- Validity
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,

  -- Restrictions
  max_uses INTEGER, -- NULL means unlimited
  current_uses INTEGER DEFAULT 0,
  min_purchase_amount DECIMAL(10, 2), -- NULL means no minimum

  -- Service restrictions (NULL means all services)
  applicable_service_ids UUID[], -- Array of service IDs

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_date_range CHECK (valid_until >= valid_from),
  CONSTRAINT valid_discount_percentage CHECK (
    discount_type != 'percentage' OR (discount_value > 0 AND discount_value <= 100)
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_promos_salon_id ON promos(salon_id);
CREATE INDEX IF NOT EXISTS idx_promos_code ON promos(code);
CREATE INDEX IF NOT EXISTS idx_promos_active ON promos(is_active);

-- Disable RLS for development (enable with proper policies in production)
ALTER TABLE promos DISABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON TABLE promos IS 'Promotional offers and discount codes for salons';
