import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/theme/Theme';
import { styles } from './NotificationBadge.styles';

interface NotificationBadgeProps {
  count: number;
  onPress: () => void;
}

export function NotificationBadge({ count, onPress }: NotificationBadgeProps) {
  const displayCount = count > 9 ? '9+' : String(count);
  const showBadge = count > 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      onPress={onPress}
    >
      <MaterialIcons
        name="notifications"
        color={Theme.colors.primary.main}
        size={Theme.iconSize.lg}
      />
      <View style={[styles.badge, !showBadge && styles.badgeHidden]}>
        <Text style={styles.badgeText}>{displayCount}</Text>
      </View>
    </Pressable>
  );
}
