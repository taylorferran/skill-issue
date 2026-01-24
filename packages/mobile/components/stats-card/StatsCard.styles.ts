import { StyleSheet } from 'react-native';
import { Theme } from '@/theme/Theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 140,
    backgroundColor: Theme.colors.background.secondary,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: Theme.colors.gray[100],
    padding: Theme.spacing.xl,
    gap: Theme.spacing.xs,
    ...Theme.shadows.skillCard,
  },
  label: {
    color: Theme.colors.gray[500],
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  value: {
    color: Theme.colors.primary.main,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
});