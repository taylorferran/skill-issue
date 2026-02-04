import { styles } from "./CircularProgress.styles";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Theme } from "@/theme/Theme";

interface SimpleCircularProgressProps {
  current: number;
  total: number;
  compact?: boolean;
  skipAnimation?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CircularProgress: React.FC<SimpleCircularProgressProps> = ({
  current,
  total,
  compact = false,
  skipAnimation = false,
}) => {
  // State for animated number display
  const [displayNumber, setDisplayNumber] = useState(0);
  
  // Animation progress value (0 to 1)
  const animationProgress = useRef(new Animated.Value(0)).current;
  
  // Circle properties - smaller for compact mode
  const size = compact ? 100 : 180;
  const strokeWidth = compact ? 6 : 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const targetProgress = current / total;

  useEffect(() => {
    if (skipAnimation) {
      // Skip animation and immediately show final value
      animationProgress.setValue(1);
      setDisplayNumber(current);
      return;
    }

    // Reset animation
    animationProgress.setValue(0);
    setDisplayNumber(0);

    // Single animation with JS driver (needed for listener)
    const animation = Animated.timing(animationProgress, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    });

    // Listen to animation progress for number counter
    const listener = animationProgress.addListener(({ value }) => {
      setDisplayNumber(Math.round(value * current));
    });

    animation.start();

    return () => {
      animationProgress.removeListener(listener);
    };
  }, [current, total, skipAnimation, animationProgress]);

  // Interpolate strokeDashoffset from full circumference (empty) to target
  const strokeDashoffset = animationProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, circumference - (targetProgress * circumference)],
  });

  return (
    <View style={[styles.simpleGaugeContainer, compact && styles.compactGaugeContainer]}>
      <View style={[styles.svgContainer, compact && styles.compactSvgContainer]}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            stroke={Theme.colors.timeline.trackInactive}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle with animation */}
          <AnimatedCircle
            stroke={Theme.colors.primary.main}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        
        {/* Center text with animated number */}
        <View style={styles.gaugeInner}>
          <Text style={[styles.gaugeNumber, compact && styles.compactGaugeNumber]}>
            {displayNumber}
            <Text style={[styles.gaugeTotal, compact && styles.compactGaugeTotal]}>/{total}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

export default CircularProgress;
