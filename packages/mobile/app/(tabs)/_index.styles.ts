import { Theme } from "@/theme/Theme";
import { StyleSheet } from "react-native";
import { flex, createTextStyle } from "@/theme/ThemeUtils";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  
  // Header
  header: {
    ...flex.rowBetween,
    paddingHorizontal: Theme.spacing['2xl'],
    paddingVertical: Theme.spacing.lg,
    backgroundColor: Theme.colors.background.primary,
  },
  headerButton: {
    width: Theme.spacing['4xl'] - 8,
    height: Theme.spacing['4xl'] - 8,
    borderRadius: (Theme.spacing['4xl'] - 8) / 2,
    backgroundColor: Theme.colors.background.secondary,
    ...flex.center,
    ...Theme.shadows.card,
  },
  headerTitle: {
    ...createTextStyle('xl', 'bold', 'primary'),
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Theme.spacing['5xl'],
  },

  // Search Bar
  searchContainer: {
    paddingHorizontal: Theme.spacing['2xl'],
    paddingVertical: Theme.spacing.lg,
  },
  searchBar: {
    ...flex.rowCenter,
    height: Theme.spacing['4xl'] + 8,
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.medium,
    ...Theme.shadows.card,
  },
  searchIcon: {
    paddingLeft: Theme.spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
    paddingHorizontal: Theme.spacing.lg,
  },

  // Cards Container
  cardsContainer: {
    paddingHorizontal: Theme.spacing['2xl'],
    gap: Theme.spacing.xl,
  },

  // Card
  card: {
    backgroundColor: Theme.colors.background.secondary,
    padding: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: Theme.colors.primary.medium,
    ...Theme.shadows.card,
    gap: Theme.spacing.lg,
  },
  cardPrimary: {
    ...Theme.shadows.primaryCard,
  },

  // Card Header
  cardHeader: {
    ...flex.rowBetween,
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flex: 1,
    gap: Theme.spacing.xs,
  },
  badgeContainer: {
    ...flex.row,
    gap: Theme.spacing.sm,
    flexWrap: 'wrap',
  },
  badgeSubtopics: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs / 2,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.primary.medium,
  },
  badgeText: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.primary.main,
    letterSpacing: Theme.typography.letterSpacing.wide,
  },
  badgeAI: {
    ...flex.rowCenter,
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs / 2,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.primary.medium,
  },
  badgeAIText: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.primary.main,
    letterSpacing: Theme.typography.letterSpacing.wide,
  },
  cardTitle: {
    ...createTextStyle('xl', 'bold', 'primary'),
    marginTop: Theme.spacing.xs,
  },
  iconContainer: {
    width: Theme.spacing['4xl'],
    height: Theme.spacing['4xl'],
    borderRadius: Theme.borderRadius.xl,
    backgroundColor: Theme.colors.primary.medium,
    ...flex.center,
  },

  // Card Description
  cardDescription: {
    ...createTextStyle('sm', 'regular', 'secondary'),
    lineHeight: Theme.typography.lineHeight.tight,
  },

  // Select Button
  selectButton: {
    ...flex.rowCenter,
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    height: Theme.spacing['3xl'] + 12,
    borderRadius: Theme.borderRadius.xl,
  },
  selectButtonPrimary: {
    backgroundColor: Theme.colors.primary.main,
    ...Theme.shadows.primaryCard,
  },
  selectButtonSecondary: {
    backgroundColor: Theme.colors.background.primary,
  },
  selectButtonText: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
  },
  selectButtonTextPrimary: {
    color: Theme.colors.text.inverse,
  },

  // Bottom Navigation
  bottomNav: {
    ...flex.row,
    justifyContent: 'space-around',
    alignItems: 'center',
    height: Theme.spacing['5xl'] - 48,
    backgroundColor: Theme.colors.background.secondary,
    borderTopWidth: Theme.borderWidth.thin,
    borderTopColor: Theme.colors.primary.light,
    paddingBottom: Theme.spacing.sm,
  },
  navItem: {
    ...flex.center,
    gap: Theme.spacing.xs,
  },
  navTextActive: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.primary.main,
    letterSpacing: Theme.typography.letterSpacing.wide,
  },
  navTextInactive: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.secondary,
    letterSpacing: Theme.typography.letterSpacing.wide,
  },

  // Decorative Accents (simplified for React Native)
  accentTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: Theme.colors.primary.light,
    opacity: Theme.opacity.medium,
    zIndex: -1,
  },
  accentBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: Theme.colors.primary.medium,
    opacity: Theme.opacity.medium,
    zIndex: -1,
  },
});
