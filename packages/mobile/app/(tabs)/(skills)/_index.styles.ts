import { Theme } from "@/theme/Theme";
import { StyleSheet } from "react-native";
import { flex, createTextStyle } from "@/theme/ThemeUtils";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  innerContainer: {
    flex: 1,
    alignSelf: "center",
    width: "100%",
    backgroundColor: Theme.colors.background.secondary,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Theme.colors.gray[100],
  },
  // Segmented Control
  segmentedContainer: {
    paddingVertical: Theme.spacing.md,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: Theme.colors.primary.medium,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xs,
    height: 44,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.sm,
  },
  segmentButtonActive: {
    backgroundColor: Theme.colors.background.secondary,
    ...Theme.shadows.card,
  },
  segmentButtonText: {
    ...createTextStyle("sm", "bold", "secondary"),
  },
  segmentButtonTextActive: {
    color: Theme.colors.text.primary,
  },

  // Header (with blur backdrop effect)
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    paddingBottom: Theme.spacing.sm,
    backgroundColor: `${Theme.colors.background.primary}CC`,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  accountIcon: {
    backgroundColor: Theme.colors.primary.light,
    borderRadius: Theme.borderRadius.full,
    padding: Theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.text.primary,
    letterSpacing: -0.2,
  },
  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Theme.spacing["5xl"] + 32,
  },
  // Stats Section
  statsSection: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing["2xl"],
  },
  statsContainer: {
    flexDirection: "row",
    gap: Theme.spacing.lg,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: Theme.colors.gray[100],
    marginHorizontal: Theme.spacing.lg,
  },
  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing["2xl"],
    paddingBottom: Theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.text.primary,
    letterSpacing: -0.2,
  },
  sortBadge: {
    backgroundColor: Theme.colors.primary.light,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs / 2,
    borderRadius: Theme.borderRadius.sm,
  },
  sortBadgeText: {
    color: Theme.colors.primary.main,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  // Cards Container (Current Skills)
  cardsContainer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
    gap: Theme.spacing.lg,
  },

  // ============= NEW SKILLS GRID =============
  newSkillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Theme.spacing.lg,
    justifyContent: "flex-start", // Keeps items left-aligned
    gap: Theme.spacing.lg,
    paddingBottom: Theme.spacing["3xl"],
  },
  newSkillCard: {
    width: "47%", // 2 columns with gap
    backgroundColor: Theme.colors.card.background,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.card.border,
    padding: Theme.spacing.lg,
    ...Theme.shadows.skillCard,
    minHeight: 200, // Increased from 160
    justifyContent: "space-between",
  },
  newSkillIconContainer: {
    width: 56, // Increased from 48
    height: 56, // Increased from 48
    backgroundColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.spacing.lg,
  },
  newSkillName: {
    fontSize: Theme.typography.fontSize.lg, // Increased from base
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
    letterSpacing: -0.3,
  },
  newSkillDescription: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: Theme.spacing.md,
  },

  // ============= ADD SKILL BUTTON (on each card) =============
  addSkillButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Theme.spacing.xs + 2, // Smaller padding
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.primary.main,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.border,
    gap: 4,
    alignSelf: "stretch", // Full width
  },
  addSkillButtonText: {
    fontSize: 11, // Smaller font
    fontWeight: Theme.typography.fontWeight.bold,
    color: "white",
    letterSpacing: 0.2,
  },

  // ============= EMPTY STATE =============
  emptyState: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Theme.spacing["4xl"],
  },
  emptyStateText: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.secondary,
  },

  // ============= LOADING & ERROR STATES =============
  loadingContainer: {
    ...flex.center,
    padding: Theme.spacing["2xl"],
    gap: Theme.spacing.md,
  },
  loadingText: {
    ...createTextStyle("base", "medium", "secondary"),
  },
  errorContainer: {
    ...flex.center,
    padding: Theme.spacing["2xl"],
    backgroundColor: Theme.colors.background.tertiary,
    borderRadius: Theme.borderRadius.md,
    margin: Theme.spacing.lg,
  },
  errorText: {
    ...createTextStyle("base", "bold", "primary"),
    textAlign: "center",
    color: "#ef4444", // Red color for errors
  },

  // ============= DISABLED BUTTON STATE =============
  addSkillButtonDisabled: {
    opacity: 0.5,
  },

  // ============= SEARCH INPUT =============
  searchContainer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.gray[200],
    paddingHorizontal: Theme.spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.regular,
    color: Theme.colors.text.primary,
    height: "100%",
  },
  clearButton: {
    padding: Theme.spacing.xs,
    marginLeft: Theme.spacing.sm,
  },

  // ============= CREATE SKILL BUTTON =============
  createSkillButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.card.border,
    padding: Theme.spacing.md,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.subtle,
  },
  createSkillIconContainer: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.primary.main,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Theme.spacing.md,
  },
  createSkillTextContainer: {
    flex: 1,
  },
  createSkillTitle: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  createSkillSubtitle: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.regular,
    color: Theme.colors.text.secondary,
  },
});
