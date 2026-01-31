-- Add new feature columns to salons table

-- Service categories
ALTER TABLE salons
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Amenities and features
ALTER TABLE salons
ADD COLUMN IF NOT EXISTS pet_friendly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parking_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wheelchair_accessible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wifi_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS card_payment BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS online_booking BOOLEAN DEFAULT true;

-- Gender preference
ALTER TABLE salons
ADD COLUMN IF NOT EXISTS gender_preference VARCHAR(20) DEFAULT 'all';
-- Values: 'all', 'male', 'female', 'unisex'

-- Price range
ALTER TABLE salons
ADD COLUMN IF NOT EXISTS price_range VARCHAR(20) DEFAULT 'medium';
-- Values: 'budget', 'medium', 'premium', 'luxury'

-- Rating (will be calculated from reviews in the future)
ALTER TABLE salons
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Social media links
ALTER TABLE salons
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);

-- Add comments
COMMENT ON COLUMN salons.categories IS 'Array of service categories offered (Hair, Nails, Spa, Makeup, Skincare)';
COMMENT ON COLUMN salons.pet_friendly IS 'Whether pets are allowed';
COMMENT ON COLUMN salons.gender_preference IS 'Gender preference: all, male, female, unisex';
COMMENT ON COLUMN salons.price_range IS 'Price range: budget, medium, premium, luxury';
COMMENT ON COLUMN salons.rating IS 'Average rating from reviews';
COMMENT ON COLUMN salons.review_count IS 'Total number of reviews';
