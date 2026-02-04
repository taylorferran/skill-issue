import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Set the OS-level app icon badge count
 * @param count - The number to display on the app icon badge
 */
export async function setAppBadgeCount(count: number): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      // On Android, we use setBadgeCountAsync from expo-notifications
      // This sets the badge count on supported launchers (Samsung, Sony, etc.)
      await Notifications.setBadgeCountAsync(count);
      console.log('[BadgeUtils] ✅ Android app icon badge set to:', count);
    }
    // iOS is handled automatically by the notification handler's shouldSetBadge
  } catch (error) {
    console.error('[BadgeUtils] ❌ Failed to set badge count:', error);
  }
}

/**
 * Get the current OS-level badge count
 * @returns The current badge count
 */
export async function getAppBadgeCount(): Promise<number> {
  try {
    const count = await Notifications.getBadgeCountAsync();
    return count;
  } catch (error) {
    console.error('[BadgeUtils] ❌ Failed to get badge count:', error);
    return 0;
  }
}

/**
 * Clear all notifications from the notification center
 * This removes all visible push notifications from the device's notification shade
 */
export async function clearAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
    console.log('[BadgeUtils] 🧹 All notifications cleared from notification center');
  } catch (error) {
    console.error('[BadgeUtils] ❌ Failed to clear notifications:', error);
  }
}

/**
 * Clear a specific notification from the notification center by its identifier
 * @param notificationIdentifier - The Expo notification identifier
 */
export async function clearNotification(notificationIdentifier: string): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(notificationIdentifier);
    console.log('[BadgeUtils] 🧹 Notification cleared:', notificationIdentifier);
  } catch (error) {
    console.error('[BadgeUtils] ❌ Failed to clear notification:', error);
  }
}

/**
 * Clear badge count and notifications (useful for sign out or reset)
 */
export async function clearBadgeAndNotifications(): Promise<void> {
  try {
    await Promise.all([
      setAppBadgeCount(0),
      clearAllNotifications(),
    ]);
    console.log('[BadgeUtils] 🧹 Badge and notifications fully cleared');
  } catch (error) {
    console.error('[BadgeUtils] ❌ Failed to clear badge and notifications:', error);
  }
}
