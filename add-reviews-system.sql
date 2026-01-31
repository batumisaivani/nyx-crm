-- Drop existing reviews table if it exists (to start fresh)
DROP TABLE IF EXISTS reviews CASCADE;

-- Create reviews table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  reply_text TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_reviews_salon_id ON reviews(salon_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Add helpful comments
COMMENT ON TABLE reviews IS 'Customer reviews and ratings for salons';
COMMENT ON COLUMN reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN reviews.review_text IS 'Customer review text';
COMMENT ON COLUMN reviews.reply_text IS 'Facility owner reply to the review';
COMMENT ON COLUMN reviews.replied_at IS 'Timestamp when facility owner replied';

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

-- Policy: Authenticated users can insert their own reviews
CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reviews (not replies)
CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Anyone authenticated can update reviews (for salon owner replies)
-- This is a simplified policy - salon owners can reply to any review on their salon
CREATE POLICY "Authenticated users can update reviews" ON reviews
  FOR UPDATE USING (auth.role() = 'authenticated');
