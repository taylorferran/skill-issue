import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

// Ensure OAuth session completion is handled
WebBrowser.maybeCompleteAuthSession();

/**
 * OAuth callback route for handling redirects from Google/GitHub OAuth.
 * This route exists to be a valid Expo Router target for OAuth redirects.
 * The actual session completion is handled by WebBrowser.maybeCompleteAuthSession().
 */
export default function OAuthNativeCallback() {
  const router = useRouter();

  useEffect(() => {
    // If we land here directly (shouldn't happen normally),
    // redirect to sign-in after a brief moment
    const timeout = setTimeout(() => {
      router.replace('/sign-in');
    }, 1000);

    return () => clearTimeout(timeout);
  }, [router]);

  // Show a loading indicator while OAuth completes
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
