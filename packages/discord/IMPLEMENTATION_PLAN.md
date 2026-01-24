# Discord Bot Implementation Plan

## Overview

Build a Discord bot that integrates with the Skill Issue backend to provide an interactive learning experience through Discord chat. Users can create accounts, enroll in skills, receive challenges, and track their progress directly through Discord.

---

## Architecture

### Tech Stack

- **Discord.js** - Discord bot framework
- **TypeScript** - Type-safe development
- **Node-cron** - Scheduled task execution for challenge checks
- **Axios** - HTTP client for backend API calls
- **dotenv** - Environment configuration

### Data Storage

- **User Mapping:** Store Discord User ID → Backend User ID mapping
  - Options: Local JSON file, SQLite database, or backend database table
  - **Recommendation:** Add a `discord_user_id` column to the backend `users` table for persistent mapping

### Bot Structure

```
packages/discord/
├── src/
│   ├── index.ts              # Bot initialization and startup
│   ├── commands/             # Discord slash commands
│   │   ├── register.ts       # /register command
│   │   ├── skills.ts         # /skills command
│   │   ├── enroll.ts         # /enroll command
│   │   ├── history.ts        # /history command
│   │   └── status.ts         # /status command (optional)
│   ├── services/
│   │   ├── api.service.ts    # Backend API client
│   │   ├── user.service.ts   # User mapping management
│   │   └── scheduler.service.ts # Challenge checking scheduler
│   ├── handlers/
│   │   ├── challenge.handler.ts  # Challenge presentation and answer handling
│   │   └── message.handler.ts    # Message interaction handling
│   ├── types/
│   │   └── index.ts          # TypeScript types and interfaces
│   ├── config/
│   │   └── index.ts          # Configuration management
│   └── utils/
│       └── format.ts         # Message formatting utilities
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## Feature Implementation Details

### 1. User Registration Flow

**Command:** `/register`

**Flow:**
1. User runs `/register` in Discord
2. Bot checks if Discord user is already registered
3. If not registered:
   - Prompt user for timezone (provide dropdown/autocomplete)
   - Prompt for quiet hours (start/end, optional)
   - Prompt for max challenges per day (default: 5)
4. Bot calls `POST /api/users` with collected data
5. Store mapping: Discord User ID → Backend User ID
6. Send confirmation message with user ID and settings

**Implementation Notes:**
- Use Discord embeds for rich formatting
- Use Discord select menus for timezone selection
- Validate inputs before API call
- Handle errors gracefully (user already exists, API errors)

---

### 2. Load Skills

**Command:** `/skills`

**Flow:**
1. User runs `/skills`
2. Bot calls `GET /api/skills`
3. Display available skills in an embed with:
   - Skill name
   - Description
   - Enrollment status (if user is enrolled)
4. Include buttons/reactions to enroll directly

**Implementation Notes:**
- Paginate if there are many skills
- Show which skills user is already enrolled in
- Use embeds with color coding

---

### 3. Enroll in Skill

**Command:** `/enroll <skill-name> [difficulty]`

**Flow:**
1. User runs `/enroll` command
2. Bot verifies user is registered
3. If skill name provided, find matching skill
4. If no skill name, show skill selection menu
5. Ask for difficulty target (1-10, default: 2) if not provided
6. Call `POST /api/users/:userId/skills`
7. Confirm enrollment with embed showing:
   - Skill name and description
   - Difficulty target
   - Challenge schedule info

**Alternative Flow:**
- Use button interaction from `/skills` command result
- Pre-fill skill ID, just ask for difficulty

**Implementation Notes:**
- Fuzzy match skill names for better UX
- Validate user is not already enrolled
- Handle enrollment errors

---

### 4. Challenge Checking Scheduler

**Cron Schedule:** Every 30 minutes at :05 and :35 (e.g., 10:05, 10:35, 11:05...)

**Cron Expression:** `5,35 * * * *`

**Flow:**
1. At scheduled time, fetch all registered Discord users
2. For each user:
   a. Call `GET /api/users/:userId/challenges/pending`
   b. If pending challenges exist:
      - Check if user has been sent challenges recently (rate limiting)
      - If not, send the first pending challenge via DM
3. Track sent challenges to avoid spam

**Implementation Notes:**
- Run scheduler only when bot is ready
- Implement rate limiting: max 1 challenge notification per hour per user
- Store last notification time per user
- Handle API errors gracefully
- Log scheduler activity for debugging

**Configuration:**
- Allow configuration of schedule interval
- Allow enabling/disabling scheduler
- Allow configuration of rate limit

---

### 5. Challenge Presentation

**Trigger:**
- Scheduled check finds pending challenge
- User can also manually request via `/challenge` command

**Presentation:**
1. Send DM to user with embed containing:
   - **Title:** Skill name
   - **Description:** "New Challenge Available!"
   - **Field 1:** Question text
   - **Field 2:** Difficulty level (e.g., ⭐⭐⭐)
   - **Buttons/Reactions:** Four buttons labeled 1️⃣, 2️⃣, 3️⃣, 4️⃣ for each option
   - **Options:** Display all four options clearly
   - **Footer:** Challenge ID, timestamp

2. Wait for user interaction (button click)

3. When user clicks an answer button:
   - Record response time (time since message sent)
   - Optionally ask for confidence level (1-5 scale)
   - Call `POST /api/answer` with:
     - challengeId
     - userId
     - selectedOption (0-3 index, convert from button 1-4)
     - responseTime
     - confidence (if collected)

4. Display result embed:
   - ✅ or ❌ based on correctness
   - Show correct answer
   - Show explanation
   - Show updated stats (streak, accuracy)

**Implementation Notes:**
- Use Discord button components for answer selection
- Set button timeout (e.g., 24 hours)
- Disable buttons after answer submitted
- Edit original message to show result
- Handle API errors when submitting answer
- Track active challenges to prevent duplicate answers

---

### 6. Challenge History

**Command:** `/history [limit]`

**Flow:**
1. User runs `/history` with optional limit (default: 10, max: 20)
2. Bot verifies user is registered
3. Call `GET /api/users/:userId/challenges/history?limit=X`
4. Display paginated embeds showing:
   - Challenge question (truncated if long)
   - Skill name
   - User's answer vs correct answer
   - Result (✅/❌)
   - Timestamp
   - Response time
   - Confidence

**Implementation Notes:**
- Use pagination with reaction buttons (◀️ ▶️)
- Show 5 challenges per page
- Use color coding for correct (green) vs incorrect (red)
- Include summary stats at the top

---

## Additional Features (Optional)

### 7. Status Command

**Command:** `/status`

**Shows:**
- User's registered skills
- Current streaks
- Accuracy per skill
- Total challenges completed
- Next scheduled challenge time

### 8. Unenroll Command

**Command:** `/unenroll <skill-name>`

**Flow:**
- Find skill by name
- Call `DELETE /api/users/:userId/skills/:skillId`
- Confirm unenrollment

### 9. Settings Command

**Command:** `/settings`

**Allows updating:**
- Timezone
- Quiet hours
- Max challenges per day
- Notification preferences

---

## User Binding Strategy

### Challenge: Ensure user messages/interactions are tied to their backend user

**Solution 1: Discord User ID Mapping (Recommended)**
- Store `discord_user_id` in backend `users` table
- When user registers via Discord bot, create user with their Discord ID
- All subsequent commands use Discord ID to look up backend user ID
- API calls use the mapped backend user ID

**Solution 2: Session-based Approach**
- Store active sessions in memory: Discord User ID → Backend User ID
- Persist sessions to prevent data loss on bot restart

**Solution 3: Discord Username → Backend**
- Less reliable due to username changes
- Not recommended

**Chosen Approach:** Solution 1 with database mapping

**Implementation:**
1. Add `discord_user_id` column to `users` table (nullable, unique)
2. Bot stores mapping locally in memory on startup
3. Before any API call requiring user context:
   ```typescript
   const backendUserId = await userService.getBackendUserId(discordUserId);
   if (!backendUserId) {
     return "You need to register first! Use /register";
   }
   ```

---

## Environment Configuration

**Required Environment Variables:**

```env
# Discord Bot
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id

# Backend API
BACKEND_API_URL=http://localhost:3000/api
BACKEND_API_KEY=your_api_key

# Scheduler
CHALLENGE_CHECK_ENABLED=true
CHALLENGE_CHECK_CRON=5,35 * * * *
RATE_LIMIT_MINUTES=60

# Database (if using local SQLite for mapping)
DATABASE_PATH=./data/discord-users.db

# Logging
LOG_LEVEL=info
```

---

## Database Schema Changes

**New column in `users` table:**

```sql
ALTER TABLE users
ADD COLUMN discord_user_id VARCHAR(255) UNIQUE;

CREATE INDEX idx_users_discord_user_id ON users(discord_user_id);
```

**Or create a separate mapping table:**

```sql
CREATE TABLE discord_user_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discord_user_id VARCHAR(255) UNIQUE NOT NULL,
  backend_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_discord_mappings_discord_id ON discord_user_mappings(discord_user_id);
CREATE INDEX idx_discord_mappings_backend_id ON discord_user_mappings(backend_user_id);
```

---

## Implementation Steps

### Phase 1: Setup & Infrastructure
1. ✅ Create `/packages/discord` folder
2. Initialize Node.js/TypeScript project
   - `npm init -y`
   - Install dependencies: `discord.js`, `typescript`, `@types/node`, `dotenv`, `axios`, `node-cron`
   - Configure `tsconfig.json`
3. Set up project structure (folders: src, commands, services, handlers, etc.)
4. Create `.env.example` and `.env` files
5. Set up Discord bot application in Discord Developer Portal
6. Implement basic bot initialization and login

### Phase 2: Core Services
7. Implement `api.service.ts` - HTTP client for backend API
   - Create methods for all needed API endpoints
   - Add error handling and retries
8. Implement `user.service.ts` - User mapping management
   - Load mappings on startup
   - Provide lookup methods
   - Handle mapping CRUD operations
9. Add database migration for `discord_user_id` column or mapping table

### Phase 3: Basic Commands
10. Implement `/register` command
    - User input collection
    - Backend API integration
    - User mapping storage
11. Implement `/skills` command
    - Fetch and display skills
    - Show enrollment status
12. Implement `/enroll` command
    - Skill selection
    - Difficulty configuration
    - Enrollment API call

### Phase 4: Challenge System
13. Implement challenge presentation handler
    - Embed formatting
    - Button components for answers
    - Interaction handling
14. Implement answer submission logic
    - Response time tracking
    - API submission
    - Result display
15. Implement `/history` command
    - Fetch history from API
    - Pagination
    - Formatting

### Phase 5: Scheduler
16. Implement `scheduler.service.ts`
    - Cron job setup
    - Pending challenge checking
    - Rate limiting
    - DM sending
17. Test scheduler with multiple users
18. Add scheduler controls (start/stop)

### Phase 6: Polish & Testing
19. Error handling and user feedback
20. Logging and monitoring
21. Help command and documentation
22. Integration testing with backend
23. Deploy and monitor

---

## Command Reference

| Command | Description | Parameters |
|---------|-------------|------------|
| `/register` | Create a new user account | None (interactive) |
| `/skills` | List all available skills | None |
| `/enroll` | Enroll in a skill | `skill-name`, `[difficulty]` |
| `/challenge` | Request next pending challenge manually | None |
| `/history` | View challenge history | `[limit]` (default: 10) |
| `/status` | View account status and progress | None |
| `/unenroll` | Unenroll from a skill | `skill-name` |
| `/settings` | Update account settings | None (interactive) |
| `/help` | Show help and command list | None |

---

## Security Considerations

1. **API Key Protection:** Store API key in environment variables, never commit to version control
2. **User Data Privacy:** Only send challenges via DMs to prevent data leakage in public channels
3. **Rate Limiting:** Prevent spam and abuse with rate limits on commands and challenge notifications
4. **Input Validation:** Validate all user inputs before sending to backend API
5. **Error Messages:** Don't expose internal errors or stack traces to users
6. **Permission Checks:** Verify user registration before allowing access to commands

---

## Testing Strategy

1. **Unit Tests:** Test individual services and utilities
2. **Integration Tests:** Test API service against real or mocked backend
3. **Bot Testing:** Use Discord test server for manual testing
4. **Load Testing:** Test scheduler with multiple users
5. **Error Scenarios:** Test API failures, network issues, invalid inputs

---

## Deployment

**Options:**
1. **VPS/Cloud Server:** Deploy to AWS EC2, DigitalOcean, etc.
2. **Container:** Docker container for easy deployment
3. **PaaS:** Heroku, Railway, Render
4. **Serverless:** AWS Lambda (with limitations on long-running processes)

**Recommended:** Docker container on a VPS or PaaS platform

**Deployment Checklist:**
- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Discord bot token secured
- [ ] Backend API accessible from deployment environment
- [ ] Logging configured
- [ ] Process manager (PM2) or container orchestration
- [ ] Monitoring and alerts set up

---

## Open Questions & Decisions Needed

1. **User Mapping Storage:** Backend database vs local storage?
   - **Recommendation:** Backend database (add `discord_user_id` column)

2. **Challenge Notification Preference:** Always DM or allow server channel notifications?
   - **Recommendation:** Start with DMs, add channel option later

3. **Confidence Collection:** Ask for confidence level after every answer?
   - **Recommendation:** Make it optional via a follow-up button

4. **Skill Selection UX:** Dropdown menu, autocomplete, or button grid?
   - **Recommendation:** Dropdown select menu for better UX

5. **Error Handling:** How verbose should error messages be to users?
   - **Recommendation:** User-friendly messages, log details server-side

6. **Multi-server Support:** Should one Discord user have different accounts per server?
   - **Recommendation:** Single account per Discord user across all servers

---

## Future Enhancements

- **Leaderboards:** Show top performers per skill
- **Achievements/Badges:** Gamification elements
- **Social Features:** Challenge friends, share results
- **Custom Notifications:** Let users customize notification times
- **Voice Challenges:** Interactive voice-based challenges
- **Streak Reminders:** Notify users when streaks are at risk
- **Analytics Dashboard:** Show detailed progress graphs via web portal
- **Multi-language Support:** Internationalization

---

## Success Metrics

- **User Adoption:** Number of registered Discord users
- **Engagement:** Average challenges completed per user per day
- **Retention:** Daily/weekly active users
- **Accuracy:** Average user accuracy across all skills
- **Response Time:** How quickly users respond to challenges
- **Bot Uptime:** 99%+ availability target

---

## Timeline Estimate

Based on the phases above, implementation broken down by complexity:

- **Phase 1:** Setup & Infrastructure - 1-2 days
- **Phase 2:** Core Services - 2-3 days
- **Phase 3:** Basic Commands - 3-4 days
- **Phase 4:** Challenge System - 4-5 days
- **Phase 5:** Scheduler - 2-3 days
- **Phase 6:** Polish & Testing - 2-3 days

**Total:** Approximately 2-3 weeks for full implementation

---

## Notes

- This plan assumes the backend API is stable and accessible
- Discord.js v14+ should be used for latest features
- Consider using a command framework like `@sapphire/framework` for better organization
- Implement comprehensive logging from the start for easier debugging
- Keep the initial version simple, iterate based on user feedback
