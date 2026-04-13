CREATE TABLE IF NOT EXISTS blocked_booking_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  blocked_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blocked_dates_unique ON blocked_booking_dates(salon_id, blocked_date);

ALTER TABLE blocked_booking_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage blocked dates" ON blocked_booking_dates FOR ALL USING (true);
