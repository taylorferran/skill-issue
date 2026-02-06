import { Theme } from "@/theme/Theme";
import { useUser } from "@/contexts/UserContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SettingToggle } from "@/components/setting-toggle/SettingToggle";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  registerForPushNotificationsAsync,
  openDeviceSettings,
  areNotificationsEnabled,
} from "@/utils/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { useMutation } from "@tanstack/react-query";
import { createUser, updateUser, triggerSchedulerTick } from "@/api/routes";
import type { CreateUserRequest } from "@learning-platform/shared";
import { SelectDropdown, type SelectOption } from "@/components/select-dropdown/SelectDropdown";
import { styles } from "./index.styles";
import Slider from "@react-native-community/slider";

export default function ProfileScreen() {
  const { auth, userId, setUser, updateLocalUserData, isUserCreated, markUserAsCreated } =
    useUser();
  
  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => createUser(data),
  });
  
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, ...data }: { userId: string } & Partial<CreateUserRequest>) =>
      updateUser(userId, data),
  });
  
  const triggerSchedulerMutation = useMutation({
    mutationFn: () => triggerSchedulerTick(),
  });

  // Notification state management
  const { permissionStatus, setPermissionStatus, setExpoPushToken } =
    useNotificationStore();
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);
  const notificationsEnabled = permissionStatus === "granted";

  // Quiet hours state
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState(22); // 10 PM
  const [quietHoursEnd, setQuietHoursEnd] = useState(7); // 7 AM
  
  // Debounce ref for quiet hours API calls
  const quietHoursDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const QUIET_HOURS_DEBOUNCE_MS = 1000; // 1 second debounce

  // Account settings state
  const [timezone, setTimezone] = useState(Localization.getCalendars()[0]?.timeZone || "UTC");
  const [maxChallengesPerDay, setMaxChallengesPerDay] = useState(5);

  // Debounce ref for account settings API calls
  const accountSettingsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ACCOUNT_SETTINGS_DEBOUNCE_MS = 1000; // 1 second debounce

  // Timezone options
  const timezoneOptions: SelectOption[] = [
    { label: "UTC", value: "UTC", icon: "time-outline" },
    { label: "Eastern Time", value: "America/New_York", icon: "time-outline" },
    { label: "London", value: "Europe/London", icon: "time-outline" },
    { label: "Tokyo", value: "Asia/Tokyo", icon: "time-outline" },
  ];

  // Max challenges options (increments of 5 up to 20)
  const maxChallengesOptions: SelectOption[] = [
    { label: "5 challenges", value: 5, icon: "trophy-outline" },
    { label: "10 challenges", value: 10, icon: "trophy-outline" },
    { label: "15 challenges", value: 15, icon: "trophy-outline" },
    { label: "20 challenges", value: 20, icon: "trophy-outline" },
  ];

  // Check current notification permission status when screen comes into focus
  // This ensures the toggle updates when user returns from system settings
  useFocusEffect(
    useCallback(() => {
      const checkPermissions = async () => {
        const enabled = await areNotificationsEnabled();
        setPermissionStatus(enabled ? "granted" : "denied");
      };
      checkPermissions();
      
      // Load quiet hours settings
      const loadQuietHours = async () => {
        try {
          const saved = await AsyncStorage.getItem("@quiet_hours_settings");
          if (saved) {
            const settings = JSON.parse(saved);
            setQuietHoursEnabled(settings.enabled ?? false);
            setQuietHoursStart(settings.start ?? 22);
            setQuietHoursEnd(settings.end ?? 7);
          }
        } catch (error) {
          console.error("[Profile] Error loading quiet hours:", error);
        }
      };
      loadQuietHours();

      // Load account settings
      const loadAccountSettings = async () => {
        try {
          const savedTimezone = await AsyncStorage.getItem("@account_settings_timezone");
          const savedMaxChallenges = await AsyncStorage.getItem("@account_settings_max_challenges");
          if (savedTimezone) {
            setTimezone(savedTimezone);
          }
          if (savedMaxChallenges) {
            setMaxChallengesPerDay(parseInt(savedMaxChallenges, 10));
          }
        } catch (error) {
          console.error("[Profile] Error loading account settings:", error);
        }
      };
      loadAccountSettings();
    }, [setPermissionStatus])
  );

  // Sync quiet hours to backend API
  const syncQuietHoursToBackend = useCallback(async (enabled: boolean, start: number, end: number) => {
    if (!userId) {
      console.log("[Profile] ⚠️ Cannot sync quiet hours - no userId available");
      return;
    }

    try {
      // Build update payload - only include quiet hours when enabled
      // When disabled, we don't pass the fields (which effectively sets them to null/undefined on backend)
      const updatePayload: { userId: string; quietHoursStart?: number; quietHoursEnd?: number } = { 
        userId 
      };

      if (enabled) {
        updatePayload.quietHoursStart = start;
        updatePayload.quietHoursEnd = end;
      }

      console.log("[Profile] 📤 Syncing quiet hours to backend:", {
        userId,
        enabled,
        quietHoursStart: updatePayload.quietHoursStart,
        quietHoursEnd: updatePayload.quietHoursEnd,
      });

      await updateUserMutation.mutateAsync(updatePayload);

      console.log("[Profile] ✅ Quiet hours synced successfully");
    } catch (error) {
      console.error("[Profile] ❌ Failed to sync quiet hours:", error);
    }
  }, [userId, updateUserMutation]);

  // Save quiet hours settings with debounced API sync
  const saveQuietHours = useCallback((enabled: boolean, start: number, end: number) => {
    // Save to local storage immediately
    AsyncStorage.setItem(
      "@quiet_hours_settings",
      JSON.stringify({ enabled, start, end })
    ).catch((error) => {
      console.error("[Profile] Error saving quiet hours to storage:", error);
    });

    // Clear any pending debounced call
    if (quietHoursDebounceRef.current) {
      clearTimeout(quietHoursDebounceRef.current);
    }

    // Debounce the API call
    quietHoursDebounceRef.current = setTimeout(() => {
      syncQuietHoursToBackend(enabled, start, end);
    }, QUIET_HOURS_DEBOUNCE_MS);
  }, [userId, updateUserMutation, syncQuietHoursToBackend]);

  // Sync account settings to backend API
  const syncAccountSettingsToBackend = useCallback(async (newTimezone: string, newMaxChallenges: number) => {
    if (!userId) {
      console.log("[Profile] ⚠️ Cannot sync account settings - no userId available");
      return;
    }

    try {
      const updatePayload = {
        userId,
        timezone: newTimezone,
        maxChallengesPerDay: newMaxChallenges,
      };

      console.log("[Profile] 📤 Syncing account settings to backend:", updatePayload);
      await updateUserMutation.mutateAsync(updatePayload);
      console.log("[Profile] ✅ Account settings synced successfully");
    } catch (error) {
      console.error("[Profile] ❌ Failed to sync account settings:", error);
    }
  }, [userId, updateUserMutation]);

  // Save account settings with debounced API sync
  const saveAccountSettings = useCallback((newTimezone: string, newMaxChallenges: number) => {
    // Save to local storage immediately
    AsyncStorage.setItem("@account_settings_timezone", newTimezone).catch((error) => {
      console.error("[Profile] Error saving timezone to storage:", error);
    });
    AsyncStorage.setItem("@account_settings_max_challenges", newMaxChallenges.toString()).catch((error) => {
      console.error("[Profile] Error saving max challenges to storage:", error);
    });

    // Clear any pending debounced call
    if (accountSettingsDebounceRef.current) {
      clearTimeout(accountSettingsDebounceRef.current);
    }

    // Debounce the API call
    accountSettingsDebounceRef.current = setTimeout(() => {
      syncAccountSettingsToBackend(newTimezone, newMaxChallenges);
    }, ACCOUNT_SETTINGS_DEBOUNCE_MS);
  }, [syncAccountSettingsToBackend]);

  // Format time for display (24h to 12h format)
  const formatTime = (hour: number) => {
    if (hour === 0) return "12:00 AM";
    if (hour === 12) return "12:00 PM";
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  };

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
          ]
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
              "[Profile] ⚠️ Backend user not found - creating as fallback..."
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
              const response = await createUserMutation.mutateAsync(requestData);
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
                [{ text: "OK", style: "default" }]
              );
            }
          } else {
            console.log(
              "[Profile] 🔄 User exists - updating push token on backend..."
            );

            // PRIMARY PATH: Update existing user with push token
            try {
              console.log("[Profile] 📤 Calling updateUser API with userId:", userId);

              // Update on backend via PUT /users/:userId
              await updateUserMutation.mutateAsync({
                userId,
                deviceId: token,
              });

              console.log("[Profile] ✅ Push token updated on backend");

              // Also update local UserContext state
              await updateLocalUserData({ deviceId: token });
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
            ]
          );
        }
      } catch (error) {
        console.error("[Profile] ❌ Error enabling notifications:", error);
        Alert.alert("Error", "Failed to enable notifications. Please try again.");
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
                ]
              );
            },
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace("/sign-in");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  // Dev-only: Trigger scheduler tick manually
  const handleTriggerSchedulerTick = async () => {
    if (__DEV__) {
      try {
        console.log("[Profile] 🚀 Triggering scheduler tick...");
        const result = await triggerSchedulerMutation.mutateAsync();
        console.log("[Profile] ✅ Scheduler tick result:", result);
        Alert.alert(
          "Scheduler Tick",
          result?.message || "Scheduler tick completed successfully!"
        );
      } catch (error) {
        console.error("[Profile] ❌ Scheduler tick failed:", error);
        Alert.alert(
          "Scheduler Tick Failed",
          error instanceof Error ? error.message : "Unknown error occurred"
        );
      }
    }
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
        </View>
      </View>

      {/* Quiet Hours Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>QUIET HOURS</Text>
        
        {/* Unified Quiet Hours Card */}
        <View style={styles.quietHoursCard}>
          {/* Card Header with Toggle */}
          <View style={styles.quietHoursCardHeader}>
            <View style={styles.quietHoursCardHeaderLeft}>
              <View style={[styles.quietHoursIconContainer, { backgroundColor: Theme.colors.primary.medium }]}>
                <Ionicons name="moon-outline" size={Theme.iconSize.md} color={Theme.colors.primary.main} />
              </View>
              <View style={styles.quietHoursCardHeaderText}>
                <Text style={styles.quietHoursCardTitle}>Quiet Hours</Text>
                <Text style={styles.quietHoursCardSubtitle}>Set do-not-disturb times</Text>
              </View>
            </View>
            <View style={styles.switchContainer}>
              <Switch
                value={quietHoursEnabled}
                onValueChange={(value: boolean) => {
                  setQuietHoursEnabled(value);
                  saveQuietHours(value, quietHoursStart, quietHoursEnd);
                }}
                trackColor={{
                  false: Theme.colors.gray[200],
                  true: Theme.colors.primary.main,
                }}
                thumbColor={Theme.colors.background.secondary}
                ios_backgroundColor={Theme.colors.gray[200]}
                testID="setting-quiet-hours-switch"
              />
            </View>
          </View>
          
          {/* Divider */}
          <View style={styles.quietHoursCardDivider} />
          
          {/* Card Content */}
          {!quietHoursEnabled ? (
            <View style={styles.quietHoursDisabledContent}>
              <Ionicons
                name="moon-outline"
                size={20}
                color={Theme.colors.text.secondary}
              />
              <Text style={styles.quietHoursDisabledText}>
                Quiet hours are disabled
              </Text>
            </View>
          ) : (
            <View style={styles.quietHoursEnabledContent}>
              {/* Start Time Slider */}
              <View style={styles.sliderContainer}>
                <View style={styles.sliderLabelRow}>
                  <View style={styles.sliderLabelWithIcon}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={Theme.colors.text.secondary}
                      style={styles.sliderIcon}
                    />
                    <Text style={styles.sliderLabel}>Start Time</Text>
                  </View>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>{formatTime(quietHoursStart)}</Text>
                  </View>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={23}
                  step={1}
                  value={quietHoursStart}
                  onValueChange={(value) => {
                    setQuietHoursStart(value);
                    saveQuietHours(quietHoursEnabled, value, quietHoursEnd);
                  }}
                  minimumTrackTintColor={Theme.colors.primary.main}
                  maximumTrackTintColor={Theme.colors.background.tertiary}
                  thumbTintColor={Theme.colors.primary.main}
                />
              </View>

              {/* Divider */}
              <View style={styles.sliderDivider} />

              {/* End Time Slider */}
              <View style={styles.sliderContainer}>
                <View style={styles.sliderLabelRow}>
                  <View style={styles.sliderLabelWithIcon}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={Theme.colors.text.secondary}
                      style={styles.sliderIcon}
                    />
                    <Text style={styles.sliderLabel}>End Time</Text>
                  </View>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>{formatTime(quietHoursEnd)}</Text>
                  </View>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={23}
                  step={1}
                  value={quietHoursEnd}
                  onValueChange={(value) => {
                    setQuietHoursEnd(value);
                    saveQuietHours(quietHoursEnabled, quietHoursStart, value);
                  }}
                  minimumTrackTintColor={Theme.colors.primary.main}
                  maximumTrackTintColor={Theme.colors.background.tertiary}
                  thumbTintColor={Theme.colors.primary.main}
                />
              </View>

              {/* Info Text */}
              <View style={styles.quietHoursInfo}>
                <Ionicons
                  name="notifications-off-outline"
                  size={14}
                  color={Theme.colors.text.secondary}
                />
                <Text style={styles.quietHoursInfoText}>
                  No notifications from {formatTime(quietHoursStart)} to {formatTime(quietHoursEnd)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Account Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>

        {/* Timezone & Daily Challenge Limit Settings Card */}
        <View style={styles.accountSettingsCard}>
          <View style={styles.accountSettingsCardContentStacked}>
            {/* Timezone Picker */}
            <View style={styles.stackedPickerRow}>
              <Text style={styles.stackedPickerLabel}>Timezone</Text>
              <View style={styles.pickerWrapper}>
                <SelectDropdown
                  options={timezoneOptions}
                  value={timezone}
                  onChange={(itemValue) => {
                    setTimezone(itemValue as string);
                    saveAccountSettings(itemValue as string, maxChallengesPerDay);
                  }}
                  icon="globe-outline"
                  placeholder="Select..."
                  fullWidth={true}
                />
              </View>
            </View>

            {/* Divider */}
            <View style={styles.stackedPickerDivider} />

            {/* Daily Challenge Limit Picker */}
            <View style={styles.stackedPickerRow}>
              <Text style={styles.stackedPickerLabel}>Daily Limit</Text>
              <View style={styles.pickerWrapper}>
                <SelectDropdown
                  options={maxChallengesOptions}
                  value={maxChallengesPerDay}
                  onChange={(itemValue) => {
                    setMaxChallengesPerDay(itemValue as number);
                    saveAccountSettings(timezone, itemValue as number);
                  }}
                  icon="trophy-outline"
                  placeholder="Select..."
                  fullWidth={true}
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Developer Tools Section - Dev Mode Only */}
      {__DEV__ && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DEVELOPER TOOLS</Text>
          <View style={styles.settingsGroup}>
            <TouchableOpacity
              style={[styles.devButton, triggerSchedulerMutation.isPending && styles.devButtonDisabled]}
              onPress={handleTriggerSchedulerTick}
              disabled={triggerSchedulerMutation.isPending}
              activeOpacity={0.8}
            >
              <Ionicons
                name="play-circle-outline"
                size={Theme.iconSize.md}
                color={Theme.colors.text.inverse}
              />
              <Text style={styles.devButtonText}>
                {triggerSchedulerMutation.isPending ? "Triggering..." : "Trigger Scheduler Tick"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButtonContainer}
        onPress={handleLogout}
        activeOpacity={0.9}
        testID="logout-button"
      >
        <LinearGradient
          colors={[Theme.colors.primary.main, Theme.colors.primary.main]}
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
