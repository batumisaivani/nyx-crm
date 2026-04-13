CREATE TABLE IF NOT EXISTS closed_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT DEFAULT 'Holiday',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_closed_periods_salon ON closed_periods(salon_id);
CREATE INDEX IF NOT EXISTS idx_closed_periods_dates ON closed_periods(salon_id, start_date, end_date);

ALTER TABLE closed_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage closed periods" ON closed_periods FOR ALL USING (true);
