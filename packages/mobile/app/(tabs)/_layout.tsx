// app/(tabs)/_layout.tsx
import { Tabs, Redirect } from "expo-router";
import React from "react";
import { useAuth } from "@clerk/clerk-expo";
import { CustomHeader } from "@/components/header/Header";
import { HapticTab } from "@/components/heptic-tab/HepticTab";
import { CustomTabBar } from "@/components/custom-tab/CustomTab";

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/sign-in" />;

  return (
    // app/(tabs)/_layout.tsx
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        header: (props) => <CustomHeader {...props} />,
        headerShown: true, // This enables header for all tab screens
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="(skills)" // ← Points to the whole stack
        options={{
          title: "Skills",
          href: "/",
        }}
      />

      <Tabs.Screen
        name="(profile)"
        options={{
          title: "Profile",
          href: "/profile",
        }}
      />
    </Tabs>
  );
}
