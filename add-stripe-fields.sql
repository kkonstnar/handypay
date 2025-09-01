-- Add Stripe fields to users table (both Supabase and Postgres)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add comment to document the columns
COMMENT ON COLUMN users.stripe_account_id IS 'Stripe Connect account ID for payment processing';
COMMENT ON COLUMN users.stripe_onboarding_completed IS 'Whether the user has completed Stripe onboarding';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_account_id ON users(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_onboarding_completed ON users(stripe_onboarding_completed);

-- Update existing users who might have completed onboarding but not marked in DB
-- (This would need to be run after checking with the backend)
-- You can run this query to check existing accounts:
-- SELECT id, email, stripe_account_id FROM users WHERE stripe_account_id IS NOT NULL;

-- To mark existing accounts as completed (if they have account IDs):
-- UPDATE users SET stripe_onboarding_completed = TRUE WHERE stripe_account_id IS NOT NULL AND stripe_onboarding_completed = FALSE;
