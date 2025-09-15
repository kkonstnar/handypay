-- Create push_tokens table for push notifications
-- Run this SQL on your database to create the missing table

CREATE TABLE IF NOT EXISTS push_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  
  -- Token details
  token TEXT NOT NULL, -- Expo push token
  device_type TEXT NOT NULL, -- 'ios' | 'android'
  device_id TEXT, -- Unique device identifier
  
  -- Status and management
  is_active BOOLEAN DEFAULT TRUE,
  last_used TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);

-- Verify the table was created
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'push_tokens' 
ORDER BY ordinal_position;
