import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import "react-native-reanimated";
import { useEffect } from "react";
import { UserProvider } from "@/contexts/UserContext";
import { QuizProvider } from "@/contexts/QuizContext";
import { NavigationTitleProvider } from "@/contexts/NavigationTitleContext";
import {
  configureNotificationHandler,
  setupNotificationListeners,
} from "@/utils/notifications";
import { NotificationBadgeOverlay } from "@/components/notification-badge-overlay/NotificationBadgeOverlay";
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister } from '@/api/query-client';

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
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  
  // Handle authentication-based routing
  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "sign-in";

    if (!isSignedIn && !inAuthGroup) {
      // Redirect to sign-in if not authenticated
      router.replace("/sign-in");
    } else if (isSignedIn && inAuthGroup) {
      // Redirect away from sign-in if already authenticated
      router.replace("/(tabs)/(skills)");
    }
  }, [isSignedIn, isLoaded, segments, router]);
  
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
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="dark" />
      <NotificationBadgeOverlay />
    </NavigationTitleProvider>
  );
}

export default function RootLayout() {
  // Log backend URL configuration
  console.log('[RootLayout] 🌐 Backend URL configured:', backendUrlFromConfig);

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
        <PersistQueryClientProvider 
          client={queryClient} 
          persistOptions={{ persister: asyncStoragePersister }}
        >
          <UserProvider>
            <QuizProvider>
              <RootLayoutContent />
            </QuizProvider>
          </UserProvider>
        </PersistQueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
