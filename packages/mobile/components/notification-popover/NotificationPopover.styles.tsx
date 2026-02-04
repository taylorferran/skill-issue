import { StyleSheet } from 'react-native';
import { Theme } from '@/theme/Theme';

export const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  popoverContainer: {
    position: 'absolute',
    top: 110,
    right: 16,
    width: 320,
    maxHeight: 400,
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.card,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.gray[200],
    backgroundColor: Theme.colors.background.secondary,
  },
  headerTitle: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.bold,
    color: Theme.colors.text.primary,
  },
  headerCount: {
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text.secondary,
  },
  scrollContainer: {
    maxHeight: 340,
  },
  scrollContent: {
    paddingVertical: Theme.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing['3xl'],
    paddingHorizontal: Theme.spacing.lg,
  },
  emptyStateText: {
    fontSize: Theme.typography.fontSize.lg,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
    marginTop: Theme.spacing.md,
  },
  emptyStateSubtext: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.xs,
    textAlign: 'center',
  },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.gray[100],
    backgroundColor: Theme.colors.background.secondary,
  },
  challengeContent: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
    gap: Theme.spacing.xs,
  },
  skillBadge: {
    backgroundColor: Theme.colors.primary.light,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  skillName: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.primary.main,
  },
  difficultyBadge: {
    backgroundColor: Theme.colors.gray[100],
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  difficultyText: {
    fontSize: Theme.typography.fontSize.xs,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.gray[500],
  },
  questionText: {
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.primary,
    lineHeight: Theme.typography.lineHeight.tight,
  },
  chevron: {
    marginLeft: Theme.spacing.xs,
  },
});
