import { useNotificationStore } from '@/stores/notificationStore';

/**
 * Helper function to get the Expo Push Token for backend integration
 * 
 * Usage example:
 * ```typescript
 * import { getPushToken } from '@/utils/getPushToken';
 * 
 * const sendTokenToBackend = async () => {
 *   const token = getPushToken();
 *   
 *   if (token) {
 *     await fetch('https://your-api.com/register-device', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ pushToken: token }),
 *     });
 *   }
 * };
 * ```
 * 
 * @returns The Expo Push Token string or null if not available
 */
export function getPushToken(): string | null {
  const store = useNotificationStore.getState();
  return store.expoPushToken;
}

/**
 * Check if notifications are enabled
 * @returns true if user has granted notification permission
 */
export function isNotificationsEnabled(): boolean {
  const store = useNotificationStore.getState();
  return store.permissionStatus === 'granted';
}

/**
 * Get the current permission status
 * @returns 'granted', 'denied', or 'undetermined'
 */
export function getPermissionStatus() {
  const store = useNotificationStore.getState();
  return store.permissionStatus;
}
