-- Add commission_rate to specialist_services (percentage of service price)
ALTER TABLE specialist_services ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 50.00;
