-- Add promo code fields to bookings table

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS final_price DECIMAL(10, 2);

-- Add index for promo code lookups
CREATE INDEX IF NOT EXISTS idx_bookings_promo_code ON bookings(promo_code);

-- Add comments
COMMENT ON COLUMN bookings.promo_code IS 'Promo code applied to this booking';
COMMENT ON COLUMN bookings.discount_amount IS 'Discount amount from promo code';
COMMENT ON COLUMN bookings.final_price IS 'Final price after discount';
