-- Add test specialist working hours
-- This will set specialists to work from 09:00 to 15:00 on weekdays
-- You'll see the difference on the calendar after 15:00 (faded/striped pattern)

-- First, let's get the specialist IDs from your salon
-- Replace 'YOUR_SALON_ID' with your actual salon ID or run this query to find it:
-- SELECT id FROM salons LIMIT 1;

-- Example: Add working hours for all specialists in your salon
-- Monday through Friday: 09:00 - 15:00
INSERT INTO specialist_working_hours (specialist_id, day_of_week, start_time, end_time, is_closed, is_day_off)
SELECT
  id,
  day_name,
  '09:00'::time,
  '15:00'::time,
  false,
  false
FROM specialists
CROSS JOIN (
  VALUES ('monday'), ('tuesday'), ('wednesday'), ('thursday'), ('friday')
) AS days(day_name)
WHERE salon_id IN (SELECT id FROM salons LIMIT 1)
ON CONFLICT DO NOTHING;

-- Optional: Add Saturday hours (09:00 - 12:00)
INSERT INTO specialist_working_hours (specialist_id, day_of_week, start_time, end_time, is_closed, is_day_off)
SELECT
  id,
  'saturday',
  '09:00'::time,
  '12:00'::time,
  false,
  false
FROM specialists
WHERE salon_id IN (SELECT id FROM salons LIMIT 1)
ON CONFLICT DO NOTHING;

-- Sunday is day off (no entry needed, will show as unavailable if you add this)
INSERT INTO specialist_working_hours (specialist_id, day_of_week, start_time, end_time, is_closed, is_day_off)
SELECT
  id,
  'sunday',
  '00:00'::time,
  '00:00'::time,
  false,
  true
FROM specialists
WHERE salon_id IN (SELECT id FROM salons LIMIT 1)
ON CONFLICT DO NOTHING;
