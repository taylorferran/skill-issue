import { Tabs, Redirect, useRouter } from "expo-router";
import React from "react";
import { useAuth } from "@clerk/clerk-expo";
import { Pressable } from "react-native";
import { CustomHeader } from "@/components/Header";
import { Colors } from "@/constants/theme";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const router = useRouter();

  // Wait for auth to load
  if (!isLoaded) {
    return null;
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/sign-in");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'red',
        header: () => <CustomHeader />,
        headerShown: true,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: () => (
            <IconSymbol size={28} name="house.fill" color={'red'} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Sign Out",
          tabBarIcon: () => (
            <IconSymbol
              size={28}
              name="rectangle.portrait.and.arrow.right"
              color={'green'}
            />
          ),
          tabBarButton: (props: any) => (
            <Pressable {...props} onPress={handleSignOut} style={props.style} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
          },
        }}
      />
    </Tabs>
  );
}
