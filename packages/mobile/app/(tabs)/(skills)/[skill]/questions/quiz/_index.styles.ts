import { Theme } from "@/theme/Theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing["2xl"],
    paddingBottom: Theme.spacing.sm,
  },

  headerCenter: {
    alignItems: "center",
  },

  timerText: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
  },

  timerLabel: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: Theme.typography.letterSpacing.wide,
    marginTop: Theme.spacing.xs / 2,
  },

  // Progress Bar
  progressContainer: {
    paddingHorizontal: Theme.spacing["2xl"],
    paddingVertical: Theme.spacing.lg,
  },

  progressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: Theme.colors.timeline.trackInactive,
    borderRadius: 3,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing["2xl"],
  },

  // Question Section
  questionSection: {
    paddingVertical: Theme.spacing["2xl"],
  },

  questionText: {
    fontSize: Theme.typography.fontSize.xl,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    lineHeight: Theme.typography.lineHeight.normal,
    marginBottom: Theme.spacing["2xl"],
  },

  // Code Container
  codeContainer: {
    backgroundColor: Theme.colors.surface.light,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.medium,
    ...Theme.shadows.card,
  },

  codeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },

  codeFileName: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: Theme.typography.letterSpacing.wide,
  },

  codeDots: {
    flexDirection: "row",
    gap: Theme.spacing.xs / 2,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.settings.progressBarBg,
  },

  codeContent: {
    paddingVertical: Theme.spacing.sm,
  },

  codeText: {
    fontSize: Theme.typography.fontSize.sm,
    lineHeight: Theme.typography.lineHeight.tight,
    color: Theme.colors.text.primary,
    fontFamily: "monospace",
  },

  codePink: {
    color: "#EC4899",
  },

  codeBlue: {
    color: "#3B82F6",
  },

  codeOrange: {
    color: "#F97316",
  },

  // Result Banner
  resultBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.md,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
    marginBottom: Theme.spacing.lg,
  },

  resultBannerCorrect: {
    backgroundColor: Theme.colors.success.light,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.success.main,
  },

  resultBannerIncorrect: {
    backgroundColor: Theme.colors.accent.orangeLight,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.accent.orange,
  },

  resultBannerContent: {
    flex: 1,
  },

  resultBannerTitle: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs / 2,
  },

  resultBannerText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
  },

  // Answer Options
  answersContainer: {
    gap: Theme.spacing.lg,
    marginTop: Theme.spacing.sm,
  },

  answerWrapper: {
    gap: Theme.spacing.sm,
  },

  answerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.medium,
    backgroundColor: Theme.colors.background.secondary,
    padding: Theme.spacing.xl,
  },

  answerOptionSelected: {
    borderWidth: 2,
    borderColor: Theme.colors.accent.orange,
    backgroundColor: Theme.colors.accent.orangeLight,
  },

  answerOptionCorrect: {
    borderWidth: 2,
    borderColor: Theme.colors.success.main,
    backgroundColor: Theme.colors.success.light,
  },

  answerOptionIncorrect: {
    borderWidth: 2,
    borderColor: Theme.colors.accent.orange,
    backgroundColor: Theme.colors.accent.orangeLight,
  },

  answerContent: {
    flex: 1,
  },

  answerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
  },

  answerLabel: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.settings.progressBarBg,
    alignItems: "center",
    justifyContent: "center",
  },

  answerLabelSelected: {
    borderWidth: 2,
    borderColor: Theme.colors.accent.orange,
  },

  answerLabelCorrect: {
    borderWidth: 2,
    borderColor: Theme.colors.success.main,
    backgroundColor: Theme.colors.success.main,
  },

  answerLabelIncorrect: {
    borderWidth: 2,
    borderColor: Theme.colors.accent.orange,
    backgroundColor: Theme.colors.accent.orange,
  },

  answerLabelText: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.secondary,
  },

  answerLabelTextSelected: {
    color: Theme.colors.accent.orange,
  },

  answerLabelTextCorrect: {
    color: Theme.colors.text.inverse,
  },

  answerLabelTextIncorrect: {
    color: Theme.colors.text.inverse,
  },

  answerText: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
  },

  answerExplanation: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    marginLeft: 36,
  },

  // Explanation Card
  explanationCard: {
    backgroundColor: Theme.colors.primary.light,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.border,
  },

  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },

  explanationTitle: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
  },

  explanationText: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    lineHeight: Theme.typography.lineHeight.tight,
  },

  // Feedback Section
  feedbackSection: {
    marginTop: Theme.spacing["3xl"],
    padding: Theme.spacing.xl,
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.medium,
    ...Theme.shadows.card,
  },

  feedbackTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    textAlign: "center",
    marginBottom: Theme.spacing.xs,
  },

  feedbackSubtitle: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: Theme.spacing["2xl"],
  },

  feedbackRating: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },

  ratingButton: {
    alignItems: "center",
    gap: Theme.spacing.xs,
    padding: Theme.spacing.sm,
  },

  ratingButtonSelected: {
    transform: [{ scale: 1.1 }],
  },

  ratingText: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.secondary,
  },

  ratingTextSelected: {
    color: Theme.colors.primary.main,
  },

  // Bottom Bar
  bottomBar: {
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Theme.spacing["2xl"],
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing["3xl"],
  },

  submitButton: {
    backgroundColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.xl,
    paddingVertical: Theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.sm,
    ...Theme.shadows.primaryCard,
  },

  submitButtonDisabled: {
    opacity: Theme.opacity.medium,
  },

  submitButtonText: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
  },
});


