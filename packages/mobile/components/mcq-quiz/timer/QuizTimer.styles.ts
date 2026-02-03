import { Theme } from "@/theme/Theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.md,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text.secondary,
    letterSpacing: -0.3,
  },
});
