import { Theme } from "@/theme/Theme";
import { createTextStyle } from "@/theme/ThemeUtils";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Card Wrapper
  ratingCardWrapper: {
    marginBottom: Theme.spacing.sm,
  },

  // Card Container (reusing AIAssessment card styling)
  ratingCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.medium,
    backgroundColor: Theme.colors.background.secondary,
    padding: Theme.spacing.xl,
    ...Theme.shadows.card,
  },

  // Decorative Background Element
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

  // Content Container
  ratingContent: {
    position: "relative",
    zIndex: 10,
    gap: Theme.spacing.lg,
  },

  // Header Section
  ratingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.xs,
  },

  ratingTitle: {
    ...createTextStyle("base", "bold", "primary"),
    lineHeight: Theme.typography.lineHeight.tight,
  },

  // Description Text
  ratingDescription: {
    ...createTextStyle("sm", "regular", "secondary"),
    lineHeight: Theme.typography.lineHeight.tight,
    marginBottom: Theme.spacing.md,
  },

  // Slider Section
  sliderSection: {
    gap: Theme.spacing.sm,
  },

  // Slider Row (slider + confirm button)
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.md,
  },

  // Slider Container
  sliderContainer: {
    flex: 1,
  },

  // Slider End Labels (1 and 10)
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Theme.spacing.xs,
    marginBottom: Theme.spacing.xs,
  },

  sliderEndLabel: {
    ...createTextStyle("sm", "medium", "secondary"),
  },

  // Slider Component
  slider: {
    width: "100%",
    height: 40,
  },

  // Confirm Button
  confirmButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.primary.main,
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.card,
  },
  
  confirmButtonDisabled: {
    opacity: 0.6,
  },

  // Current Value Display
  currentValue: {
    ...createTextStyle("sm", "medium", "primary"),
    textAlign: "center",
  },
});
