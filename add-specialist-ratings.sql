-- Add specialist_id to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS specialist_id UUID REFERENCES specialists(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_specialist_id ON reviews(specialist_id);

-- Create pending_ratings table (created when booking is marked completed)
CREATE TABLE IF NOT EXISTS pending_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  specialist_id UUID REFERENCES specialists(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_name TEXT,
  specialist_name TEXT,
  is_rated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_ratings_user_id ON pending_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_ratings_booking_id ON pending_ratings(booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_ratings_unique_booking ON pending_ratings(booking_id);

-- Enable RLS
ALTER TABLE pending_ratings ENABLE ROW LEVEL SECURITY;

-- Users can read their own pending ratings
CREATE POLICY "Users can view own pending ratings" ON pending_ratings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own pending ratings (mark as rated)
CREATE POLICY "Users can update own pending ratings" ON pending_ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role and authenticated users with salon access can insert
CREATE POLICY "Authenticated users can insert pending ratings" ON pending_ratings
  FOR INSERT WITH CHECK (true);

-- Create push_tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT DEFAULT 'expo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_push_tokens_user_token ON push_tokens(user_id, token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

-- Enable RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "Users can manage own push tokens" ON push_tokens
  FOR ALL USING (auth.uid() = user_id);
