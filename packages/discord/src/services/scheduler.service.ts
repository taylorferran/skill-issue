import cron from 'node-cron';
import { Client } from 'discord.js';
import { config } from '../config';
import { apiService } from './api.service';
import { ChallengeHandler } from '../handlers/challenge.handler';

export class SchedulerService {
  private task?: cron.ScheduledTask;
  private lastNotificationTimes: Map<string, number> = new Map();
  private client: Client;
  private challengeHandler: ChallengeHandler;

  constructor(client: Client, challengeHandler: ChallengeHandler) {
    this.client = client;
    this.challengeHandler = challengeHandler;
  }

  start(): void {
    if (!config.challengeCheckEnabled) {
      console.log('⏸️  Challenge scheduler is disabled');
      return;
    }

    console.log(`⏰ Starting challenge scheduler with cron: ${config.challengeCheckCron}`);

    this.task = cron.schedule(config.challengeCheckCron, async () => {
      await this.checkPendingChallenges();
    });

    console.log('✅ Challenge scheduler started');
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      console.log('⏹️  Challenge scheduler stopped');
    }
  }

  private async checkPendingChallenges(): Promise<void> {
    console.log('🔍 Checking for pending challenges...');

    try {
      // Get all registered Discord users
      const allMappings = await this.getAllUserMappings();

      let notificationsSent = 0;
      let usersChecked = 0;

      for (const { discordUserId, backendUserId } of allMappings) {
        usersChecked++;

        try {
          // Check rate limit
          if (this.isRateLimited(discordUserId)) {
            continue;
          }

          // Get pending challenges from API
          const pendingChallenges = await apiService.getPendingChallenges(backendUserId);

          if (pendingChallenges.length === 0) {
            continue;
          }

          // Get Discord user
          const discordUser = await this.client.users.fetch(discordUserId);
          if (!discordUser) {
            console.warn(`Could not find Discord user: ${discordUserId}`);
            continue;
          }

          // Send the first pending challenge
          const challenge = pendingChallenges[0];
          await this.challengeHandler.sendChallenge(discordUser, challenge, backendUserId);

          // Update rate limit
          this.lastNotificationTimes.set(discordUserId, Date.now());
          notificationsSent++;

        } catch (error) {
          console.error(`Error checking challenges for user ${discordUserId}:`, error);
        }
      }

      console.log(`✅ Challenge check complete. Checked ${usersChecked} users, sent ${notificationsSent} notifications`);

    } catch (error) {
      console.error('Error in challenge scheduler:', error);
    }
  }

  private isRateLimited(discordUserId: string): boolean {
    const lastNotification = this.lastNotificationTimes.get(discordUserId);
    if (!lastNotification) {
      return false;
    }

    const timeSinceLastNotification = Date.now() - lastNotification;
    const rateLimitMs = config.rateLimitMinutes * 60 * 1000;

    return timeSinceLastNotification < rateLimitMs;
  }

  private async getAllUserMappings(): Promise<Array<{ discordUserId: string; backendUserId: string }>> {
    // Read mappings from the user service's internal storage
    // We need to expose this data from the user service
    const mappingsFile = require('path').join(__dirname, '../../data/user-mappings.json');
    try {
      const data = await require('fs').promises.readFile(mappingsFile, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  // Manual trigger for testing
  async triggerCheck(): Promise<void> {
    console.log('🔧 Manually triggering challenge check');
    await this.checkPendingChallenges();
  }
}
