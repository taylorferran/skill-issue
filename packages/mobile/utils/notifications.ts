import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Alert, Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import { notificationEventEmitter } from './notificationEvents';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Challenge } from '@/types/Quiz';

/**
 * Configure how notifications are handled when app is in foreground
 */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Get projectId from Expo config with fallback
 */
function getProjectId(): string {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    ""
  );
}

/**
 * Register for push notifications and get Expo Push Token
 * @returns Expo Push Token string or undefined if failed
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  // Check if running on physical device
  if (!Device.isDevice) {
    Alert.alert(
      'Physical Device Required',
      'Push notifications only work on physical devices, not simulators/emulators.'
    );
    return undefined;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Handle denied permission
    if (finalStatus !== 'granted') {
      handlePermissionDenied();
      return undefined;
    }

    // Get push token
    const projectId = getProjectId();
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData?.data;

    if (!token) {
      console.error('[Notifications] Failed to retrieve push token');
      return undefined;
    }

    // Android-specific channel configuration
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('[Notifications] Error in registerForPushNotificationsAsync:', error);
    return undefined;
  }
}

/**
 * Handle permission denied - show alert with option to open settings
 */
function handlePermissionDenied() {
  Alert.alert(
    'Notifications Disabled',
    'To receive important updates and reminders, please enable notifications in your device settings.',
    [
      {
        text: 'Open Settings',
        onPress: openDeviceSettings,
      },
      {
        text: 'Not Now',
        style: 'cancel',
      },
    ]
  );
}

/**
 * Open device settings to allow user to manually enable notifications
 */
export function openDeviceSettings() {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
}

/**
 * Request notification permissions with error handling
 * This is the main function to call from your app after sign-in
 */
export async function requestNotificationPermissions(): Promise<{
  success: boolean;
  token?: string;
}> {
  try {
    const token = await registerForPushNotificationsAsync();
    
    if (token) {
      return { success: true, token };
    }
    
    return { success: false };
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return { success: false };
  }
}

/**
 * Set up notification listeners for foreground and background notifications
 * @returns Cleanup function to remove listeners
 */
export function setupNotificationListeners() {
  // Listener for notifications received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(
    handleNotificationReceived
  );

  // Listener for when user taps on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse
  );

  // Return cleanup function
  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}

/**
 * Handle notification received while app is in foreground
 */
function handleNotificationReceived(notification: Notifications.Notification) {
  console.log('Notification received in foreground:', notification);

  // Extract notification data
  const data = notification.request.content.data;

  // If it's a challenge notification, add it to the store immediately
  if (data?.type === 'challenge') {
    const { challengeId, skillId, skillName, question, options, difficulty, createdAt } = data;

    if (challengeId && question && options) {
      const challenge: Challenge = {
        challengeId: String(challengeId),
        skillId: skillId ? String(skillId) : '',
        skillName: skillName ? String(skillName) : '',
        question: String(question),
        options: Array.isArray(options) ? options.map((opt: unknown) => String(opt)) : [],
        difficulty: typeof difficulty === 'number' ? difficulty : 5,
        createdAt: createdAt ? String(createdAt) : new Date().toISOString(),
      };

      // Add to store immediately for instant badge update
      const { addPendingChallenge } = useNotificationStore.getState();
      addPendingChallenge(challenge);
      console.log('[Notifications] ➕ Challenge added to store via notification:', challengeId);
    }
  }

  // Emit notification event to refresh notifications and assessment data
  notificationEventEmitter.emit();
}

/**
 * Handle notification response when user taps on notification
 */
function handleNotificationResponse(response: Notifications.NotificationResponse) {
  console.log('Notification tapped:', response);
  
  // Extract notification data
  const data = response.notification.request.content.data;
  
  // Handle challenge notification - navigate to quiz
  if (data?.type === 'challenge') {
    const { challengeId, skillId, skillName, question, options, correctAnswerIndex, explanation } = data;
    
    if (challengeId && question && options) {
      // Format the data as MCQQuestion for the quiz
      const mcqQuestion = {
        id: parseInt(String(challengeId).slice(0, 8), 16) || 0,
        question: String(question),
        answers: Array.isArray(options) ? options.map((text: string, index: number) => ({
          id: index,
          text: String(text),
        })) : [],
        correctAnswerId: typeof correctAnswerIndex === 'number' ? correctAnswerIndex : 0,
        explanation: String(explanation || ''),
      };
      
      console.log('[Notifications] Routing to quiz for challenge:', challengeId);
      
      // Navigate to quiz screen with all required params
      const params: Record<string, string> = {
        skill: String(skillName || ''),
        challengeId: String(challengeId),
        data: JSON.stringify(mcqQuestion),
      };
      
      // Include skillId if provided (needed for navigation back to assessment)
      if (skillId) {
        params.skillId = String(skillId);
      }
      
      router.push({
        pathname: '/(tabs)/(skills)/assessment/quiz',
        params,
      });
    } else {
      console.warn('[Notifications] Challenge notification missing required data:', data);
    }
  }
  
  console.log('Notification data:', data);
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test Notification',
      body: 'This is a test notification from Skill Issue!',
      data: { screen: '/(tabs)/(skills)' },
    },
    trigger: { seconds: 2 } as Notifications.TimeIntervalTriggerInput,
  });
}
