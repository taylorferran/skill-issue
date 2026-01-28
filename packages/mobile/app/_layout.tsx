import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import "react-native-reanimated";
import { useEffect, useMemo } from "react";
import { UserProvider } from "@/contexts/UserContext";
import { QuizProvider } from "@/contexts/QuizContext";
import {
  configureNotificationHandler,
  setupNotificationListeners,
} from "@/utils/notifications";
import { ApiProvider } from "@/api/ApiProvider";

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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  // Memoize service URLs to prevent unnecessary re-renders in ApiProvider
  // Uses environment variable with fallback for local development
  const serviceUrls = useMemo(() => ({
    backend: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000/api'
  }), []);

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || ''}
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
        <UserProvider>
          <ApiProvider serviceUrls={serviceUrls}>
            <QuizProvider>
              <RootLayoutContent />
              <StatusBar style="auto" />
            </QuizProvider>
          </ApiProvider>
        </UserProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
