import { Theme } from "@/theme/Theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View, Text } from "react-native";
import { styles } from "./QuizTimer.styles";

type QuizTimerProps = {
  elapsedTime: number;
};

export const QuizTimer: React.FC<QuizTimerProps> = ({ elapsedTime }) => {
  // Format elapsed time as M:SS or just seconds if under 60
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.timerContainer}>
      <Ionicons
        name="time-outline"
        size={18}
        color={Theme.colors.text.secondary}
      />
      <Text style={styles.timeText}>
        {formatTime(elapsedTime)}
      </Text>
    </View>
  );
};
