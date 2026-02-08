import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '@/theme/Theme';

interface NeedsCalibrationBadgeProps {
  visible?: boolean;
}

export function NeedsCalibrationBadge({ visible = true }: NeedsCalibrationBadgeProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Needs Calibration</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.warning.main,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    color: Theme.colors.text.inverse,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
