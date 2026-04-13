CREATE TABLE IF NOT EXISTS specialist_breaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID REFERENCES specialists(id) ON DELETE CASCADE NOT NULL,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  break_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  label TEXT NOT NULL DEFAULT 'Break',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_specialist_breaks_date ON specialist_breaks(salon_id, break_date);
CREATE INDEX IF NOT EXISTS idx_specialist_breaks_specialist ON specialist_breaks(specialist_id, break_date);

ALTER TABLE specialist_breaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage breaks" ON specialist_breaks FOR ALL USING (true);
