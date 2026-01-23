import { StyleSheet } from 'react-native';
import { Theme } from '@/theme/Theme';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: Theme.spacing['2xl'],
  },
  label: {
    color: Theme.colors.gray[400],
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  percentage: {
    color: Theme.colors.primary.main,
    fontSize: 12,
    fontWeight: '900',
  },
  track: {
    width: '100%',
    backgroundColor: Theme.colors.gray[100],
    borderRadius: Theme.borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: Theme.colors.primary.main,
    borderRadius: Theme.borderRadius.full,
  },
});