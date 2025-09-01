-- Add stripe_account_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Create index for Stripe account ID lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_account_id ON users(stripe_account_id);

-- Update RLS policies if needed (the existing policies should already cover this)
