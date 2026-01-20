import { Theme } from "@/theme/Theme";
import { createTextStyle } from "@/theme/ThemeUtils";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Container (iOS-style background)
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7", // iOS background
    maxWidth: 430,
    alignSelf: "center",
    width: "100%",
  },

  // Header with close button and timer
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Theme.spacing["2xl"],
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.lg,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: "center",
    ...Theme.shadows.card,
  },
  confirmButtonText: {
    ...createTextStyle("base", "bold", "primary"),
    color: "#FFFFFF",
  },
  // Main Content Area
  mainContent: {
    flex: 1,
    paddingHorizontal: Theme.spacing["2xl"],
    marginTop: Theme.spacing["3xl"],
  },

  // Button Container
  buttonContainer: {
    marginTop: Theme.spacing["3xl"],
  },

  // Footer with progress
  footer: {
    paddingHorizontal: Theme.spacing["2xl"],
    paddingTop: Theme.spacing["3xl"],
    paddingBottom: Theme.spacing.lg,
    gap: Theme.spacing["3xl"],
  },
  progressSection: {
    width: "100%",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: Theme.spacing.sm,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: Theme.colors.gray[500],
  },
  progressPercentage: {
    fontSize: 11,
    fontWeight: "700",
    color: Theme.colors.primary.main,
  },
  progressTrack: {
    height: 6,
    width: "100%",
    backgroundColor: Theme.colors.gray[200],
    borderRadius: Theme.borderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.full,
  },
  homeIndicator: {
    width: 128,
    height: 5,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: Theme.borderRadius.full,
    alignSelf: "center",
  },

  // Mode Indicator (Debug - remove in production)
  modeIndicator: {
    backgroundColor: Theme.colors.warning.light,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.warning.main,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    alignItems: "center",
  },
  modeText: {
    ...createTextStyle("sm", "bold", "primary"),
    color: Theme.colors.warning.main,
  },

  // Timer
  timerContainer: {
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.card,
  },
  timerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  timerText: {
    ...createTextStyle("sm", "bold", "secondary"),
  },
  timerTextWarning: {
    color: Theme.colors.warning.main,
  },
  timerTextTimeUp: {
    color: Theme.colors.primary.main,
  },
  progressBar: {
    height: 8,
    backgroundColor: Theme.colors.primary.medium,
    borderRadius: Theme.borderRadius.full,
    overflow: "hidden",
  },

  // Question Card
  questionCard: {
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing["2xl"],
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.card,
  },
  questionHeader: {
    marginBottom: Theme.spacing.md,
  },
  questionNumber: {
    ...createTextStyle("xs", "bold", "secondary"),
    letterSpacing: Theme.typography.letterSpacing.wide,
    textTransform: "uppercase",
  },
  questionText: {
    ...createTextStyle("lg", "bold", "primary"),
    lineHeight: Theme.typography.lineHeight.normal,
    marginBottom: Theme.spacing["2xl"],
  },
  answersContainer: {
    gap: Theme.spacing.md,
  },
  answerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.background.primary,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: Theme.borderWidth.medium,
    borderColor: Theme.colors.primary.medium,
    padding: Theme.spacing.lg,
    minHeight: 60,
  },
  answerOptionCorrect: {
    backgroundColor: Theme.colors.success.light,
    borderColor: Theme.colors.success.main,
    borderWidth: Theme.borderWidth.thick,
  },
  answerOptionIncorrect: {
    backgroundColor: Theme.colors.primary.light,
    borderColor: Theme.colors.primary.main,
    borderWidth: Theme.borderWidth.thick,
  },
  answerText: {
    ...createTextStyle("base", "medium", "primary"),
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  answerTextCorrect: {
    color: Theme.colors.success.main,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  answerTextIncorrect: {
    color: Theme.colors.primary.main,
  },

  // Result
  resultContainer: {
    marginBottom: Theme.spacing.lg,
  },
  resultCard: {
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing["2xl"],
    borderWidth: Theme.borderWidth.thick,
    ...Theme.shadows.card,
  },
  resultCardSuccess: {
    borderColor: Theme.colors.success.main,
  },
  resultCardError: {
    borderColor: Theme.colors.primary.main,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },
  resultIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Theme.borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  resultIconContainerSuccess: {
    backgroundColor: Theme.colors.success.light,
  },
  resultIconContainerError: {
    backgroundColor: Theme.colors.primary.light,
  },
  resultTitle: {
    ...createTextStyle("xl", "bold", "primary"),
  },
  resultExplanation: {
    ...createTextStyle("base", "regular", "secondary"),
    lineHeight: Theme.typography.lineHeight.relaxed,
    marginBottom: Theme.spacing.xl,
  },
  continueButton: {
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: "center",
    ...Theme.shadows.card,
  },
  continueButtonSuccess: {
    backgroundColor: Theme.colors.success.main,
  },
  continueButtonError: {
    backgroundColor: Theme.colors.primary.main,
  },
  continueButtonText: {
    ...createTextStyle("base", "bold", "primary"),
    color: "#FFFFFF",
  },

  // Finish Button
  finishButton: {
    backgroundColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: "center",
    marginTop: Theme.spacing.lg,
    ...Theme.shadows.card,
  },
  finishButtonText: {
    ...createTextStyle("base", "bold", "primary"),
    color: "#FFFFFF",
  },
});
