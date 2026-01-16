import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useOAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

// Important: Warm up the browser for better UX
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startGithubOAuth } = useOAuth({ strategy: 'oauth_github' });

  const onPressGoogle = async () => {
    try {
      const { createdSessionId, setActive } = await startGoogleOAuth();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('OAuth error', err);
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to sign in with Google');
    }
  };

  const onPressGithub = async () => {
    try {
      const { createdSessionId, setActive } = await startGithubOAuth();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('OAuth error', err);
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to sign in with GitHub');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      
      <TouchableOpacity style={styles.googleButton} onPress={onPressGoogle}>
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.githubButton} onPress={onPressGithub}>
        <Text style={styles.buttonText}>Continue with GitHub</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  githubButton: {
    backgroundColor: '#24292e',
    padding: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
