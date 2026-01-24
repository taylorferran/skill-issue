import { BotConfig } from '../types';
import * as dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

export function loadConfig(): BotConfig {
  return {
    discordToken: process.env.DISCORD_BOT_TOKEN!,
    discordClientId: process.env.DISCORD_CLIENT_ID!,
    backendApiUrl: process.env.BACKEND_API_URL || 'http://localhost:3000/api',
    backendApiKey: process.env.BACKEND_API_KEY!,
    challengeCheckEnabled: process.env.CHALLENGE_CHECK_ENABLED !== 'false',
    challengeCheckCron: process.env.CHALLENGE_CHECK_CRON || '5,35 * * * *',
    rateLimitMinutes: parseInt(process.env.RATE_LIMIT_MINUTES || '60', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}

export const config = loadConfig();
