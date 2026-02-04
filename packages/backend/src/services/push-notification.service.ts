import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import type { Challenge } from '@/types';

/**
 * Push Notification Service
 * Sends push notifications via Expo Push API
 * Todo: This probably needs rework based on how Jordan wants to handle notifications on the apps
 */

class PushNotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN,
    });
  }

  /**
   * Send challenge notification to user
   */
  async sendChallengeNotification(
    pushToken: string,
    challenge: Challenge,
    skillName: string
  ): Promise<boolean> {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`[Push] Invalid Expo push token: ${pushToken}`);
      return false;
    }

    const message: ExpoPushMessage = {
      to: pushToken,
      sound: 'default',
      title: `${skillName} Challenge`,
      body: 'Time to test your skills! Tap to answer.',
      data: {
        challengeId: challenge.id,
        skillId: challenge.skillId,
        difficulty: challenge.difficulty,
        type: 'challenge',
        // Full challenge data for instant quiz load
        skillName: skillName,
        question: challenge.question,
        options: challenge.options,
        correctAnswerIndex: challenge.correctAnswerIndex,
        explanation: challenge.explanation,
      },
      badge: 1,
      priority: 'high',
    };

    try {
      const tickets = await this.expo.sendPushNotificationsAsync([message]);
      console.log('[Push] Sent notification:', tickets[0]);

      // Check for errors
      const ticket = tickets[0];
      if (ticket.status === 'error') {
        console.error('[Push] Error sending notification:', ticket.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Push] Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Send batch notifications
   */
  async sendBatchNotifications(
    messages: ExpoPushMessage[]
  ): Promise<ExpoPushTicket[]> {
    // Expo recommends batching notifications
    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const chunkTickets = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...chunkTickets);
      } catch (error) {
        console.error('[Push] Error sending batch:', error);
      }
    }

    return tickets;
  }

  /**
   * Check receipt status of sent notifications
   */
  async checkReceipts(receiptIds: string[]): Promise<void> {
    const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);

    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);

        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];

          if (receipt.status === 'error') {
            console.error(`[Push] Receipt error for ${receiptId}:`, receipt.message);

            // Handle specific errors
            if (receipt.details?.error === 'DeviceNotRegistered') {
              console.log(`[Push] Device unregistered, should remove token`);
              // TODO: Remove invalid push token from database
            }
          }
        }
      } catch (error) {
        console.error('[Push] Error fetching receipts:', error);
      }
    }
  }

  /**
   * Validate a push token
   */
  isValidPushToken(token: string): boolean {
    return Expo.isExpoPushToken(token);
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
