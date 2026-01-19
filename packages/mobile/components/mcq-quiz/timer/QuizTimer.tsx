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
      <View style={styles.timerHeader}>
        <MaterialIcons
          name="timer"
          size={20}
          color={
            isTimeUp
              ? Theme.colors.primary.main
              : isWarning
              ? "#F59E0B"
              : Theme.colors.text.secondary
          }
        />
        <Text
          style={[
            styles.timerText,
            isTimeUp && styles.timerTextTimeUp,
            isWarning && styles.timerTextWarning,
          ]}
        >
          {isTimeUp ? "Time's Up!" : `${timeLeft}s remaining`}
        </Text>
      </View>

      <View style={styles.progressBar}>
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
