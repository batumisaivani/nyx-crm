-- Payment tracking for completed bookings
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  specialist_id UUID REFERENCES specialists(id) ON DELETE SET NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'loyalty', 'split')),
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  tip_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  loyalty_points_used INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_salon_id ON payments(salon_id);
CREATE INDEX IF NOT EXISTS idx_payments_specialist_id ON payments(specialist_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_booking ON payments(booking_id);

-- Additional services added at checkout
CREATE TABLE IF NOT EXISTS booking_additional_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_additional_services_booking ON booking_additional_services(booking_id);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_additional_services ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can manage payments" ON payments FOR ALL USING (true);
CREATE POLICY "Authenticated users can manage additional services" ON booking_additional_services FOR ALL USING (true);
