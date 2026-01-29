import { Theme } from "@/theme/Theme";
import { createTextStyle } from "@/theme/ThemeUtils";
import { StyleSheet } from "react-native"; 

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  
  // App Bar
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.background.primary,
  },
  appBarTitle: {
    ...createTextStyle('lg', 'bold', 'primary'),
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing['2xl'],
    minHeight: 200,
  },
  loadingText: {
    ...createTextStyle('sm', 'regular', 'secondary'),
    marginTop: Theme.spacing.md,
  },
  
  // Assessment Card
  assessmentCard: {
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.medium,
    overflow: 'hidden',
    ...Theme.shadows.card,
  },
  assessmentBanner: {
    height: 128,
    backgroundColor: Theme.colors.success.light,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
  },
  bannerIconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assessmentContent: {
    padding: Theme.spacing['2xl'],
  },
  assessmentLabel: {
    ...createTextStyle('xs', 'bold', 'secondary'),
    letterSpacing: Theme.typography.letterSpacing.wide,
    marginBottom: Theme.spacing.xs,
  },
  assessmentTitle: {
    ...createTextStyle('lg', 'bold', 'primary'),
    marginBottom: Theme.spacing.sm,
  },
  assessmentDescription: {
    ...createTextStyle('sm', 'regular', 'secondary'),
    lineHeight: Theme.typography.lineHeight.tight,
    marginBottom: Theme.spacing.lg,
  },
  assessmentButton: {
    marginTop: Theme.spacing.sm,
  },
  assessmentButtonText: {
    ...createTextStyle('sm', 'bold', 'primary'),
  },
  
  // Segmented Control
  segmentedContainer: {
    paddingVertical: Theme.spacing.md,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.primary.medium,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xs,
    height: 44,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.sm,
  },
  segmentButtonActive: {
    backgroundColor: Theme.colors.background.secondary,
    ...Theme.shadows.card,
  },
  segmentButtonText: {
    ...createTextStyle('sm', 'bold', 'secondary'),
  },
  segmentButtonTextActive: {
    color: Theme.colors.text.primary,
  },
  
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Theme.spacing.lg,
    paddingBottom: Theme.spacing.sm,
  },
  sectionTitle: {
    ...createTextStyle('lg', 'bold', 'primary'),
  },
  filterText: {
    ...createTextStyle('sm', 'bold', 'primary'),
    color: Theme.colors.primary.main,
  },
  
  // History List
  historyList: {
    backgroundColor: Theme.colors.background.secondary,
    padding: Theme.spacing["2xl"],
  },
  
  // Test Buttons
  testButtonsContainer: {
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xl,
    borderBottomWidth: Theme.borderWidth.thin,
    borderBottomColor: Theme.colors.primary.medium,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary.light,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: Theme.borderWidth.medium,
    borderColor: Theme.colors.primary.border,
    padding: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },
  testButtonSingle: {
    borderColor: Theme.colors.success.main,
    backgroundColor: Theme.colors.success.light,
  },
  testButtonMultiple: {
    borderColor: Theme.colors.accent.teal,
    backgroundColor: Theme.colors.accent.tealLight,
  },
  testButtonText: {
    ...createTextStyle('base', 'bold', 'primary'),
  },
  testButtonSubtext: {
    ...createTextStyle('xs', 'regular', 'secondary'),
    marginTop: Theme.spacing.xs / 2,
  },
  
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    minHeight: 80,
  },
  historyItemBorder: {
    borderBottomWidth: Theme.borderWidth.thin,
    borderBottomColor: Theme.colors.primary.medium,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.lg,
  },
  iconContainerSuccess: {
    backgroundColor: Theme.colors.success.light,
  },
  iconContainerError: {
    backgroundColor: Theme.colors.primary.light,
  },
  historyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  questionText: {
    ...createTextStyle('base', 'bold', 'primary'),
    marginBottom: Theme.spacing.xs,
  },
  historyMeta: {
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs / 2,
  },
  statusBadgeText: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  statusBadgeTextSuccess: {
    color: '#16A34A', // Emerald-600
  },
  statusBadgeTextError: {
    color: '#EA580C', // Orange-600
  },
  timestampText: {
    ...createTextStyle('xs', 'medium', 'secondary'),
  },
  
  // Bottom Illustration
  bottomIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing['4xl'],
    paddingHorizontal: Theme.spacing['3xl'],
    opacity: Theme.opacity.medium,
  },
  illustrationText: {
    ...createTextStyle('xs', 'medium', 'secondary'),
    textAlign: 'center',
    lineHeight: Theme.typography.lineHeight.tight,
    marginTop: Theme.spacing.sm,
    fontStyle: 'italic',
  },
  
  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    backgroundColor: Theme.colors.background.secondary,
    borderTopWidth: Theme.borderWidth.thin,
    borderTopColor: Theme.colors.primary.medium,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing['2xl'],
    height: 80,
  },
  tab: {
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  tabTextActive: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.primary.main,
    letterSpacing: -0.5,
  },
  tabTextInactive: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.secondary,
    letterSpacing: -0.5,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 6,
    left: '50%',
    marginLeft: -64,
    width: 128,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
  },
});
