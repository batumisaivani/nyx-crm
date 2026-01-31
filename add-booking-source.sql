-- Add created_via column to bookings table to track booking source
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS created_via TEXT DEFAULT 'mobile' CHECK (created_via IN ('web', 'mobile'));

-- Add comment for documentation
COMMENT ON COLUMN bookings.created_via IS 'Source of booking creation: web (CRM) or mobile (app)';
