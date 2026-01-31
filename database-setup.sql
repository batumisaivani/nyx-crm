-- Create calendar_settings table
CREATE TABLE IF NOT EXISTS calendar_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  slot_duration INTEGER NOT NULL DEFAULT 30, -- in minutes: 15, 30, or 60
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(salon_id)
);

-- Create specialist_working_hours table
-- Supports multiple shifts per day (no UNIQUE constraint)
CREATE TABLE IF NOT EXISTS specialist_working_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL, -- 'monday', 'tuesday', etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT FALSE,
  is_day_off BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  -- Removed UNIQUE(specialist_id, day_of_week) to allow multiple shifts per day
);

-- Add RLS policies for calendar_settings
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calendar settings for their salon"
  ON calendar_settings FOR SELECT
  USING (
    salon_id IN (
      SELECT salon_id FROM facility_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert calendar settings for their salon"
  ON calendar_settings FOR INSERT
  WITH CHECK (
    salon_id IN (
      SELECT salon_id FROM facility_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update calendar settings for their salon"
  ON calendar_settings FOR UPDATE
  USING (
    salon_id IN (
      SELECT salon_id FROM facility_access WHERE user_id = auth.uid()
    )
  );

-- Add RLS policies for specialist_working_hours
ALTER TABLE specialist_working_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view specialist working hours for their salon"
  ON specialist_working_hours FOR SELECT
  USING (
    specialist_id IN (
      SELECT id FROM specialists WHERE salon_id IN (
        SELECT salon_id FROM facility_access WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert specialist working hours for their salon"
  ON specialist_working_hours FOR INSERT
  WITH CHECK (
    specialist_id IN (
      SELECT id FROM specialists WHERE salon_id IN (
        SELECT salon_id FROM facility_access WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update specialist working hours for their salon"
  ON specialist_working_hours FOR UPDATE
  USING (
    specialist_id IN (
      SELECT id FROM specialists WHERE salon_id IN (
        SELECT salon_id FROM facility_access WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete specialist working hours for their salon"
  ON specialist_working_hours FOR DELETE
  USING (
    specialist_id IN (
      SELECT id FROM specialists WHERE salon_id IN (
        SELECT salon_id FROM facility_access WHERE user_id = auth.uid()
      )
    )
  );

-- Insert default calendar settings (30 minute slots) for existing salons
INSERT INTO calendar_settings (salon_id, slot_duration)
SELECT id, 30
FROM salons
ON CONFLICT (salon_id) DO NOTHING;
