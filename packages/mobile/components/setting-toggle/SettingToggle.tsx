import React from 'react';
import { View, Text, Switch, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme/Theme';
import { styles } from './SettingToggle.styles';

export interface SettingToggleProps {
  /** Icon name from Ionicons */
  icon: keyof typeof Ionicons.glyphMap;
  /** Main title text */
  title: string;
  /** Subtitle/description text (optional) */
  subtitle?: string;
  /** Current toggle value */
  value: boolean;
  /** Callback when toggle value changes */
  onValueChange: (value: boolean) => void;
  /** Disable the toggle (e.g., during loading) */
  disabled?: boolean;
  /** Show loading indicator instead of switch */
  loading?: boolean;
  /** Custom test ID for testing */
  testID?: string;
}

/**
 * Reusable settings toggle switch component
 * 
 * @example
 * ```tsx
 * <SettingToggle
 *   icon="notifications-outline"
 *   title="Notifications"
 *   subtitle="Manage your alerts"
 *   value={isEnabled}
 *   onValueChange={setIsEnabled}
 * />
 * ```
 */
export const SettingToggle: React.FC<SettingToggleProps> = ({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  disabled = false,
  loading = false,
  testID,
}) => {
  const iconColor = Theme.colors.primary.main;
  const iconBgColor = Theme.colors.primary.medium;

  return (
    <View style={styles.container} testID={testID}>
      {/* Icon Container */}
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={Theme.iconSize.md} color={iconColor} />
      </View>

      {/* Text Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Toggle Switch or Loading Indicator */}
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={Theme.colors.primary.main}
        />
      ) : (
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{
            false: Theme.colors.gray[200],
            true: Theme.colors.primary.main,
          }}
          thumbColor={Theme.colors.background.secondary}
          ios_backgroundColor={Theme.colors.gray[200]}
          testID={`${testID}-switch`}
        />
      )}
    </View>
  );
};
