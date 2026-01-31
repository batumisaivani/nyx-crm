-- Safer migration: Alter existing table instead of dropping

-- Add new columns if they don't exist
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_text TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reply_text TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

-- Migrate data from 'comment' to 'review_text' if 'comment' column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'comment'
  ) THEN
    UPDATE reviews SET review_text = comment WHERE review_text IS NULL;
    ALTER TABLE reviews DROP COLUMN comment;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_reviews_salon_id ON reviews(salon_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Add helpful comments
COMMENT ON TABLE reviews IS 'Customer reviews and ratings for salons';
COMMENT ON COLUMN reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN reviews.review_text IS 'Customer review text';
COMMENT ON COLUMN reviews.reply_text IS 'Facility owner reply to the review';
COMMENT ON COLUMN reviews.replied_at IS 'Timestamp when facility owner replied';

-- Enable Row Level Security if not already enabled
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Salon owners can reply to reviews" ON reviews;

-- Create policies
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Salon owners can reply to reviews" ON reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM facility_access
      WHERE facility_access.user_id = auth.uid()
      AND facility_access.salon_id = reviews.salon_id
    )
  );
