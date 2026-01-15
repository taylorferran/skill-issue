/**
 * Theme Utilities
 * Helper functions for creating consistent styles across the app
 */

import { TextStyle, ViewStyle } from 'react-native';
import { Theme } from './Theme';

/**
 * Creates a text style object with consistent typography
 */
export const createTextStyle = (
  size: keyof typeof Theme.typography.fontSize,
  weight: keyof typeof Theme.typography.fontWeight,
  color: 'primary' | 'secondary' | 'inverse' = 'primary',
  additionalStyles?: Partial<TextStyle>
): TextStyle => ({
  fontSize: Theme.typography.fontSize[size],
  fontWeight: Theme.typography.fontWeight[weight],
  color: Theme.colors.text[color],
  ...additionalStyles,
});

/**
 * Creates a card style with consistent spacing and borders
 */
export const createCardStyle = (
  variant: 'default' | 'primary' = 'default',
  additionalStyles?: Partial<ViewStyle>
): ViewStyle => ({
  backgroundColor: Theme.colors.background.secondary,
  padding: Theme.spacing['2xl'],
  borderRadius: Theme.borderRadius.xl,
  borderWidth: Theme.borderWidth.thin,
  borderColor: variant === 'primary' 
    ? Theme.colors.primary.border 
    : Theme.colors.primary.medium,
  ...(variant === 'primary' ? Theme.shadows.primaryCard : Theme.shadows.card),
  ...additionalStyles,
});

/**
 * Creates a button style with consistent sizing
 */
export const createButtonStyle = (
  variant: 'primary' | 'secondary' | 'outline' = 'primary',
  additionalStyles?: Partial<ViewStyle>
): ViewStyle => {
  const baseStyle: ViewStyle = {
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing['2xl'],
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  };

  switch (variant) {
    case 'primary':
      return {
        ...baseStyle,
        backgroundColor: Theme.colors.primary.main,
        ...additionalStyles,
      };
    case 'secondary':
      return {
        ...baseStyle,
        backgroundColor: Theme.colors.background.secondary,
        borderWidth: Theme.borderWidth.thin,
        borderColor: Theme.colors.primary.medium,
        ...additionalStyles,
      };
    case 'outline':
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderWidth: Theme.borderWidth.medium,
        borderColor: Theme.colors.primary.border,
        ...additionalStyles,
      };
  }
};

/**
 * Creates a badge style
 */
export const createBadgeStyle = (
  variant: 'primary' | 'success' = 'primary',
  additionalStyles?: Partial<ViewStyle>
): ViewStyle => ({
  paddingHorizontal: Theme.spacing.sm,
  paddingVertical: Theme.spacing.xs / 2,
  borderRadius: Theme.borderRadius.lg,
  backgroundColor: variant === 'primary' 
    ? Theme.colors.primary.border 
    : Theme.colors.success.light,
  ...additionalStyles,
});

/**
 * Creates an icon container style
 */
export const createIconContainerStyle = (
  size: 'sm' | 'md' | 'lg' = 'md',
  additionalStyles?: Partial<ViewStyle>
): ViewStyle => {
  const sizeMap = {
    sm: Theme.spacing.lg,
    md: Theme.spacing['2xl'],
    lg: Theme.spacing['3xl'],
  };

  return {
    width: sizeMap[size],
    height: sizeMap[size],
    borderRadius: sizeMap[size] / 2,
    backgroundColor: Theme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...additionalStyles,
  };
};

/**
 * Common spacing utilities
 */
export const spacing = {
  // Standard padding for containers
  containerPadding: {
    padding: Theme.spacing['2xl'],
  },
  // Standard margin bottom for sections
  sectionMargin: {
    marginBottom: Theme.spacing['3xl'],
  },
  // Standard gap between elements
  elementGap: {
    gap: Theme.spacing.lg,
  },
};

/**
 * Common flex utilities
 */
export const flex = {
  row: {
    flexDirection: 'row' as const,
  },
  rowCenter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  rowBetween: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  center: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};
