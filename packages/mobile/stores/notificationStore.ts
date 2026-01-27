import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Notification Store
 * Manages push notification state and Expo Push Token with persistent storage
 */

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface NotificationState {
  // Expo Push Token for sending push notifications
  expoPushToken: string | null;
  
  // Current permission status
  permissionStatus: PermissionStatus;
  
  // Whether we've already prompted the user for permission
  hasPromptedUser: boolean;
  
  // Actions
  setExpoPushToken: (token: string) => void;
  setPermissionStatus: (status: PermissionStatus) => void;
  setHasPromptedUser: (prompted: boolean) => void;
  
  // Get the push token (null if not available)
  getPushToken: () => string | null;
  
  // Check if notifications are enabled
  isNotificationsEnabled: () => boolean;
  
  // Clear all notification data (on sign out)
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      expoPushToken: null,
      permissionStatus: 'undetermined',
      hasPromptedUser: false,
      
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
      
      getPushToken: () => {
        const { expoPushToken } = get();
        return expoPushToken;
      },
      
      isNotificationsEnabled: () => {
        const { permissionStatus } = get();
        return permissionStatus === 'granted';
      },
      
      reset: () => {
        set({
          expoPushToken: null,
          permissionStatus: 'undetermined',
          hasPromptedUser: false,
        });
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
