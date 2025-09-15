-- Add new fields to transactions table for enhanced payment tracking
-- Run this SQL on your database to add the missing columns

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS stripe_payment_method_type TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Add indexes for better performance on the new timestamp columns
CREATE INDEX IF NOT EXISTS idx_transactions_completed_at ON transactions(completed_at);
CREATE INDEX IF NOT EXISTS idx_transactions_failed_at ON transactions(failed_at);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method_type ON transactions(stripe_payment_method_type);

-- Verify the new columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name IN ('stripe_payment_method_type', 'completed_at', 'failed_at', 'failure_reason')
ORDER BY column_name;