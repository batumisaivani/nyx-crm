-- ============================================
-- Complete Fix for Salon RLS Policies
-- ============================================
-- This removes all existing policies and creates the correct ones

-- Step 1: Drop all existing policies on salons table
DROP POLICY IF EXISTS "Allow authenticated users to create salons" ON salons;
DROP POLICY IF EXISTS "Salon owners can update their salons" ON salons;
DROP POLICY IF EXISTS "Everyone can view salons" ON salons;
DROP POLICY IF EXISTS "Facilities see own services" ON salons;
DROP POLICY IF EXISTS "Enable read access for all users" ON salons;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON salons;
DROP POLICY IF EXISTS "Enable update for users based on email" ON salons;

-- Step 2: Create new policies

-- Allow everyone to view salons (needed for mobile app)
CREATE POLICY "public_salons_select"
  ON salons FOR SELECT
  USING (true);

-- Allow authenticated users to insert salons (for registration)
CREATE POLICY "authenticated_salons_insert"
  ON salons FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow salon owners to update their own salons
CREATE POLICY "owners_salons_update"
  ON salons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.salon_id = salons.id
      AND facility_users.user_id = auth.uid()
    )
  );

-- Allow salon owners to delete their own salons (optional)
CREATE POLICY "owners_salons_delete"
  ON salons FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.salon_id = salons.id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role = 'owner'
    )
  );
