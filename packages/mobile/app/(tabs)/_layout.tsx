// app/(tabs)/_layout.tsx
import { Tabs, Redirect, useRouter } from "expo-router";
import React from "react";
import { useAuth } from "@clerk/clerk-expo";
import { Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { CustomHeader } from "@/components/header/Header";
import { HapticTab } from "@/components/heptic-tab/HepticTab";
import { CustomTabBar } from "@/components/custom-tab/CustomTab";

export default function TabLayout() {
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const router = useRouter();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  //  const handleSignOut = async () => {
  //    try {
  //      await signOut();
  //     router.replace("/sign-in");
  //  } catch (err) {
  //   console.error("Sign out error:", err);
  //  }
  // };

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        header: (props) => <CustomHeader {...props} />,
        headerShown: true,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          href: "/",
        }}
      />
      <Tabs.Screen
        name="skills/index"
        options={{
          title: "Skills",
          href: "/skills",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          href: "/profile", // Hide from tab bar
        }}
     />
    </Tabs>
  );
}
