-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  level_override TEXT CHECK (level_override IN ('new', 'regular', 'loyal', 'vip', 'super_vip')),
  notes TEXT,
  birthday DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_salon_id ON customers(salon_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_salon_phone ON customers(salon_id, phone) WHERE phone IS NOT NULL;

-- Add customer_id to bookings (nullable, doesn't break existing bookings)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage customers" ON customers FOR ALL USING (true);

-- Populate customers from existing booking data
INSERT INTO customers (salon_id, name, phone, email, created_at)
SELECT DISTINCT ON (b.salon_id, b.customer_phone)
  b.salon_id,
  b.customer_name,
  b.customer_phone,
  b.customer_email,
  MIN(b.created_at)
FROM bookings b
WHERE b.customer_name IS NOT NULL
  AND b.customer_phone IS NOT NULL
GROUP BY b.salon_id, b.customer_phone, b.customer_name, b.customer_email
ON CONFLICT DO NOTHING;

-- Migrate level overrides from customer_overrides table
UPDATE customers c
SET level_override = co.level_override
FROM customer_overrides co
WHERE co.salon_id = c.salon_id
  AND co.customer_key = c.name || '_' || c.phone;

-- Link existing bookings to customers by matching salon + phone
UPDATE bookings b
SET customer_id = c.id
FROM customers c
WHERE b.salon_id = c.salon_id
  AND b.customer_phone = c.phone
  AND b.customer_id IS NULL;
