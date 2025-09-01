-- Create users table for HandyPay mobile app
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  auth_provider TEXT NOT NULL CHECK (auth_provider IN ('apple', 'google')),
  apple_user_id TEXT,
  google_user_id TEXT,
  member_since TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_apple_user_id ON users(apple_user_id);
CREATE INDEX IF NOT EXISTS idx_users_google_user_id ON users(google_user_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for user data access
-- Allow anonymous inserts for new user registration (most permissive)
CREATE POLICY "Allow anonymous user creation" ON users
  FOR INSERT WITH CHECK (true);

-- Allow anonymous reads (for user lookup)
CREATE POLICY "Allow anonymous user reads" ON users
  FOR SELECT TO anon USING (true);

-- Allow anonymous updates (for login tracking)
CREATE POLICY "Allow anonymous user updates" ON users
  FOR UPDATE TO anon USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON users TO anon, authenticated;