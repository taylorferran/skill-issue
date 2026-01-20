import { Theme } from "@/theme/Theme";
import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { styles } from "./QuizTimer.styles";

type QuizTimerProps = {
  timeLeft: number;
  totalTime: number;
  isTimeUp: boolean;
};

export const QuizTimer: React.FC<QuizTimerProps> = ({
  timeLeft,
  totalTime,
  isTimeUp,
}) => {
  const progress = timeLeft / totalTime;
  const isWarning = timeLeft <= 10 && !isTimeUp;
  
  // Circle properties
  const size = 48;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Determine color
  const progressColor = isTimeUp
    ? Theme.colors.primary.main
    : isWarning
    ? '#F59E0B'
    : Theme.colors.primary.main;

  return (
    <View style={styles.timerContainer}>
      <View style={styles.circularTimer}>
        {/* SVG Circle Progress */}
        <Svg width={size} height={size} style={styles.svgContainer}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Theme.colors.gray[200]}
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        
        {/* Time Text */}
        <View style={styles.timeTextContainer}>
          <Text style={[
            styles.timeText,
            isWarning && styles.timeTextWarning,
            isTimeUp && styles.timeTextTimeUp,
          ]}>
            {isTimeUp ? '0s' : `${timeLeft}s`}
          </Text>
        </View>
      </View>
    </View>
  );
};
