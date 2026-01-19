import { Theme } from "@/theme/Theme";
import { MaterialIcons } from "@expo/vector-icons";
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
      {/* Circular Progress Ring */}
      <View style={styles.circularTimer}>
        {/* Background Circle */}
        <View style={styles.backgroundCircle} />
        
        {/* Progress Circle */}
        <View 
          style={[
            styles.progressFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: isTimeUp
                ? Theme.colors.primary.main
                : isWarning
                ? "#F59E0B"
                : Theme.colors.success.main,
            },
          ]}
        />
      </View>
    </View>
  );
};
