-- Add customer contact details to bookings table (if not already added)

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);

-- Add indexes for searching
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone ON bookings(customer_phone);

-- Add comments
COMMENT ON COLUMN bookings.customer_name IS 'Customer full name from profile';
COMMENT ON COLUMN bookings.customer_email IS 'Customer email address';
COMMENT ON COLUMN bookings.customer_phone IS 'Customer phone number';
