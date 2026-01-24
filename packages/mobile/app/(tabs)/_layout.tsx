// app/(tabs)/_layout.tsx
import { Tabs, Redirect } from "expo-router";
import React from "react";
import { useAuth } from "@clerk/clerk-expo";
import { CustomHeader } from "@/components/header/Header";
import { HapticTab } from "@/components/heptic-tab/HepticTab";
import { CustomTabBar } from "@/components/custom-tab/CustomTab";

// app/(tabs)/_layout.tsx - temporary debug version
export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      initialRouteName="(skills)"
      screenListeners={{
        state: (e) => {
          console.log('Tab state changed:', e.data);
        },
      }}
      tabBar={(props) => {
        console.log('Tab render - index:', props.state.index, 'route:', props.state.routes[props.state.index].name);
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
