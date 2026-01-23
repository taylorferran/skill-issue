import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './MonogramBackground.styles';

interface MonogramBackgroundProps {
  text: string;
  opacity?: number;
}

export function MonogramBackground({ text, opacity = 0.03 }: MonogramBackgroundProps) {
  return (
    <View style={[styles.container, { opacity }]}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}