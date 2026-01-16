import { Theme } from "@/theme/Theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.primary,
  },
  contentContainer: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing['4xl'],
  },
  
  // Progress Card
  progressCard: {
    backgroundColor: Theme.colors.background.secondary,
    padding: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: Theme.spacing['2xl'],
  },
  progressLabel: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.accent.teal,
    letterSpacing: Theme.typography.letterSpacing.wide,
    marginBottom: Theme.spacing.xs,
  },
  progressTitle: {
    fontSize: Theme.typography.fontSize['2xl'],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
  },
  gradeNumber: {
    fontSize: Theme.typography.fontSize['3xl'],
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
  },
  gradeMax: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.secondary,
  },
  progressBarBackground: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: Theme.borderRadius.lg,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Theme.colors.accent.teal,
    borderRadius: Theme.borderRadius.lg,
  },
  progressMessage: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.secondary,
    fontStyle: 'italic',
  },

  // Bento Grid
  bentoGrid: {
    gap: Theme.spacing.lg,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Theme.spacing.lg,
  },

  // Regular Cards
  card: {
    flex: 1,
    backgroundColor: Theme.colors.background.secondary,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'space-between',
    aspectRatio: 1,
  },
  cardContent: {
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: Theme.typography.fontSize.sm,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    lineHeight: Theme.typography.lineHeight.tight,
  },
  cardGradeSmall: {
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.xs,
  },
  assessButton: {
    backgroundColor: Theme.colors.accent.orange,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
  },
  assessButtonTextSmall: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.inverse,
    letterSpacing: Theme.typography.letterSpacing.wide,
  },

  // Large Card
  cardLarge: {
    backgroundColor: Theme.colors.background.secondary,
    padding: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: Theme.borderWidth.thin,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    marginVertical: Theme.spacing.sm,
  },
  iconContainerLarge: {
    width: 56,
    height: 56,
    borderRadius: Theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleLarge: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
    lineHeight: Theme.typography.lineHeight.tight,
  },
  cardGrade: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.xs,
  },
  assessButtonLarge: {
    backgroundColor: Theme.colors.accent.orange,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assessButtonText: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.inverse,
    letterSpacing: Theme.typography.letterSpacing.wide,
  },

  // AI Promo Card
  aiPromoCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing['2xl'],
    backgroundColor: Theme.colors.accent.teal,
    marginTop: Theme.spacing['2xl'],
  },
  aiPromoCircle1: {
    position: 'absolute',
    right: -32,
    bottom: -32,
    width: 128,
    height: 128,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 64,
    opacity: 0.5,
  },
  aiPromoCircle2: {
    position: 'absolute',
    right: -16,
    top: -16,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 111, 0, 0.2)',
    borderRadius: 40,
    opacity: 0.5,
  },
  aiPromoContent: {
    position: 'relative',
    zIndex: 10,
  },
  aiPromoTitle: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.inverse,
    marginBottom: Theme.spacing.xs,
  },
  aiPromoDescription: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.inverse,
    opacity: 0.9,
    marginBottom: Theme.spacing.lg,
  },
  aiPromoButton: {
    backgroundColor: Theme.colors.background.secondary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.lg,
    alignSelf: 'flex-start',
  },
  aiPromoButtonText: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.accent.teal,
  },
});

