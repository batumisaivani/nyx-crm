-- ============================================
-- TEMPORARY: Disable RLS on salons table
-- ============================================
-- This allows registration to work while we test
-- We'll add proper policies later

-- Disable RLS on salons table
ALTER TABLE salons DISABLE ROW LEVEL SECURITY;
