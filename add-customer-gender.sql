ALTER TABLE customers ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));
