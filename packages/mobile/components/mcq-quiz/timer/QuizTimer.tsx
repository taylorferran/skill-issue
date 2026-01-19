import { Theme } from "@/theme/Theme";
import React from "react";
import { View, Text } from "react-native";
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

  return (
    <View style={styles.timerContainer}>
      {/* Linear Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: isTimeUp
                ? Theme.colors.primary.main
                : isWarning
                ? '#F59E0B'
                : Theme.colors.primary.main,
            }
          ]} 
        />
      </View>
      
      {/* Time Text */}
      <Text style={[
        styles.timeText,
        isWarning && styles.timeTextWarning,
        isTimeUp && styles.timeTextTimeUp,
      ]}>
        {isTimeUp ? '0s' : `${timeLeft}s`}
      </Text>
    </View>
  );
};
