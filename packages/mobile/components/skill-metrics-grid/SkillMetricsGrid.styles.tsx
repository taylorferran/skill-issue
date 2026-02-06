import { Theme } from "@/theme/Theme";
import { createTextStyle } from "@/theme/ThemeUtils";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Container
  container: {
    gap: Theme.spacing.lg,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    gap: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },

  statCardWrapper: {
    flex: 1,
  },

  // Stat Card (matches StatCard.styles.ts)
  statCard: {
    gap: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.md,
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

  // Compact Progress Card (for 2x2 grid)
  compactProgressCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.medium,
    ...Theme.shadows.card,
    flex: 1,
  },

  compactProgressHeader: {
    ...createTextStyle("xs", "bold", "secondary"),
    letterSpacing: 1,
    marginBottom: Theme.spacing.sm,
    textAlign: "center",
  },

  // Compact Accuracy Card (for 2x2 grid)
  compactAccuracyCard: {
    alignItems: "center",
    justifyContent: "flex-start",
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.success.light,
    ...Theme.shadows.card,
    flex: 1,
  },

  accuracyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },

  compactAccuracyLabel: {
    ...createTextStyle("xs", "bold", "secondary"),
    letterSpacing: 1,
    marginBottom: Theme.spacing.xs,
  },

  compactAccuracyValue: {
    fontSize: 28,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.success.main,
    marginBottom: Theme.spacing.xs,
  },

  compactAccuracySubtext: {
    ...createTextStyle("xs", "regular", "secondary"),
    textAlign: "center",
  },
});
