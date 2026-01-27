// app/(tabs)/_layout.tsx
import { Tabs, Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Alert } from "react-native";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CustomHeader } from "@/components/header/Header";
import { HapticTab } from "@/components/heptic-tab/HepticTab";
import { CustomTabBar } from "@/components/custom-tab/CustomTab";
import { useCreateUser } from "@/api-routes/createUser";
import { useNotificationStore } from "@/stores/notificationStore";
import type { CreateUserInput } from "@learning-platform/shared";

const USER_CREATED_KEY = "@skill_issue_user_created";

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { expoPushToken, getPushToken } = useNotificationStore();
  const { execute } = useCreateUser();

  // User creation state
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Log push token availability for debugging
  if (__DEV__) {
    const currentToken = getPushToken();
    if (currentToken) {
      console.log('[TabLayout] 🔑 Push token available:', currentToken);
    }
  }

  // Create user on backend after sign-in
  useEffect(() => {
    if (!isSignedIn || !user || isCreatingUser) {
      return;
    }

    checkAndCreateUser();

    async function checkAndCreateUser() {
      if (!user) return;

      try {
        // Check if user was already created to prevent duplicate API calls
        const userCreated = await AsyncStorage.getItem(USER_CREATED_KEY);
        if (userCreated === user.id) {
          console.log("[TabLayout] ✅ User already created, skipping API call");
          return;
        }

        setIsCreatingUser(true);

        // Prepare user data conforming to CreateUserSchema
        const userData: CreateUserInput = {
          timezone: Localization.getCalendars()[0]?.timeZone || "UTC",
          deviceId: expoPushToken || undefined,
          maxChallengesPerDay: 5, // Default from schema
        };

        console.log("[TabLayout] 🚀 Creating user with data:", {
          timezone: userData.timezone,
          deviceId: userData.deviceId ? '[Push Token Set]' : 'No notifications',
          maxChallengesPerDay: userData.maxChallengesPerDay
        });

        await execute(userData);

        // Mark user as created
        await AsyncStorage.setItem(USER_CREATED_KEY, user.id);

        console.log("[TabLayout] ✅ User successfully created on backend");
      } catch (error) {
        console.error("[TabLayout] ❌ Error creating user on backend:", error);

        // Show alert but don't block user flow
        Alert.alert(
          "Setup Notice",
          "We encountered an issue setting up your account. You can continue using the app, but some features may be limited.",
          [{ text: "OK", style: "default" }],
        );
      } finally {
        setIsCreatingUser(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user, isCreatingUser, expoPushToken]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      initialRouteName="(skills)"
      screenListeners={{
        state: (e) => {
          if (__DEV__) {
            console.log("[TabLayout] 🔄 Tab state changed:", e.data);
          }
        },
      }}
      tabBar={(props) => {
        if (__DEV__) {
          console.log(
            "[TabLayout] 📱 Tab render - index:",
            props.state.index,
            "route:",
            props.state.routes[props.state.index].name,
          );
        }
        return <CustomTabBar {...props} />;
      }}
      screenOptions={{
        header: (props) => <CustomHeader {...props} />,
        headerShown: true,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="(skills)"
        options={{
          title: "Skills",
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: "Profile",
        }}
      />
    </Tabs>
  );
}
