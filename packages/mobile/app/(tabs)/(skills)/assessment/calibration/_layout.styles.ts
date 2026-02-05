import { StyleSheet } from "react-native";
import { Theme } from "@/theme/Theme";
import { createTextStyle } from "@/theme/ThemeUtils";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7", // iOS background
    maxWidth: 430,
    alignSelf: "center",
    width: "100%",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing["2xl"],
    paddingTop: Theme.spacing.xl,
    paddingBottom: Theme.spacing["3xl"],
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f5f5f7", // iOS background
    justifyContent: "center",
    alignItems: "center",
    padding: Theme.spacing["2xl"],
  },
  loadingText: {
    ...createTextStyle("base", "medium", "secondary"),
    marginTop: Theme.spacing.lg,
    textAlign: "center",
  },
  errorText: {
    ...createTextStyle("base", "medium", "primary"),
    marginTop: Theme.spacing.lg,
    textAlign: "center",
    color: Theme.colors.error.main,
  },
  
  // Progress
  progressSection: {
    marginBottom: Theme.spacing.lg,
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
  
  // Difficulty Badge
  difficultyBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
    gap: Theme.spacing.xs,
  },
  difficultyText: {
    ...createTextStyle("xs", "bold", "primary"),
    color: Theme.colors.text.inverse,
  },
  
  // Buttons
  buttonContainer: {
    marginTop: Theme.spacing.lg,
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
    color: Theme.colors.text.inverse,
  },
  nextButton: {
    backgroundColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: "center",
    marginTop: Theme.spacing.lg,
    ...Theme.shadows.card,
  },
  finishButton: {
    backgroundColor: Theme.colors.success.main,
  },
  nextButtonText: {
    ...createTextStyle("base", "bold", "primary"),
    color: Theme.colors.text.inverse,
  },
  retryButton: {
    backgroundColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.lg,
    marginTop: Theme.spacing.lg,
    ...Theme.shadows.card,
  },
  retryButtonText: {
    ...createTextStyle("base", "bold", "primary"),
    color: Theme.colors.text.inverse,
  },
  
  // Result Container
  resultContainer: {
    marginTop: Theme.spacing.lg,
  },
});
