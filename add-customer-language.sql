ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'ka';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'ka';
