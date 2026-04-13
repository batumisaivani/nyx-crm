-- Customer level overrides (since there's no dedicated customers table)
CREATE TABLE IF NOT EXISTS customer_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  customer_key TEXT NOT NULL, -- name_phone composite key
  level_override TEXT CHECK (level_override IN ('new', 'regular', 'loyal', 'vip', 'super_vip')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_overrides_unique ON customer_overrides(salon_id, customer_key);

ALTER TABLE customer_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage customer overrides" ON customer_overrides FOR ALL USING (true);
