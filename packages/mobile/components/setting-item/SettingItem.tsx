import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme/Theme';
import { createTextStyle } from '@/theme/ThemeUtils';

export type SettingItemVariant = 'default' | 'primary' | 'support';

export interface SettingItemProps {
  /** Icon name from Ionicons */
  icon: keyof typeof Ionicons.glyphMap;
  /** Main title text */
  title: string;
  /** Subtitle/description text (optional) */
  subtitle?: string;
  /** Callback when item is pressed */
  onPress: () => void;
  /** Visual variant of the item */
  variant?: SettingItemVariant;
  /** Show navigation arrow (default: true) */
  showChevron?: boolean;
  /** Show external link icon instead of chevron */
  isExternalLink?: boolean;
  /** Custom test ID for testing */
  testID?: string;
}

/**
 * Reusable settings list item component
 * 
 * @example
 * ```tsx
 * <SettingItem
 *   icon="notifications-outline"
 *   title="Notifications"
 *   subtitle="Manage your alerts"
 *   onPress={() => router.push('/notifications')}
 * />
 * ```
 */
export const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  variant = 'default',
  showChevron = true,
  isExternalLink = false,
  testID,
}) => {
  const iconColor =
    variant === 'support'
      ? Theme.colors.text.secondary
      : Theme.colors.primary.main;
      
  const iconBgColor =
    variant === 'support'
      ? Theme.colors.background.tertiary
      : Theme.colors.primary.medium;

  const rightIcon = isExternalLink
    ? 'open-outline'
    : 'chevron-forward';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      testID={testID}
    >
      {/* Icon Container */}
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={Theme.iconSize.md} color={iconColor} />
      </View>

      {/* Text Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Right Arrow/Icon */}
      {showChevron && (
        <Ionicons
          name={rightIcon}
          size={Theme.iconSize.md}
          color={Theme.colors.settings.chevron}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.background.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
    gap: Theme.spacing.lg,
    ...Theme.shadows.card,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    ...createTextStyle('base', 'bold', 'primary'),
  },
  subtitle: {
    ...createTextStyle('xs', 'regular', 'secondary'),
    marginTop: Theme.spacing.xs / 2,
  },
});
