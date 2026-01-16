// components/custom-tab-bar/CustomTab.style.ts
import { StyleSheet } from 'react-native';
import { Theme } from '@/theme/Theme';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.background.secondary,
    borderTopWidth: Theme.borderWidth.thin,
    borderTopColor: Theme.colors.primary.light,
    paddingTop: Theme.spacing.sm, // Add padding at top for spacing
    // paddingBottom will be added dynamically based on safe area
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.xs,
    position: 'relative',
    paddingVertical: Theme.spacing.sm, // Add some vertical padding
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.sm,
  },
  label: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: Theme.typography.letterSpacing.wide,
  },
});
