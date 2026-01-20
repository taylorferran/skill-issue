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
    maxWidth: 430,
    alignSelf: 'center',
    width: '100%',
    backgroundColor: Theme.colors.background.secondary,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Theme.colors.gray[100],
  },
  
  // Header (with blur backdrop effect)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    paddingBottom: Theme.spacing.sm,
    backgroundColor: `${Theme.colors.background.primary}CC`, // 80% opacity
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  accountIcon: {
    backgroundColor: Theme.colors.primary.light,
    borderRadius: Theme.borderRadius.full,
    padding: Theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text.primary,
    letterSpacing: -0.2,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Theme.spacing['5xl'] + 32, // Extra space for bottom nav
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing['2xl'],
  },
  statsContainer: {
    flexDirection: 'row',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing['2xl'],
    paddingBottom: Theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Cards Container
  cardsContainer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
    gap: Theme.spacing.lg,
  },

});
