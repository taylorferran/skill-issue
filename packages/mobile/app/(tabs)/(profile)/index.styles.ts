import { Theme } from "@/theme/Theme";
import { createTextStyle } from "@/theme/ThemeUtils";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  contentContainer: {
    paddingHorizontal: Theme.spacing["2xl"],
    paddingBottom: Theme.spacing["4xl"],
  },

  // Profile Header
  profileHeader: {
    alignItems: "center",
    paddingTop: Theme.spacing["2xl"],
    paddingBottom: Theme.spacing["3xl"],
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: Theme.colors.background.secondary,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Theme.colors.primary.main,
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: Theme.colors.background.primary,
  },
  profileInfo: {
    alignItems: "center",
    marginTop: Theme.spacing.lg,
  },
  profileName: {
    ...createTextStyle("2xl", "bold", "primary"),
    textAlign: "center",
  },
  badgesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.xs,
  },
  proBadge: {
    backgroundColor: Theme.colors.primary.medium,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs / 2,
    borderRadius: Theme.borderRadius.xl,
  },
  proBadgeText: {
    ...createTextStyle("xs", "bold", "primary"),
    color: Theme.colors.primary.main,
    letterSpacing: Theme.typography.letterSpacing.wide,
  },
  levelText: {
    ...createTextStyle("sm", "medium", "secondary"),
  },

  // AI Stats Card
  aiStatsCard: {
    backgroundColor: Theme.colors.background.tertiary,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing["3xl"],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: Theme.borderWidth.thin,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  aiStatsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.md,
    flex: 1,
  },
  aiIconContainer: {
    backgroundColor: Theme.colors.primary.border,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg,
  },
  aiStatsLabel: {
    ...createTextStyle("xs", "bold", "secondary"),
    letterSpacing: Theme.typography.letterSpacing.wide * 1.5,
  },
  aiStatsTitle: {
    ...createTextStyle("sm", "bold", "primary"),
    marginTop: Theme.spacing.xs / 2,
  },
  aiStatsRight: {
    alignItems: "flex-end",
  },
  aiStatsPercentage: {
    ...createTextStyle("xs", "bold", "primary"),
    color: Theme.colors.primary.main,
  },
  progressBarContainer: {
    width: 64,
    height: 6,
    backgroundColor: Theme.colors.settings.progressBarBg,
    borderRadius: Theme.borderRadius.xl,
    marginTop: Theme.spacing.xs,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.xl,
  },

  // Sections
  section: {
    marginBottom: Theme.spacing["4xl"],
  },
  sectionTitle: {
    ...createTextStyle("sm", "bold", "primary"),
    letterSpacing: Theme.typography.letterSpacing.wide * 1.5,
    paddingHorizontal: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  settingsGroup: {
    gap: Theme.spacing.md,
  },

  // Logout Button
  logoutButtonContainer: {
    marginTop: Theme.spacing["2xl"],
    marginBottom: Theme.spacing["4xl"],
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing["2xl"],
    borderRadius: Theme.borderRadius.xl,
    gap: Theme.spacing.sm,
    shadowColor: Theme.colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  logoutButtonText: {
    ...createTextStyle("lg", "bold", "inverse"),
    fontSize: 18,
  },

  // Footer
  footer: {
    alignItems: "center",
    gap: Theme.spacing.lg,
  },
  versionText: {
    ...createTextStyle("xs", "medium", "secondary"),
    letterSpacing: Theme.typography.letterSpacing.wide * 1.5,
  },
  footerIcons: {
    flexDirection: "row",
    gap: Theme.spacing.lg,
  },
  bottomPadding: {
    height: Theme.spacing["4xl"],
  },

  // Quiet Hours
  quietHoursHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  quietHoursContainer: {
    gap: Theme.spacing.md,
  },

  quietHoursDisabledText: {
    ...createTextStyle("sm", "medium", "secondary"),
    flex: 1,
    flexWrap: "wrap",
  },
  sliderContainer: {
    gap: Theme.spacing.sm,
  },
  sliderLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderLabel: {
    ...createTextStyle("sm", "medium", "primary"),
  },
  sliderValue: {
    ...createTextStyle("sm", "bold", "primary"),
    color: Theme.colors.primary.main,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderDivider: {
    height: 1,
    backgroundColor: Theme.colors.primary.light,
    marginVertical: Theme.spacing.md,
  },
  quietHoursInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.sm,
  },
  quietHoursInfoText: {
    ...createTextStyle("xs", "medium", "secondary"),
    flex: 1,
  },
  // Unified Quiet Hours Card
  quietHoursCard: {
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.medium,
    overflow: "hidden",
    ...Theme.shadows.card,
  },
  quietHoursCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Theme.spacing.lg,
    gap: Theme.spacing.lg,
  },
  quietHoursCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.lg,
    flex: 1,
    flexShrink: 1,
  },
  quietHoursIconContainer: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  quietHoursCardHeaderText: {
    flex: 1,
    flexShrink: 1,
  },
  quietHoursCardTitle: {
    ...createTextStyle("base", "bold", "primary"),
  },
  quietHoursCardSubtitle: {
    ...createTextStyle("xs", "regular", "secondary"),
    marginTop: Theme.spacing.xs / 2,
  },
  switchContainer: {
    overflow: "hidden",
    flexShrink: 0,
  },
  quietHoursCardDivider: {
    height: 1,
    backgroundColor: Theme.colors.primary.light,
    marginHorizontal: Theme.spacing.lg,
  },
  quietHoursDisabledContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.md,
    padding: Theme.spacing.lg,
  },
  quietHoursEnabledContent: {
    padding: Theme.spacing.lg,
  },
  sliderLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.xs,
  },
  sliderIcon: {
    marginRight: Theme.spacing.xs,
  },
  timeBadge: {
    backgroundColor: Theme.colors.primary.medium,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs / 2,
    borderRadius: Theme.borderRadius.lg,
  },
  timeBadgeText: {
    ...createTextStyle("xs", "bold", "primary"),
    color: Theme.colors.primary.main,
  },

  // Dev Button
  devButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.primary.main,
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing["2xl"],
    borderRadius: Theme.borderRadius.xl,
    gap: Theme.spacing.sm,
    shadowColor: Theme.colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  devButtonDisabled: {
    opacity: 0.6,
  },
  devButtonText: {
    ...createTextStyle("base", "bold", "inverse"),
  },

});
