# Skill Issue Discord Bot

A Discord bot that integrates with the Skill Issue backend to provide an interactive learning experience through Discord.

## Features

- **User Registration:** Create accounts and configure preferences via Discord
- **Skill Enrollment:** Browse and enroll in available skills
- **Automated Challenges:** Receive challenges every 30 minutes (at :05 and :35)
- **Interactive Answering:** Answer challenges with button interactions
- **Challenge History:** Track your learning progress
- **User Stats:** View your performance and streaks

## Prerequisites

- Node.js 18 or higher
- Backend API running
- Discord bot token (see setup guide)
- PostgreSQL database with migration applied

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Apply Database Migration
```sql
-- Run this on your database
ALTER TABLE users ADD COLUMN discord_user_id VARCHAR(255) UNIQUE;
CREATE INDEX idx_users_discord_user_id ON users(discord_user_id);
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your Discord bot credentials and backend API details.

### 4. Run the Bot
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

## Commands

| Command | Description | Parameters |
|---------|-------------|------------|
| `/register` | Create a new user account | Interactive modal |
| `/skills` | List all available skills | None |
| `/enroll` | Enroll in a skill | `skill` (required), `difficulty` (optional) |
| `/challenge` | Request next pending challenge | None |
| `/history` | View challenge history | `limit` (optional, default: 10) |
| `/status` | View account status and progress | None |

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

See [TESTING.md](./TESTING.md) for detailed testing documentation.

## Project Structure

```
packages/discord/
├── src/
│   ├── commands/          # Slash command implementations
│   ├── handlers/          # Event and interaction handlers
│   ├── services/          # Business logic and API clients
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── config/            # Configuration management
│   └── index.ts           # Bot entry point
├── tests/                 # Jest test files
├── data/                  # Local data storage (user mappings)
└── package.json
```

## Architecture

### Core Components

- **Commands**: Slash commands for user interactions
- **Handlers**: Challenge presentation and answer processing
- **Services**:
  - API Service: Backend communication
  - User Service: Discord↔Backend user mapping
  - Scheduler Service: Automated challenge delivery
- **Utils**: Message formatting and helpers

### Data Flow

1. User runs command → Command handler validates → API call to backend
2. Scheduler triggers → Fetches pending challenges → Sends DMs with buttons
3. User clicks button → Handler processes → Submits to backend → Shows result

## Configuration

Key environment variables:

```env
# Required
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
BACKEND_API_URL=http://localhost:3000/api
BACKEND_API_KEY=your_api_key

# Optional
CHALLENGE_CHECK_ENABLED=true
CHALLENGE_CHECK_CRON=5,35 * * * *  # Every 30 mins at :05 and :35
RATE_LIMIT_MINUTES=60               # Min time between challenge notifications
LOG_LEVEL=info
```

## Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup and deployment guide
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - Architecture and design decisions
- **[TESTING.md](./TESTING.md)** - Testing strategy and guidelines

## Development

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

## Troubleshooting

### Bot doesn't respond to commands
- Verify bot is online in Discord server
- Check slash commands are registered (happens on startup)
- Ensure bot has correct permissions

### Backend connection failed
- Verify `BACKEND_API_URL` is correct
- Check `BACKEND_API_KEY` matches backend configuration
- Ensure backend is running and accessible

### Database errors
- Verify migration has been applied
- Check database connection from backend
- Ensure `discord_user_id` column exists in `users` table

### Tests failing
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (18+ required)
- Verify test database is configured (for integration tests)

## License

MIT
