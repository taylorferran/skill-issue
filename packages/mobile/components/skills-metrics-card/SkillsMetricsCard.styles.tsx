import { Theme } from "@/theme/Theme";
import { createTextStyle, createCardStyle } from "@/theme/ThemeUtils";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Container
  container: {
    ...createCardStyle("default"),
    padding: Theme.spacing.xs,
    marginHorizontal: Theme.spacing["2xl"],
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
    overflow: "hidden",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Theme.spacing.md,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.md,
    flex: 1,
  },

  headerText: {
    gap: Theme.spacing.xs / 2,
    flex: 1,
  },

  headerTitle: {
    ...createTextStyle("base", "bold", "primary"),
  },

  headerSubtitle: {
    ...createTextStyle("xs", "regular", "secondary"),
  },

  headerRight: {
    paddingLeft: Theme.spacing.sm,
  },

  // Expanded Content
  expandedContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
  },

  divider: {
    height: 1,
    backgroundColor: Theme.colors.primary.medium,
    marginBottom: Theme.spacing.lg,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Theme.spacing.xl,
  },

  emptyStateText: {
    ...createTextStyle("sm", "regular", "secondary"),
    textAlign: "center",
  },
});
