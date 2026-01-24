-- Add discord_user_id column to users table
ALTER TABLE users
ADD COLUMN discord_user_id VARCHAR(255) UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_users_discord_user_id ON users(discord_user_id);

-- Add comment
COMMENT ON COLUMN users.discord_user_id IS 'Discord user ID for Discord bot integration';
