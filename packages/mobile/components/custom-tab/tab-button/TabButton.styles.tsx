import { Theme } from "@/theme/Theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: `${Theme.colors.background.secondary}DD`, // 87% opacity
    borderTopWidth: Theme.borderWidth.thin,
    borderTopColor: Theme.colors.primary.light,
    paddingBottom: Theme.spacing.sm,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    backgroundColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: Theme.spacing['5xl'] - 48,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.xs,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    letterSpacing: Theme.typography.letterSpacing.wide,
  },
});
