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

const TAB_CONFIGS: Record<string, Omit<TabConfig, "path">> = {
  "(skills)": {
    icon: "military-tech",
    label: "SKILLS",
  },
  "(profile)": {
    icon: "verified-user",
    label: "PROFILE",
  },
};

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const config = TAB_CONFIGS[route.name];
        if (!config) return null;

        // Simple focus check - just use the navigation state
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            // Reset to root of the tab to clear navigation history
            navigation.reset({
              index: 0,
              routes: [{ name: route.name }],
            });
          }
        };
        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tabButton}>
            {isFocused && <View style={styles.activeIndicator} />}
            <MaterialIcons
              name={config.icon}
              size={Theme.iconSize.xl / 3.5}
              color={
                isFocused
                  ? Theme.colors.primary.main
                  : Theme.colors.text.secondary
              }
            />
            <Text
              style={[
                styles.label,
                {
                  color: isFocused
                    ? Theme.colors.primary.main
                    : Theme.colors.text.secondary,
                },
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
