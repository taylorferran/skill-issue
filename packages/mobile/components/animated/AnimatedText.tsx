import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { Theme } from '@/theme/Theme';

interface AnimatedTextProps {
  value: string | number | null | undefined;
  fallback?: string;
  style?: StyleProp<TextStyle>;
}

export function AnimatedText({
  value,
  fallback = '—',
  style,
}: AnimatedTextProps) {
  const displayValue = value !== null && value !== undefined ? value : fallback;
  const hasValue = value !== null && value !== undefined && value !== '';

  return (
    <Text
      style={[
        {
          color: hasValue ? Theme.colors.text.primary : Theme.colors.text.secondary,
        },
        style,
      ]}
    >
      {displayValue}
    </Text>
  );
}
