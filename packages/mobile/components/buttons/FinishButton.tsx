import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { styles } from "./FinishButton.styles";

type FinishButtonProps = {
  onPress: () => void;
  isLastQuestion: boolean;
};

export const FinishButton: React.FC<FinishButtonProps> = ({
  onPress,
  isLastQuestion,
}) => {
  return (
    <TouchableOpacity
      style={styles.finishButton}
      onPress={onPress}
      activeOpacity={0.98}
    >
      <Text style={styles.finishButtonText}>
        Confirm Answer
      </Text>
    </TouchableOpacity>
  );
};
