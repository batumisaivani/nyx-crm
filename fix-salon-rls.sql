-- ============================================
-- Fix RLS Policy for Salon Creation
-- ============================================
-- Allow authenticated users to create salons during registration

-- Add policy to allow salon creation
CREATE POLICY "Allow authenticated users to create salons"
  ON salons FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add policy to allow salon owners to update their own salons
CREATE POLICY "Salon owners can update their salons"
  ON salons FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT salon_id FROM facility_users WHERE user_id = auth.uid()
    )
  );

-- Add policy to allow everyone to view salons (needed for mobile app)
CREATE POLICY "Everyone can view salons"
  ON salons FOR SELECT
  TO anon, authenticated
  USING (true);
