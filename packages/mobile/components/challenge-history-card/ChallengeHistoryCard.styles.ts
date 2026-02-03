import { Theme } from "@/theme/Theme";
import { createTextStyle } from "@/theme/ThemeUtils";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Main card container
  card: {
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    marginBottom: Theme.spacing.md,
    overflow: "hidden",
    ...Theme.shadows.card,
  },
  
  // Collapsed header (always visible)
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },
  
  // Icon container for correct/incorrect
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerSuccess: {
    backgroundColor: Theme.colors.success.light,
  },
  iconContainerError: {
    backgroundColor: Theme.colors.primary.light,
  },
  
  // Header content area
  headerContent: {
    flex: 1,
    gap: Theme.spacing.xs,
  },
  
  // Question text (collapsed)
  questionTextCollapsed: {
    ...createTextStyle("sm", "medium", "primary"),
    lineHeight: 20,
  },
  
  // Meta row with status and timestamp
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  
  // Status badge
  statusBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  statusBadgeSuccess: {
    backgroundColor: Theme.colors.success.light,
  },
  statusBadgeError: {
    backgroundColor: Theme.colors.primary.light,
  },
  statusBadgeText: {
    ...createTextStyle("xs", "bold", "primary"),
    fontSize: 10,
  },
  statusBadgeTextSuccess: {
    color: Theme.colors.success.main,
  },
  statusBadgeTextError: {
    color: Theme.colors.primary.main,
  },
  
  // Timestamp
  timestampText: {
    ...createTextStyle("xs", "regular", "secondary"),
  },
  
  // Expand/collapse icon
  expandIcon: {
    marginLeft: Theme.spacing.sm,
  },
  
  // Expanded content area
  expandedContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.lg,
    paddingTop: Theme.spacing.xs,
  },
  
  // Divider line
  divider: {
    height: 1,
    backgroundColor: Theme.colors.primary.medium,
    marginVertical: Theme.spacing.md,
  },
  
  // Full question text
  questionTextFull: {
    ...createTextStyle("base", "medium", "primary"),
    lineHeight: 24,
    marginBottom: Theme.spacing.md,
  },
  
  // Options container
  optionsContainer: {
    gap: Theme.spacing.sm,
  },
  
  // Individual option
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.background.primary,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: Theme.borderWidth.medium,
    borderColor: Theme.colors.primary.medium,
    padding: Theme.spacing.md,
    minHeight: 48,
  },
  
  // Option states
  optionSelected: {
    backgroundColor: Theme.colors.primary.light,
    borderColor: Theme.colors.primary.main,
    borderWidth: Theme.borderWidth.thick,
  },
  optionCorrect: {
    backgroundColor: Theme.colors.success.light,
    borderColor: Theme.colors.success.main,
    borderWidth: Theme.borderWidth.thick,
  },
  optionIncorrect: {
    backgroundColor: Theme.colors.primary.light,
    borderColor: Theme.colors.primary.main,
    borderWidth: Theme.borderWidth.thick,
  },
  
  // Option text
  optionText: {
    ...createTextStyle("sm", "medium", "primary"),
    flex: 1,
    marginRight: Theme.spacing.sm,
    lineHeight: 20,
  },
  optionTextSelected: {
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.primary.main,
  },
  optionTextCorrect: {
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.success.main,
  },
  optionTextIncorrect: {
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.primary.main,
  },
  
  // Option label (A, B, C, D)
  optionLabel: {
    ...createTextStyle("xs", "bold", "secondary"),
    width: 24,
    textAlign: "center",
  },
  
  // Labels row
  optionContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  
  // Explanation section
  explanationSection: {
    marginTop: Theme.spacing.md,
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.background.primary,
    borderRadius: Theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary.main,
  },
  explanationTitle: {
    ...createTextStyle("xs", "bold", "secondary"),
    marginBottom: Theme.spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  explanationText: {
    ...createTextStyle("sm", "regular", "secondary"),
    lineHeight: 20,
  },
  
  // Stats row (response time, confidence)
  statsRow: {
    flexDirection: "row",
    gap: Theme.spacing.lg,
    marginTop: Theme.spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.xs,
  },
  statText: {
    ...createTextStyle("xs", "regular", "secondary"),
  },
  
  // Difficulty badge
  difficultyBadge: {
    position: "absolute",
    top: Theme.spacing.md,
    right: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.gray[200],
  },
  difficultyText: {
    ...createTextStyle("xs", "bold", "secondary"),
    fontSize: 10,
  },
});
