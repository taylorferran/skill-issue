// components/custom-tab-bar/CustomTabBar.tsx
import React from "react";
import { View, Text, Pressable } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePathname, useRouter } from "expo-router";
import { Theme } from "@/theme/Theme";
import { styles } from "./CustomTab.style";

type TabConfig = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  path: string;
};

const TAB_CONFIGS: Record<string, TabConfig> = {
  "(skills)": {
    icon: "military-tech",
    label: "SKILLS",
    path: "/",
  },
  "(profile)": {
    icon: "verified-user",
    label: "PROFILE",
    path: "/profile",
  },
};

// Helper: Check if a tab should be highlighted
function isTabFocused(routeName: string, tabIndex: number, currentIndex: number, pathname: string): boolean {
  // Direct tab focus
  if (currentIndex === tabIndex) return true;

  // Skills tab: highlight for all non-profile routes
  if (routeName === "(skills)") {
    return pathname === "/" || (!!pathname.match(/^\/[^/]+/) && !pathname.startsWith("/profile"));
  }

  // Profile tab: highlight for profile routes
  if (routeName === "(profile)/index") {
    return pathname.startsWith("/profile");
  }

  return false;
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

console.log("Tab routes:", state.routes.map(r => ({ name: r.name, key: r.key })));

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const config = TAB_CONFIGS[route.name];
        if (!config) return null;

        const isFocused = isTabFocused(route.name, index, state.index, pathname);

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            router.push(config.path);
          }
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tabButton}>
            {isFocused && <View style={styles.activeIndicator} />}
            <MaterialIcons
              name={config.icon}
              size={Theme.iconSize.xl / 3.5}
              color={isFocused ? Theme.colors.primary.main : Theme.colors.text.secondary}
            />
            <Text 
              style={[
                styles.label, 
                { color: isFocused ? Theme.colors.primary.main : Theme.colors.text.secondary }
              ]}
            >
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
