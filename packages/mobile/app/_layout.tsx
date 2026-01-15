import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import 'react-native-reanimated';
import { use } from 'react';
import { AuthContext, AuthProvider } from '@/contexts/AuthContext';

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

export default function RootLayout() {
  const {isAuthenticated} = use(AuthContext)
  return (
    <ClerkProvider
      publishableKey={"pk_test_YW1hemVkLW1hcm1vc2V0LTcwLmNsZXJrLmFjY291bnRzLmRldiQ"}
      tokenCache={tokenCache}
    >

      <ClerkLoaded>
          <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen  name="sign-in" />
          </Stack.Protected>
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style="auto" />
      </ClerkLoaded>
    </ClerkProvider>
  );
}
