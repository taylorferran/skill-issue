import { Theme } from "@/theme/Theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "./QuizResult.styles";

type QuizResultProps = {
  isCorrect: boolean;
  explanation: string;
  onContinue?: () => void;
};

export const QuizResult: React.FC<QuizResultProps> = ({
  isCorrect,
  explanation,
  onContinue,
}) => {
  return (
    <View style={styles.resultContainer}>
      <View
        style={[
          styles.resultCard,
          isCorrect ? styles.resultCardSuccess : styles.resultCardError,
        ]}
      >
        <View style={styles.resultHeader}>
          <View
            style={[
              styles.resultIconContainer,
              isCorrect
                ? styles.resultIconContainerSuccess
                : styles.resultIconContainerError,
            ]}
          >
            <MaterialIcons
              name={isCorrect ? "check-circle" : "cancel"}
              size={32}
              color={
                isCorrect
                  ? Theme.colors.success.main
                  : Theme.colors.primary.main
              }
            />
          </View>
          <Text style={styles.resultTitle}>
            {isCorrect ? "Correct!" : "Incorrect"}
          </Text>
        </View>

        <Text style={styles.resultExplanation}>{explanation}</Text>

        {onContinue && (
          <TouchableOpacity
            style={[
              styles.continueButton,
              isCorrect
                ? styles.continueButtonSuccess
                : styles.continueButtonError,
            ]}
            onPress={onContinue}
            activeOpacity={0.7}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
