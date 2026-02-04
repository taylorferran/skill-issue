import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import "react-native-reanimated";
import { useEffect, useMemo } from "react";
import { UserProvider } from "@/contexts/UserContext";
import { QuizProvider } from "@/contexts/QuizContext";
import { NavigationTitleProvider } from "@/contexts/NavigationTitleContext";
import {
  configureNotificationHandler,
  setupNotificationListeners,
} from "@/utils/notifications";
import { ApiProvider } from "@/api/ApiProvider";
import { NotificationBadgeOverlay } from "@/components/notification-badge-overlay/NotificationBadgeOverlay";

// Get config values from expo-constants (baked in at build time via app.config.ts)
const clerkPublishableKey = Constants.expoConfig?.extra?.clerkPublishableKey || '';
const backendUrlFromConfig = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000/api';

// Log missing config on startup for debugging
if (!clerkPublishableKey) {
  console.error('[RootLayout] ❌ Missing Clerk publishable key! Check EAS environment variables.');
}
if (!backendUrlFromConfig || backendUrlFromConfig === 'http://localhost:3000/api') {
  console.warn('[RootLayout] ⚠️ Backend URL not configured or using localhost fallback.');
}

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

function RootLayoutContent() {
  const { isSignedIn } = useAuth();
  
  // Notification permissions will be requested after successful sign-in
  // See sign-in.tsx for implementation

  // Initialize notification handler and listeners on app mount
  useEffect(() => {
    // Configure how notifications are displayed when app is in foreground
    configureNotificationHandler();

    // Set up notification listeners
    const cleanup = setupNotificationListeners();

    // Cleanup listeners on unmount
    return cleanup;
  }, []);

  return (
    <NavigationTitleProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </NavigationTitleProvider>
  );
}

export default function RootLayout() {
  // Memoize service URLs to prevent unnecessary re-renders in ApiProvider
  // Uses environment variable with fallback for local development
  const serviceUrls = useMemo(() => {
    const backendUrl = backendUrlFromConfig;
    console.log('[RootLayout] 🌐 Backend URL configured:', backendUrl);
    return { backend: backendUrl };
  }, []);

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
        <ApiProvider serviceUrls={serviceUrls}>
          <UserProvider>
            <QuizProvider>
              <RootLayoutContent />
              <StatusBar style="auto" />
              <NotificationBadgeOverlay />
            </QuizProvider>
          </UserProvider>
        </ApiProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
