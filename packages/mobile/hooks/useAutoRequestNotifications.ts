import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useNotificationStore } from '@/stores/notificationStore';

/**
 * Auto-request push notification permissions on app launch
 * Runs once per app session, respects user's previous permission choices
 */
export function useAutoRequestNotifications() {
  const [isRequesting, setIsRequesting] = useState(false);
  const { 
    setExpoPushToken, 
    setPermissionStatus, 
    hasPromptedUser,
    setHasPromptedUser 
  } = useNotificationStore();

  useEffect(() => {
    const requestPermissions = async () => {
      // Skip if not a physical device (simulators/emulators don't support push)
      if (!Device.isDevice) {
        console.log('[Notifications] Skipping - not a physical device');
        return;
      }

      // Skip if we've already prompted in this session
      if (hasPromptedUser) {
        console.log('[Notifications] Already prompted user this session');
        return;
      }

      setIsRequesting(true);

      try {
        // Check existing permission status
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        
        console.log('[Notifications] Current permission status:', existingStatus);

        // If permission is already denied, don't prompt again (respect user's choice)
        if (existingStatus === 'denied') {
          console.log('[Notifications] Permission previously denied - skipping prompt');
          setPermissionStatus('denied');
          setHasPromptedUser(true);
          return;
        }

        // If permission is already granted, just get the token
        if (existingStatus === 'granted') {
          console.log('[Notifications] Permission already granted - fetching token');
          await fetchAndSaveToken();
          setPermissionStatus('granted');
          setHasPromptedUser(true);
          return;
        }

        // Permission is undetermined - request it
        console.log('[Notifications] 🔔 Requesting push notification permission...');
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        
        setPermissionStatus(newStatus === 'granted' ? 'granted' : 'denied');
        setHasPromptedUser(true);

        if (newStatus === 'granted') {
          console.log('[Notifications] ✅ Permission granted!');
          await fetchAndSaveToken();
        } else {
          console.log('[Notifications] ❌ Permission denied');
        }

      } catch (error) {
        console.error('[Notifications] Error requesting permissions:', error);
        setPermissionStatus('denied');
      } finally {
        setIsRequesting(false);
      }
    };

    // Helper to fetch and save push token
    const fetchAndSaveToken = async () => {
      try {
        const projectId = 
          Constants.expoConfig?.extra?.eas?.projectId || 
          '';

        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

        if (tokenData?.data) {
          setExpoPushToken(tokenData.data);
          console.log('[Notifications] 💾 Token saved:', tokenData.data);

          // Configure Android notification channel
          if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
              name: 'default',
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#FF231F7C',
            });
          }
        }
      } catch (error) {
        console.error('[Notifications] Error fetching token:', error);
      }
    };

    requestPermissions();
  }, []); // Run once on mount

  return { isRequesting };
}
