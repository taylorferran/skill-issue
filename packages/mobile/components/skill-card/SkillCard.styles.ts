import { StyleSheet } from 'react-native';
import { Theme } from '@/theme/Theme';

export const styles = StyleSheet.create({
  // Wrapper maintains spacing in the list
  cardWrapper: {
    marginBottom: Theme.spacing.md,
  },
  
  // Card container - fixed position in layout, overflow hidden
  cardContainer: {
    position: 'relative',
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: Theme.colors.gray[100],
    overflow: 'hidden',
    padding: Theme.spacing.xl,
    ...Theme.shadows.skillCard,
  },
  
  // Delete button layer - positioned on the right side
  deleteLayer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: Theme.colors.error.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Delete button container
  deleteButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.sm,
  },
  
  // Delete button
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Delete text
  deleteText: {
    color: Theme.colors.text.inverse,
    fontSize: 11,
    fontWeight: '600',
    marginTop: Theme.spacing.xs,
  },
  
  // Content layer - slides over the delete layer
  contentLayer: {
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    gap: Theme.spacing.lg,
  },
  
  // Touchable content area
  contentTouchable: {
    gap: Theme.spacing.lg,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Theme.spacing.lg,
  },
  info: {
    flex: 1,
    gap: Theme.spacing.xs,
  },
  level: {
    color: Theme.colors.primary.main,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  name: {
    color: Theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  category: {
    color: Theme.colors.gray[500],
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: -0.2,
    lineHeight: 14,
  },
  badgeContainer: {
    marginTop: Theme.spacing.sm,
  },
  iconWrapper: {
    position: 'relative',
  },
  iconContainer: {
    backgroundColor: Theme.colors.primary.main,
    width: 64,
    height: 64,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  iconTouchable: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  deleteIconOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  pendingBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Theme.colors.error.main,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Theme.colors.background.secondary,
    zIndex: 10,
  },
  pendingBadgeText: {
    color: Theme.colors.text.inverse,
    fontSize: 10,
    fontWeight: Theme.typography.fontWeight.bold,
  },
  
  // Legacy styles (kept for compatibility)
  wrapper: {
    position: 'relative',
    marginBottom: Theme.spacing.md,
  },
  deleteContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.error.main,
    borderRadius: Theme.borderRadius.xl,
  },
  deleteButtonLarge: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  container: {
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: Theme.colors.gray[100],
    padding: Theme.spacing.xl,
    gap: Theme.spacing.lg,
    ...Theme.shadows.skillCard,
    position: 'relative',
  },
  cardContent: {
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: Theme.colors.gray[100],
    padding: Theme.spacing.xl,
    gap: Theme.spacing.lg,
    ...Theme.shadows.skillCard,
  },
  animatedContainer: {
    position: 'relative',
  },
});
