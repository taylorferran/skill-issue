
import { Theme } from "@/theme/Theme";
import { createTextStyle, createCardStyle, flex } from "@/theme/ThemeUtils";
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

  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: Theme.spacing["2xl"],
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
    paddingBottom: Theme.spacing['xl'],
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
  
  // Empty State
  emptyProgressContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing.md,
  },
  
  emptyProgressText: {
    ...createTextStyle("xs", "regular", "secondary"),
    textAlign: "center",
  },

  // Compact Progress Card (for 2x2 grid)
  compactProgressCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing.lg,
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
  
  // Accuracy Card
  accuracyCard: {
    alignItems: "center",
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.success.light,
    ...Theme.shadows.card,
  },

  // Compact Accuracy Card (for 2x2 grid)
  compactAccuracyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.success.light,
    ...Theme.shadows.card,
    flex: 1,
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
  
  accuracyLabel: {
    ...createTextStyle("xs", "bold", "secondary"),
    letterSpacing: 1.6,
    marginBottom: Theme.spacing.xs,
  },
  
  accuracyValue: {
    fontSize: 32,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.success.main,
    marginBottom: Theme.spacing.xs,
  },
  
  accuracySubtext: {
    ...createTextStyle("xs", "regular", "secondary"),
    textAlign: "center",
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
    padding: Theme.spacing["2xl"],
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

  // Challenges Section
  challengesSection: {
    marginTop: Theme.spacing.lg,
  },

  challengesHeader: {
    ...createTextStyle("xs", "bold", "secondary"),
    letterSpacing: 1.6,
    marginBottom: Theme.spacing.lg,
    paddingLeft: Theme.spacing.xs,
  },

  emptyChallengesCard: {
    ...createCardStyle("default"),
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing["3xl"],
    gap: Theme.spacing.lg,
  },

  emptyChallengesText: {
    ...createTextStyle("sm", "regular", "secondary"),
    textAlign: "center",
  },

  challengesList: {
    gap: Theme.spacing.md,
  },

  challengeCard: {
    ...createCardStyle("default"),
    padding: Theme.spacing.lg,
  },

  challengeHeader: {
    ...flex.rowBetween,
    marginBottom: Theme.spacing.md,
  },

  challengeNumberBadge: {
    backgroundColor: Theme.colors.primary.main,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },

  challengeNumberText: {
    ...createTextStyle("xs", "bold", "inverse"),
  },

  difficultyBadge: {
    ...flex.rowCenter,
    backgroundColor: Theme.colors.warning.main,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs / 2,
    borderRadius: Theme.borderRadius.md,
    gap: 2,
  },

  difficultyText: {
    ...createTextStyle("xs", "bold", "inverse"),
  },

  challengeQuestion: {
    ...createTextStyle("base", "medium", "primary"),
    marginBottom: Theme.spacing.md,
    lineHeight: 22,
  },

  challengeFooter: {
    ...flex.rowBetween,
    alignItems: "center",
  },

  challengeDate: {
    ...createTextStyle("xs", "regular", "secondary"),
  },
}) 
