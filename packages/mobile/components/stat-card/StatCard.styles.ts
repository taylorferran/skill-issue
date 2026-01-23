import { Theme } from "@/theme/Theme";
import { createTextStyle } from "@/theme/ThemeUtils";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    gap: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },

  statCardWrapper: {
    flex: 1,
  },

  statCard: {
    gap: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    backgroundColor: Theme.colors.background.secondary,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.medium,
    ...Theme.shadows.card,
  },

  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statLabel: {
    ...createTextStyle("xs", "bold", "secondary"),
    letterSpacing: Theme.typography.letterSpacing.wide,
  },

  statContent: {
    gap: Theme.spacing.xs / 2,
  },

  statValue: {
    fontSize: Theme.typography.fontSize["2xl"],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    lineHeight: Theme.typography.lineHeight.normal,
  },

  statSubtitle: {
    ...createTextStyle("xs", "bold", "secondary"),
    marginTop: Theme.spacing.xs / 2,
  },


}) 
