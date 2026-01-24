import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './ProgressBar.styles';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: number;
  showPercentage?: boolean;
}

export function ProgressBar({ 
  progress, 
  color, 
  height = 6,
  showPercentage = true 
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <View style={styles.container}>
      {showPercentage && (
        <View style={styles.header}>
          <Text style={styles.label}>MASTERY PROGRESS</Text>
          <Text style={styles.percentage}>{clampedProgress}%</Text>
        </View>
      )}
      
      <View style={[styles.track, { height }]}>
        <View 
          style={[
            styles.fill, 
            { 
              width: `${clampedProgress}%`, 
              backgroundColor: color,
              height 
            }
          ]} 
        />
      </View>
    </View>
  );
}