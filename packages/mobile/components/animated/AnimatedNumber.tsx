import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TextStyle, StyleProp } from 'react-native';
import { Theme } from '@/theme/Theme';

interface AnimatedNumberProps {
  value: number | null | undefined;
  suffix?: string;
  prefix?: string;
  fallback?: string;
  style?: StyleProp<TextStyle>;
  duration?: number;
  skipAnimation?: boolean;
}

export function AnimatedNumber({
  value,
  suffix = '',
  prefix = '',
  fallback = '—',
  style,
  duration = 600,
  skipAnimation = false,
}: AnimatedNumberProps) {
  const countAnim = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);
  const hasValue = value !== null && value !== undefined;
  const hasAnimatedRef = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (hasValue && value !== undefined) {
      if (skipAnimation) {
        // Skip animation and immediately display the value
        hasAnimatedRef.current = true;
        setDisplayValue(value);
      } else if (!hasAnimatedRef.current) {
        hasAnimatedRef.current = true;

        if (isFirstRender.current) {
          // On first render, immediately show the value but start count from 0
          isFirstRender.current = false;
          countAnim.setValue(0);
          setDisplayValue(0);

          Animated.timing(countAnim, {
            toValue: value,
            duration,
            useNativeDriver: false,
          }).start();

          const listener = countAnim.addListener(({ value: animatedValue }) => {
            setDisplayValue(Math.round(animatedValue));
          });

          return () => {
            countAnim.removeListener(listener);
          };
        } else {
          // Not first render but still first data load
          countAnim.setValue(0);

          Animated.timing(countAnim, {
            toValue: value,
            duration,
            useNativeDriver: false,
          }).start();

          const listener = countAnim.addListener(({ value: animatedValue }) => {
            setDisplayValue(Math.round(animatedValue));
          });

          return () => {
            countAnim.removeListener(listener);
          };
        }
      } else {
        // Data already loaded before - just show value directly
        setDisplayValue(value);
      }
    } else {
      setDisplayValue(0);
      hasAnimatedRef.current = false;
    }
  }, [hasValue, value, countAnim, duration, skipAnimation]);

  const textValue = hasValue 
    ? `${prefix}${displayValue}${suffix}`
    : fallback;

  return (
    <Text
      style={[
        {
          color: hasValue ? Theme.colors.text.primary : Theme.colors.text.secondary,
        },
        style,
      ]}
    >
      {textValue}
    </Text>
  );
}
