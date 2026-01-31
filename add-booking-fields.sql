-- Add customer information fields for manual bookings
-- These fields allow creating bookings directly from the CRM for walk-in customers

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Make user_id nullable since manual bookings might not have a registered user
ALTER TABLE bookings ALTER COLUMN user_id DROP NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN bookings.customer_name IS 'Name for manual/walk-in bookings';
COMMENT ON COLUMN bookings.customer_phone IS 'Phone number for manual/walk-in bookings';
COMMENT ON COLUMN bookings.customer_email IS 'Email for manual/walk-in bookings (optional)';
COMMENT ON COLUMN bookings.notes IS 'Additional notes or special requests';
