import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Challenge } from '@/types/Quiz';

/**
 * Notification Store
 * Manages push notification state, Expo Push Token, and pending challenges with persistent storage
 */

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface NotificationState {
  // Expo Push Token for sending push notifications
  expoPushToken: string | null;

  // Current permission status
  permissionStatus: PermissionStatus;

  // Whether we've already prompted the user for permission
  hasPromptedUser: boolean;

  // Pending challenges for notification badge
  pendingChallenges: Challenge[];
  lastUpdated: number;

  // Actions
  setExpoPushToken: (token: string) => void;
  setPermissionStatus: (status: PermissionStatus) => void;
  setHasPromptedUser: (prompted: boolean) => void;
  setPendingChallenges: (challenges: Challenge[]) => void;
  addPendingChallenge: (challenge: Challenge) => void;
  removePendingChallenge: (challengeId: string) => void;

  // Get the push token (null if not available)
  getPushToken: () => string | null;

  // Check if notifications are enabled
  isNotificationsEnabled: () => boolean;

  // Get unread count (for badge display)
  getUnreadCount: () => number;

  // Clear all notification data (on sign out)
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      expoPushToken: null,
      permissionStatus: 'undetermined',
      hasPromptedUser: false,
      pendingChallenges: [],
      lastUpdated: 0,

      // Actions
      setExpoPushToken: (token: string) => {
        console.log('[NotificationStore] 💾 Attempting to save token:', token);

        // Validate token is not null/undefined/empty
        if (!token || token.trim() === '') {
          console.error('[NotificationStore] ❌ Rejecting null/empty token');
          return;
        }

        // Validate token format (Expo tokens should start with specific prefix)
        if (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
          console.warn('[NotificationStore] ⚠️ Token has unexpected format but saving anyway:', token);
        }

        console.log('[NotificationStore] ✅ Token saved successfully');
        set({ expoPushToken: token });
      },

      setPermissionStatus: (status: PermissionStatus) => {
        set({ permissionStatus: status });
      },

      setHasPromptedUser: (prompted: boolean) => {
        set({ hasPromptedUser: prompted });
      },

      setPendingChallenges: (challenges: Challenge[]) => {
        console.log('[NotificationStore] 📝 Setting pending challenges:', challenges.length);
        set({
          pendingChallenges: challenges,
          lastUpdated: Date.now(),
        });
      },

      addPendingChallenge: (challenge: Challenge) => {
        console.log('[NotificationStore] ➕ Adding pending challenge:', challenge.challengeId);
        const { pendingChallenges } = get();
        // Check if challenge already exists
        const exists = pendingChallenges.some(c => c.challengeId === challenge.challengeId);
        if (!exists) {
          set({
            pendingChallenges: [...pendingChallenges, challenge],
            lastUpdated: Date.now(),
          });
        }
      },

      removePendingChallenge: (challengeId: string) => {
        console.log('[NotificationStore] ➖ Removing pending challenge:', challengeId);
        const { pendingChallenges } = get();
        set({
          pendingChallenges: pendingChallenges.filter(c => c.challengeId !== challengeId),
          lastUpdated: Date.now(),
        });
      },

      getPushToken: () => {
        const { expoPushToken } = get();
        return expoPushToken;
      },

      isNotificationsEnabled: () => {
        const { permissionStatus } = get();
        return permissionStatus === 'granted';
      },

      getUnreadCount: () => {
        const { pendingChallenges } = get();
        return pendingChallenges.length;
      },

      reset: () => {
        set({
          expoPushToken: null,
          permissionStatus: 'undetermined',
          hasPromptedUser: false,
          pendingChallenges: [],
          lastUpdated: 0,
        });
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
