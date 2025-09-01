-- Fix RLS policies for HandyPay mobile app
-- Run this in your Supabase SQL Editor

-- First, drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow anonymous user creation" ON users;
DROP POLICY IF EXISTS "Allow anonymous user reads" ON users;
DROP POLICY IF EXISTS "Allow anonymous user updates" ON users;

-- Create permissive policies for anonymous users (mobile app)
-- Allow anonymous inserts for new user registration
CREATE POLICY "Allow anonymous user creation" ON users
  FOR INSERT TO anon WITH CHECK (true);

-- Allow anonymous reads for user lookup
CREATE POLICY "Allow anonymous user reads" ON users
  FOR SELECT TO anon USING (true);

-- Allow anonymous updates for login tracking
CREATE POLICY "Allow anonymous user updates" ON users
  FOR UPDATE TO anon USING (true);

-- Allow authenticated users full access to their own data
CREATE POLICY "Users can manage own profile" ON users
  FOR ALL TO authenticated USING (auth.uid()::text = id);