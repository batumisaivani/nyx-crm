-- ============================================
-- Disable Email Confirmation for Development
-- ============================================
-- This allows users to register without confirming email
-- IMPORTANT: Only use this for development/testing!

-- For Supabase, email confirmation is controlled in the dashboard
-- This note is just a reminder to disable it manually

-- GO TO:
-- 1. Supabase Dashboard → Authentication → Providers
-- 2. Click on "Email" provider
-- 3. Scroll down to "Confirm email"
-- 4. Toggle it OFF (disable)
-- 5. Click Save

SELECT 'Please disable email confirmation in Supabase Dashboard: Authentication → Providers → Email → Turn OFF "Confirm email"' as instructions;
