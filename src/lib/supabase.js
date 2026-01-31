import { createClient } from '@supabase/supabase-js'

// Same Supabase credentials as mobile app
const SUPABASE_URL = 'https://chdqdrvjoubiuyoafvlj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZHFkcnZqb3ViaXV5b2FmdmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjQ5NjMsImV4cCI6MjA3ODgwMDk2M30.U5MomnNJ-e8y-pLH9vwrWXrQ0yXvvWIqpoPbbl4kztY'

// Create Supabase client for web
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
