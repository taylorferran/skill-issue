# Discord Bot Setup Guide

## Prerequisites

1. Backend API running (usually at `http://localhost:3000`)
2. Database migration applied
3. Discord bot created in Discord Developer Portal

## Step 1: Apply Database Migration

Before running the Discord bot, you need to add the `discord_user_id` column to the users table:

```sql
-- Run this migration on your database
-- File: packages/backend/migrations/001_add_discord_user_id.sql

ALTER TABLE users
ADD COLUMN discord_user_id VARCHAR(255) UNIQUE;

CREATE INDEX idx_users_discord_user_id ON users(discord_user_id);

COMMENT ON COLUMN users.discord_user_id IS 'Discord user ID for Discord bot integration';
```

If you're using Supabase:
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the migration SQL above
4. Run the query

If you're using a local PostgreSQL database:
```bash
psql your_database_name < packages/backend/migrations/001_add_discord_user_id.sql
```

## Step 2: Configure Environment Variables

Make sure your `.env` file in `packages/discord/` has all required variables:

```env
# Discord Bot
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id

# Backend API
BACKEND_API_URL=http://localhost:3000/api
BACKEND_API_KEY=your_api_key

# Scheduler (Optional)
CHALLENGE_CHECK_ENABLED=true
CHALLENGE_CHECK_CRON=5,35 * * * *
RATE_LIMIT_MINUTES=60

# Logging
LOG_LEVEL=info
```

## Step 3: Install Dependencies

```bash
cd packages/discord
npm install
```

## Step 4: Start the Bot

For development (with auto-reload):
```bash
npm run dev
```

For production:
```bash
npm run build
npm start
```

## Step 5: Test the Bot

Once the bot is running, go to your Discord server and try these commands:

1. `/register` - Register as a new user
2. `/skills` - View available skills
3. `/enroll skill:JavaScript difficulty:3` - Enroll in a skill
4. `/challenge` - Get a manual challenge
5. `/history` - View your challenge history
6. `/status` - Check your account status

## Available Commands

| Command | Description | Parameters |
|---------|-------------|------------|
| `/register` | Create a new user account | Interactive modal |
| `/skills` | List all available skills | None |
| `/enroll` | Enroll in a skill | `skill` (required), `difficulty` (optional, 1-10) |
| `/challenge` | Request next pending challenge | None |
| `/history` | View challenge history | `limit` (optional, default: 10) |
| `/status` | View account status and progress | None |

## Automated Challenge Delivery

The bot automatically checks for pending challenges every 30 minutes (at :05 and :35 of each hour) and sends them via DM to registered users.

To modify the schedule, update the `CHALLENGE_CHECK_CRON` environment variable.

## Troubleshooting

### Bot doesn't respond to commands
1. Make sure the bot is online in your Discord server
2. Check that slash commands are registered (should happen automatically on bot startup)
3. Verify the bot has the correct permissions

### "Backend API health check failed"
1. Make sure the backend is running at the URL specified in `BACKEND_API_URL`
2. Verify the `BACKEND_API_KEY` is correct
3. Check backend logs for errors

### "You need to register first"
1. Run the `/register` command
2. Fill out the registration form
3. Check backend logs to ensure the user was created

### Migration errors
1. Make sure you have the correct database permissions
2. Verify the `users` table exists
3. Check if the column already exists: `\d users` (in psql)

## Data Storage

The Discord bot stores user mappings (Discord User ID → Backend User ID) in:
- **File:** `packages/discord/data/user-mappings.json`
- **Also stored:** Backend database in `users.discord_user_id` column

This ensures persistence across bot restarts and allows the backend to query users by Discord ID.

## Development Tips

- Use `npm run dev` for development with auto-reload
- Check logs for detailed error messages
- Use `/challenge` command to manually trigger challenges for testing
- Test the scheduler by waiting for :05 or :35 past the hour

## Next Steps

- Enroll in skills using `/enroll`
- Wait for automated challenges or use `/challenge`
- Track your progress with `/history` and `/status`
- Customize your schedule and difficulty targets
