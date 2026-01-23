import { Theme } from "@/theme/Theme";
import { createTextStyle } from "@/theme/ThemeUtils";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // AI Assessment Card
  assessmentCardWrapper: {
    marginBottom: Theme.spacing.sm,
  },

  assessmentCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.medium,
    backgroundColor: Theme.colors.background.secondary,
    padding: Theme.spacing.xl,
    ...Theme.shadows.card,
  },

  decorativeBlob: {
    position: "absolute",
    right: -16,
    top: -16,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Theme.colors.primary.light,
    opacity: 0.5,
  },

  assessmentContent: {
    position: "relative",
    zIndex: 10,
    gap: Theme.spacing.lg,
  },

  assessmentInfo: {
    gap: Theme.spacing.xs,
  },

  assessmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },

  assessmentTitle: {
    ...createTextStyle("base", "bold", "primary"),
    lineHeight: Theme.typography.lineHeight.tight,
  },

  assessmentDescription: {
    ...createTextStyle("sm", "regular", "secondary"),
    lineHeight: Theme.typography.lineHeight.tight,
    maxWidth: 240,
  },

  assessmentButton: {
    height: 50,
    minWidth: 100,
    paddingHorizontal: Theme.spacing.xl,
  },

  assessmentButtonText: {
    ...createTextStyle("sm", "bold", "inverse"),
  },
})

