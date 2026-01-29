import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Localization from "expo-localization";
import { Theme } from "@/theme/Theme";
import { MonogramBackground } from "@/components/monogram-background/MonogramBackground";
import { useNotificationStore } from "@/stores/notificationStore";
import { useUser } from "@/contexts/UserContext";
import { useCreateUser } from "@/api-routes/createUser";
import { useUpdateUser } from "@/api-routes/updateUser";
import { useGetUserSkills } from "@/api-routes/getUserSkills";
import { useGetSkills } from "@/api-routes/getSkills";
import { useSkillsStore } from "@/stores/skillsStore";
import { registerForPushNotificationsAsync } from "@/utils/notifications";
import type { CreateUserRequest } from "@learning-platform/shared";

// Important: Warm up the browser for better UX
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: "oauth_google",
  });
  const { startOAuthFlow: startGithubOAuth } = useOAuth({
    strategy: "oauth_github",
  });
  const { setExpoPushToken, setPermissionStatus, getPushToken } = useNotificationStore();
  const { setUser, markUserAsCreated, isUserCreated } = useUser();
  const { execute: createUserApi } = useCreateUser();
  const { execute: updateUserApi } = useUpdateUser();
  const { execute: fetchUserSkills } = useGetUserSkills();
  const { execute: fetchAvailableSkills } = useGetSkills();
  const { setUserSkills, setAvailableSkills } = useSkillsStore();
  
  // Loading state for the entire sign-in process
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("Setting up your account...");

  /**
   * Create backend user with push token (if granted)
   * Called after successful OAuth sign-in
   */
  const createBackendUser = async () => {
    // Check if user already exists (e.g., reinstall scenario)
    if (isUserCreated()) {
      console.log("[SignIn] ✅ Backend user already exists, skipping creation");
      return;
    }

    console.log("[SignIn] 🆕 Creating backend user...");

    // Get push token from store (if notification was granted earlier)
    const pushToken = getPushToken();

    // Prepare user data with push token if available
    const userData: CreateUserRequest = {
      timezone: Localization.getCalendars()[0]?.timeZone || "UTC",
      maxChallengesPerDay: 5,
      ...(pushToken && { deviceId: pushToken }),
    };

    console.log("[SignIn] 📤 Sending user creation request:", {
      timezone: userData.timezone,
      maxChallengesPerDay: userData.maxChallengesPerDay,
      hasDeviceId: !!userData.deviceId,
    });

    // Create user on backend
    const response = await createUserApi(userData);
    console.log("[SignIn] ✅ Backend user created with ID:", response.id);

    // Save to UserContext
    await setUser(response);
    await markUserAsCreated();

    console.log("[SignIn] 💾 User data saved to local context");
    
    return response;
  };

  // Note: Notification permissions are now auto-requested via useAutoRequestNotifications hook
  // in _layout.tsx. No manual button needed here.

  const onPressGoogle = async () => {
    try {
      setIsSigningIn(true);
      setLoadingMessage("Signing in with Google...");
      
      const { createdSessionId, setActive } = await startGoogleOAuth();

      if (createdSessionId && setActive) {
        // Activate the Clerk session
        await setActive({ session: createdSessionId });
        console.log("[SignIn] ✅ Clerk session activated");
        
        // Small delay to ensure token propagates through React context
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Create backend user with push token
        setLoadingMessage("Creating your account...");
        const user = await createBackendUser();
        
        if (user?.id) {
          // Request notification permissions immediately after sign-in
          setLoadingMessage("Setting up notifications...");
          try {
            console.log("[SignIn] 🔔 Requesting notification permissions...");
            const token = await registerForPushNotificationsAsync();
            
            if (token) {
              console.log("[SignIn] ✅ Notification token received, updating user...");
              
              // Update backend with device ID
              await updateUserApi({
                userId: user.id,
                deviceId: token,
              });
              
              // Update local notification store
              setExpoPushToken(token);
              setPermissionStatus('granted');
              
              console.log("[SignIn] ✅ Notification token saved to backend and store");
            } else {
              console.log("[SignIn] ℹ️ Notification permission denied or unavailable");
              setPermissionStatus('denied');
            }
          } catch (error) {
            // Non-blocking - user can enable later in settings
            console.warn("[SignIn] ⚠️ Failed to request notifications:", error);
          }
          
          // Pre-fetch skills data before navigation
          setLoadingMessage("Loading your skills...");
          try {
            const [userSkills, availableSkills] = await Promise.all([
              fetchUserSkills({ userId: user.id }),
              fetchAvailableSkills(),
            ]);
            
            // Cache skills data in store
            setUserSkills(userSkills);
            setAvailableSkills(availableSkills);
            
            console.log("[SignIn] ✅ Skills data pre-fetched and cached");
          } catch (error) {
            // Non-blocking - skills screen will fetch if needed
            console.warn("[SignIn] ⚠️ Failed to pre-fetch skills:", error);
          }
        }
        
        // Navigate to skills screen
        router.replace("/(tabs)/(skills)");
      }
    } catch (err: any) {
      console.error("OAuth error", err);
      Alert.alert(
        "Error",
        err.errors?.[0]?.message || "Failed to sign in with Google",
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const onPressGithub = async () => {
    try {
      setIsSigningIn(true);
      setLoadingMessage("Signing in with GitHub...");
      
      const { createdSessionId, setActive } = await startGithubOAuth();

      if (createdSessionId && setActive) {
        // Activate the Clerk session
        await setActive({ session: createdSessionId });
        console.log("[SignIn] ✅ Clerk session activated");
        
        // Small delay to ensure token propagates through React context
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Create backend user with push token
        setLoadingMessage("Creating your account...");
        const user = await createBackendUser();
        
        if (user?.id) {
          // Request notification permissions immediately after sign-in
          setLoadingMessage("Setting up notifications...");
          try {
            console.log("[SignIn] 🔔 Requesting notification permissions...");
            const token = await registerForPushNotificationsAsync();
            
            if (token) {
              console.log("[SignIn] ✅ Notification token received, updating user...");
              
              // Update backend with device ID
              await updateUserApi({
                userId: user.id,
                deviceId: token,
              });
              
              // Update local notification store
              setExpoPushToken(token);
              setPermissionStatus('granted');
              
              console.log("[SignIn] ✅ Notification token saved to backend and store");
            } else {
              console.log("[SignIn] ℹ️ Notification permission denied or unavailable");
              setPermissionStatus('denied');
            }
          } catch (error) {
            // Non-blocking - user can enable later in settings
            console.warn("[SignIn] ⚠️ Failed to request notifications:", error);
          }
          
          // Pre-fetch skills data before navigation
          setLoadingMessage("Loading your skills...");
          try {
            const [userSkills, availableSkills] = await Promise.all([
              fetchUserSkills({ userId: user.id }),
              fetchAvailableSkills(),
            ]);
            
            // Cache skills data in store
            setUserSkills(userSkills);
            setAvailableSkills(availableSkills);
            
            console.log("[SignIn] ✅ Skills data pre-fetched and cached");
          } catch (error) {
            // Non-blocking - skills screen will fetch if needed
            console.warn("[SignIn] ⚠️ Failed to pre-fetch skills:", error);
          }
        }
        
        // Navigate to skills screen
        router.replace("/(tabs)/(skills)");
      }
    } catch (err: any) {
      console.error("OAuth error", err);
      Alert.alert(
        "Error",
        err.errors?.[0]?.message || "Failed to sign in with GitHub",
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Monogram Background */}
      <MonogramBackground text="SI" opacity={0.03} />

      {/* Main Content Container */}
      <View style={styles.mainContainer}>
        {/* Header Brand */}
        <View style={styles.header}>
          <View style={styles.brandIconContainer}>
            <Ionicons
              name="diamond"
              size={28}
              color={Theme.colors.primary.main}
            />
          </View>
          <Text style={styles.brandTitle}>SKILL ISSUE</Text>
        </View>

        {/* Center Content */}
        <View style={styles.centerContent}>
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Refine your craft.</Text>
            <Text style={styles.heroSubtitle}>
              The professional standard for skill assessment.
            </Text>
          </View>

          {/* Google OAuth Button */}
          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={onPressGoogle}
            disabled={isSigningIn}
          >
            <Ionicons
              name="logo-google"
              size={20}
              color={Theme.colors.text.inverse}
            />
            <Text style={styles.buttonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* SSO Option */}
          <TouchableOpacity 
            onPress={onPressGithub}
            disabled={isSigningIn}
          >
            <Text style={styles.ssoText}>Use single sign-on (SSO)</Text>
          </TouchableOpacity>
        </View>

        {/* Loading Overlay */}
        {isSigningIn && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator 
              size="large" 
              color={Theme.colors.primary.main} 
            />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
         <Text style={styles.footerText}>
            By continuing, you agree to our{"\n"}
            <Text style={styles.footerLink}>Terms of Service</Text> &{" "}
            <Text style={styles.footerLink}>Privacy Policy</Text>.
          </Text>
          {/* Home Indicator */}
          <View style={styles.homeIndicator} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  mainContainer: {
    flex: 1,
    maxWidth: 430,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: Theme.spacing["3xl"],
    paddingVertical: Theme.spacing["4xl"],
    justifyContent: "space-between",
  },

  // Header Brand
  header: {
    alignItems: "center",
    marginTop: Theme.spacing.lg,
  },
  brandIconContainer: {
    marginBottom: Theme.spacing.sm,
  },
  brandTitle: {
    color: Theme.colors.text.primary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 3.2,
    textTransform: "uppercase",
    textAlign: "center",
  },

  // Center Content
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Theme.spacing["4xl"],
  },
  heroSection: {
    alignItems: "center",
    marginBottom: Theme.spacing["4xl"] + Theme.spacing.lg,
  },
  heroTitle: {
    color: Theme.colors.text.primary,
    fontSize: 42,
    fontWeight: "700",
    lineHeight: 46,
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: Theme.spacing.lg,
  },
  heroSubtitle: {
    color: Theme.colors.text.tertiary,
    fontSize: 18,
    fontWeight: "400",
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 280,
  },

  // Google Button
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 320,
    height: 56,
    backgroundColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.lg,
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing["2xl"],
    ...Theme.shadows.subtle,
  },
  buttonText: {
    color: Theme.colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.16,
  },

  // Notification Prompt
  notificationPrompt: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.card.border,
    marginBottom: Theme.spacing["2xl"],
    gap: Theme.spacing.md,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    color: Theme.colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  notificationSubtitle: {
    color: Theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
  },

  // SSO Option
  ssoText: {
    color: Theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },

  // Loading Overlay
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    color: Theme.colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
    marginTop: Theme.spacing.lg,
    textAlign: "center",
  },

  // Footer
  footer: {
    alignItems: "center",
    gap: Theme.spacing["3xl"],
  },
  footerText: {
    color: Theme.colors.text.secondary,
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: Theme.spacing.lg,
  },
  footerLink: {
    textDecorationLine: "underline",
  },
  homeIndicator: {
    width: 128,
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: Theme.borderRadius.full,
  },
});
