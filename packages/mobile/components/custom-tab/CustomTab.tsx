// components/custom-tab-bar/CustomTabBar.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/theme/Theme';
import { styles } from './CustomTab.style';

type TabConfig = {
  name: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
};

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: {
    name: 'index',
    icon: 'dashboard',
    label: 'DASHBOARD',
  },
  skills: {
    name: 'skills',
    icon: 'military-tech',
    label: 'SKILLS',
  },
  profile: {
    name: 'profile',
    icon: 'verified-user',
    label: 'PROFILE',
  },

};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = TAB_CONFIGS[route.name];

        // Skip routes without config (like profile/logout)
        if (!config) return null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabButton}
          >
            {/* Top indicator line */}
            {isFocused && <View style={styles.activeIndicator} />}
            
            {/* Icon */}
            <MaterialIcons
              name={config.icon}
              size={Theme.iconSize.xl / 3.5}
              color={isFocused ? Theme.colors.primary.main : Theme.colors.text.secondary}
            />
            
            {/* Label */}
            <Text
              style={[
                styles.label,
                { color: isFocused ? Theme.colors.primary.main : Theme.colors.text.secondary },
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
