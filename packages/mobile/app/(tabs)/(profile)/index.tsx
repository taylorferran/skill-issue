import { Theme } from "@/theme/Theme";
import { useUser } from "@/contexts/UserContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SettingItem } from "@/components/setting-item/SettingItem";
import { SettingToggle } from "@/components/setting-toggle/SettingToggle";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  registerForPushNotificationsAsync,
  openDeviceSettings,
  areNotificationsEnabled,
} from "@/utils/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { useCreateUser } from "@/api-routes/createUser";
import { useUpdateUser } from "@/api-routes/updateUser";
import type { CreateUserRequest } from "@learning-platform/shared";
import { styles } from "./index.styles";
import { usePush } from "@/api-routes/usePush";

export default function ProfileScreen() {
  const { auth, userId, setUser, updateUser, isUserCreated, markUserAsCreated } =
    useUser();
  const { execute: createUserApi } = useCreateUser();
  const { execute: updateUserApi } = useUpdateUser();

  const { getPushToken } = useNotificationStore.getState();
  // Notification state management
  const { permissionStatus, setPermissionStatus, setExpoPushToken } =
    useNotificationStore();
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);
  const notificationsEnabled = permissionStatus === "granted";
  const { execute } = usePush();

  // Check current notification permission status when screen comes into focus
  // This ensures the toggle updates when user returns from system settings
  useFocusEffect(
    useCallback(() => {
      const checkPermissions = async () => {
        const enabled = await areNotificationsEnabled();
        setPermissionStatus(enabled ? "granted" : "denied");
      };
      checkPermissions();
    }, [setPermissionStatus])
  );

  // Handle notification toggle
  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      // User wants to ENABLE notifications
      if (permissionStatus === "denied") {
        // Permission was previously denied - guide to settings
        Alert.alert(
          "Notifications Disabled",
          "To enable notifications, please allow them in your device settings.",
          [
            {
              text: "Open Settings",
              onPress: openDeviceSettings,
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ],
        );
        return;
      }

      // Request permission
      setIsTogglingNotifications(true);
      try {
        console.log("[Profile] 🚀 Requesting push notification token...");
        const token = await registerForPushNotificationsAsync();

        console.log("[Profile] 📋 Token result:", token ? "RECEIVED" : "NULL");

        if (token && token.trim() !== "") {
          // Save token to notification store
          console.log("[Profile] 💾 Saving token to notification store...");
          setExpoPushToken(token);
          setPermissionStatus("granted");
          console.log("[Profile] ✅ Push token saved to notification store");

          // Check if backend user exists
          if (!isUserCreated() || !userId) {
            console.log(
              "[Profile] ⚠️ Backend user not found - creating as fallback...",
            );

            try {
              // Fallback: Create user if doesn't exist (edge case - should not happen normally)
              const requestData: CreateUserRequest = {
                timezone: Localization.getCalendars()[0]?.timeZone || "UTC",
                deviceId: token,
                maxChallengesPerDay: 5,
              };

              console.log("[Profile] 🚀 Creating user with data:", {
                timezone: requestData.timezone,
                deviceId: "[Push Token Set]",
                maxChallengesPerDay: requestData.maxChallengesPerDay,
              });

              // Create on backend
              const response = await createUserApi(requestData);
              console.log("[Profile] ✅ User created on backend with ID:", response.id);

              // Store the RESPONSE (not the request)
              await setUser(response);
              console.log("[Profile] 💾 User response saved locally");

              // Mark as created
              await markUserAsCreated();
              console.log("[Profile] 🎉 User setup complete");

              Alert.alert("Success", "Notifications enabled successfully!");
            } catch (error) {
              console.error("[Profile] ❌ Error during user creation:", error);

              // Graceful degradation - still allow app usage
              Alert.alert(
                "Setup Notice",
                "Notifications are enabled, but we encountered an issue setting up your account. You can continue using the app.",
                [{ text: "OK", style: "default" }],
              );
            }
          } else {
            console.log(
              "[Profile] 🔄 User exists - updating push token on backend...",
            );

            // PRIMARY PATH: Update existing user with push token
            try {
              console.log("[Profile] 📤 Calling updateUser API with userId:", userId);
              
              // Update on backend via PUT /users/:userId
              await updateUserApi({
                userId,
                deviceId: token,
              });
              
              console.log("[Profile] ✅ Push token updated on backend");

              // Also update local UserContext state
              await updateUser({ deviceId: token });
              console.log("[Profile] 💾 Push token updated in local context");

              Alert.alert("Success", "Notifications enabled successfully!");
            } catch (error) {
              console.error("[Profile] ❌ Failed to update push token:", error);
              Alert.alert(
                "Update Failed",
                "Could not update notification settings. Please try again.",
                [{ text: "OK" }]
              );
            }
          }
        } else {
          console.error("[Profile] ❌ Token is null/empty");
          setPermissionStatus("denied");

          Alert.alert(
            "Token Error",
            "Unable to retrieve push notification token. This may be due to:\n\n• Network connectivity issues\n• Expo server problems\n• Device configuration\n\nPlease check your internet connection and try again.",
            [
              {
                text: "Try Again",
                onPress: () => handleNotificationToggle(true),
              },
              { text: "Cancel", style: "cancel" },
            ],
          );
        }
      } catch (error) {
        console.error("[Profile] ❌ Error enabling notifications:", error);
        Alert.alert(
          "Error",
          "Failed to enable notifications. Please try again.",
        );
      } finally {
        setIsTogglingNotifications(false);
      }
    } else {
      // User wants to DISABLE notifications
      Alert.alert(
        "Disable Notifications?",
        "Are you sure you want to disable notifications?",
        [
          {
            text: "Disable",
            style: "destructive",
            onPress: () => {
              Alert.alert(
                "Action Required",
                "To fully disable notifications, please turn them off in your device settings.",
                [
                  {
                    text: "Open Settings",
                    onPress: () => {
                      setPermissionStatus("denied");
                      openDeviceSettings();
                    },
                  },
                  {
                    text: "Not Now",
                    onPress: () => {
                      setPermissionStatus("denied");
                    },
                    style: "cancel",
                  },
                ],
              );
            },
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ],
      );
    }
  };

  const handleAccountDetails = () => {
    console.log("Navigate to account details");
    const token = getPushToken();
    if (token !== null) {
      execute({ pushToken: token });
    }
    // Example: router.push('/account-details');
  };

  const handlePrivacy = () => {
    console.log("Navigate to privacy");
    // Example: router.push('/privacy');
  };

  const handleHelp = () => {
    console.log("Navigate to help");
    // Example: Linking.openURL('https://yourapp.com/help');
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace("/sign-in");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  // Debug: Retry token fetch
  const handleDebugRetryToken = async () => {
    Alert.alert(
      "Debug: Retry Token",
      "This will attempt to fetch your push notification token again.",
      [
        {
          text: "Retry",
          onPress: async () => {
            setIsTogglingNotifications(true);
            try {
              const token = await registerForPushNotificationsAsync();

              if (token && token.trim() !== "") {
                setExpoPushToken(token);
                setPermissionStatus("granted");
                Alert.alert(
                  "Success!",
                  `Token retrieved:\n\n${token.substring(0, 50)}...`,
                );
              } else {
                Alert.alert("Failed", "Token is still null.");
              }
            } catch (error) {
              console.error("[DEBUG] Error during retry:", error);
              Alert.alert(
                "Error",
                error instanceof Error ? error.message : "Unknown error",
              );
            } finally {
              setIsTogglingNotifications(false);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri:
                auth.clerkUser?.imageUrl || "https://via.placeholder.com/128",
            }}
            style={styles.avatar}
          />
          <View style={styles.verifiedBadge}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={Theme.colors.background.secondary}
            />
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {auth.clerkUser?.fullName || "Undefined"}
          </Text>
          <View style={styles.badgesContainer}>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO MEMBER</Text>
            </View>
            <Text style={styles.levelText}>Level 12 Developer</Text>
          </View>
        </View>
      </View>

      {/* AI Stats Widget */}
      <View style={styles.aiStatsCard}>
        <View style={styles.aiStatsLeft}>
          <View style={styles.aiIconContainer}>
            <Ionicons
              name="bulb"
              size={Theme.iconSize.md}
              color={Theme.colors.primary.main}
            />
          </View>
          <View>
            <Text style={styles.aiStatsLabel}>AI VERIFIED SKILL</Text>
            <Text style={styles.aiStatsTitle}>Python Architecture</Text>
          </View>
        </View>
        <View style={styles.aiStatsRight}>
          <Text style={styles.aiStatsPercentage}>Top 2%</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: "85%" }]} />
          </View>
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.settingsGroup}>
          <SettingToggle
            icon="notifications-outline"
            title="Notification Settings"
            subtitle="Manage alerts and news"
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            loading={isTogglingNotifications}
            testID="setting-notifications"
          />
          <SettingItem
            icon="person-outline"
            title="Account Details"
            subtitle="Personal info and password"
            onPress={handleAccountDetails}
            testID="setting-account"
          />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy & Visibility"
            subtitle="Control who sees your badges"
            onPress={handlePrivacy}
            testID="setting-privacy"
          />
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <View style={styles.settingsGroup}>
          <SettingItem
            icon="help-circle-outline"
            title="Help & Documentation"
            onPress={handleHelp}
            variant="support"
            isExternalLink
            testID="setting-help"
          />
        </View>
      </View>

      {/* Developer Tools (only visible in __DEV__ mode) */}
      {__DEV__ && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 DEVELOPER TOOLS</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="refresh-outline"
              title="Reset User Creation Flag"
              subtitle="Clear user created state for testing"
              onPress={async () => {
                try {
                  await AsyncStorage.removeItem("@skill_issue_user_created");
                  Alert.alert(
                    "Reset Complete",
                    "User creation flag cleared.\n\nRestart the app to trigger user creation again.",
                    [{ text: "OK" }],
                  );
                } catch (error) {
                  Alert.alert("Error", "Failed to reset: " + error);
                }
              }}
              testID="dev-reset-user"
            />
            <SettingItem
              icon="information-circle-outline"
              title="Check Token State"
              subtitle="View current notification token status"
              onPress={() => {
                const { expoPushToken, permissionStatus } =
                  useNotificationStore.getState();
                Alert.alert(
                  "Token Debug Info",
                  `Permission Status: ${permissionStatus}\n\nExpo Push Token:\n${expoPushToken || "NULL"}\n\nToken Length: ${expoPushToken?.length || 0} chars`,
                  [{ text: "OK" }],
                );
              }}
              testID="dev-check-token"
            />
            <SettingItem
              icon="trash-outline"
              title="Clear All App Data"
              subtitle="Reset entire app state"
              onPress={async () => {
                Alert.alert(
                  "Clear All Data?",
                  "This will reset the entire app to fresh install state. You will need to sign in again.",
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Clear All",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await AsyncStorage.clear();
                          Alert.alert(
                            "Success",
                            "All app data cleared. Please restart the app.",
                          );
                        } catch (error) {
                          Alert.alert(
                            "Error",
                            "Failed to clear data: " + error,
                          );
                        }
                      },
                    },
                  ],
                );
              }}
              testID="dev-clear-all"
            />
          </View>
        </View>
      )}

      {/* Debug Section */}
      {__DEV__ && (
        <>
          <Text style={styles.sectionTitle}>🐛 DEBUG TOOLS</Text>
          <View style={styles.settingsGroup}>
            <SettingItem
              icon="refresh"
              title="Retry Token Fetch"
              subtitle="Manually retry push notification token"
              onPress={handleDebugRetryToken}
              variant="support"
            />
          </View>
        </>
      )}

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButtonContainer}
        onPress={handleLogout}
        activeOpacity={0.9}
        testID="logout-button"
      >
        <LinearGradient
          colors={["#eb8b47", "#ffae70"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoutButton}
        >
          <Ionicons
            name="log-out-outline"
            size={Theme.iconSize.md}
            color={Theme.colors.text.inverse}
          />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>Skill Issue v2.4.0-stable</Text>
        <View style={styles.footerIcons}>
          <Ionicons
            name="language-outline"
            size={Theme.iconSize.sm}
            color={Theme.colors.text.secondary}
          />
          <Ionicons
            name="share-outline"
            size={Theme.iconSize.sm}
            color={Theme.colors.text.secondary}
          />
          <Ionicons
            name="terminal-outline"
            size={Theme.iconSize.sm}
            color={Theme.colors.text.secondary}
          />
        </View>
      </View>

      {/* Bottom padding for safe area */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}
