// app/(tabs)/_layout.tsx
import { Tabs, Redirect } from "expo-router";
import React from "react";
import { useAuth } from "@clerk/clerk-expo";
import { CustomHeader } from "@/components/header/Header";
import { HapticTab } from "@/components/heptic-tab/HepticTab";
import { CustomTabBar } from "@/components/custom-tab/CustomTab";
import { useNotificationStore } from "@/stores/notificationStore";

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  // Log push token availability for debugging
  if (__DEV__) {
    const { getPushToken } = useNotificationStore.getState();
    const currentToken = getPushToken();
    if (currentToken) {
      console.log('[TabLayout] 🔑 Push token available:', currentToken);
    }
  }

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
