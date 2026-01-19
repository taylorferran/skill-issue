import { Theme } from "@/theme/Theme";
import { createTextStyle } from "@/theme/ThemeUtils";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: Theme.spacing["2xl"],
    paddingBottom: 120,
    gap: Theme.spacing.lg,
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

  // Progress Gauge Card
  progressCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing["3xl"],
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.medium,
    ...Theme.shadows.card,
    marginBottom: Theme.spacing.sm,
  },

  progressHeader: {
    ...createTextStyle("xs", "bold", "secondary"),
    letterSpacing: 1.6,
    marginBottom: Theme.spacing["3xl"],
  },

  // Simple Circular Progress (View-based)
  simpleGaugeContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.spacing.md,
  },

  gaugeOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 8,
    borderColor: Theme.colors.timeline.trackInactive,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  gaugeInner: {
    alignItems: "center",
    justifyContent: "center",
  },

  gaugeNumber: {
    fontSize: 36,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    letterSpacing: -1,
  },

  gaugeTotal: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.secondary,
  },

  // Progress indicator (dots around circle)
  progressIndicatorContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  progressDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary.main,
  },

  gaugeLabel: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.sm,
    letterSpacing: 1,
  },

  progressDescription: {
    ...createTextStyle("sm", "regular", "secondary"),
    textAlign: "center",
    maxWidth: 200,
    marginTop: Theme.spacing["3xl"],
  },

  // Pro Tip Card
  proTipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.lg,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
    backgroundColor: Theme.colors.primary.light,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.border,
    marginBottom: Theme.spacing.sm,
  },

  proTipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primary.medium,
    alignItems: "center",
    justifyContent: "center",
  },

  proTipContent: {
    flex: 1,
    gap: Theme.spacing.xs / 2,
  },

  proTipTitle: {
    ...createTextStyle("sm", "bold", "primary"),
  },

  proTipText: {
    ...createTextStyle("xs", "regular", "secondary"),
  },

  // Bottom CTA with Gradient
  bottomCTA: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Theme.spacing["2xl"],
    paddingTop: Theme.spacing["4xl"],
  },

  ctaButton: {
    width: "100%",
    height: 56,
    backgroundColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Theme.spacing.md,
    ...Theme.shadows.primaryCard,
  },

  ctaButtonText: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.inverse,
  },
}) 

