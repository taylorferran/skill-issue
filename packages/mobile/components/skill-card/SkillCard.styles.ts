import { StyleSheet } from 'react-native';
import { Theme } from '@/theme/Theme';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: Theme.colors.gray[100],
    padding: Theme.spacing.xl,
    gap: Theme.spacing.lg,
    ...Theme.shadows.skillCard,
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
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});