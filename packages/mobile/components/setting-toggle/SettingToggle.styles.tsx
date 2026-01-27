import { StyleSheet } from 'react-native';
import { Theme } from '@/theme/Theme';
import { createTextStyle } from '@/theme/ThemeUtils';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.background.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
    gap: Theme.spacing.lg,
    ...Theme.shadows.card,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    ...createTextStyle('base', 'bold', 'primary'),
  },
  subtitle: {
    ...createTextStyle('xs', 'regular', 'secondary'),
    marginTop: Theme.spacing.xs / 2,
  },
});
