import { Theme } from "@/theme/Theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "./QuestionCard.styles";
import { MCQQuestion } from "@/types/Quiz";

type QuestionCardProps = {
  question: MCQQuestion;
  selectedAnswerId: number | null;
  onAnswerSelect: (answerId: number) => void;
  hasAnswered: boolean;
  isTimeUp: boolean;
  questionNumber: number;
  totalQuestions: number;
};

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedAnswerId,
  onAnswerSelect,
  hasAnswered,
  isTimeUp,
  questionNumber,
  totalQuestions,
}) => {
  const getAnswerStyle = (answerId: number) => {
    if (!hasAnswered && !isTimeUp) {
      return styles.answerOption;
    }

    const isCorrect = answerId === question.correctAnswerId;
    const isSelected = answerId === selectedAnswerId;

    if (isCorrect) {
      return [styles.answerOption, styles.answerOptionCorrect];
    }
    
    if (isSelected && !isCorrect) {
      return [styles.answerOption, styles.answerOptionIncorrect];
    }

    return styles.answerOption;
  };

  const getAnswerIcon = (answerId: number) => {
    if (!hasAnswered && !isTimeUp) return null;

    const isCorrect = answerId === question.correctAnswerId;
    const isSelected = answerId === selectedAnswerId;

    if (isCorrect) {
      return (
        <MaterialIcons
          name="check-circle"
          size={24}
          color={Theme.colors.success.main}
        />
      );
    }

    if (isSelected && !isCorrect) {
      return (
        <MaterialIcons
          name="cancel"
          size={24}
          color={Theme.colors.primary.main}
        />
      );
    }

    return null;
  };

  return (
    <View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionNumber}>
          Question {questionNumber} of {totalQuestions}
        </Text>
      </View>

      <Text style={styles.questionText}>{question.question}</Text>

      <View style={styles.answersContainer}>
        {question.answers.map((answer: any) => (
          <TouchableOpacity
            key={answer.id}
            style={getAnswerStyle(answer.id)}
            onPress={() => onAnswerSelect(answer.id)}
            disabled={hasAnswered || isTimeUp}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.answerText,
                (hasAnswered || isTimeUp) &&
                  answer.id === question.correctAnswerId &&
                  styles.answerTextCorrect,
                (hasAnswered || isTimeUp) &&
                  answer.id === selectedAnswerId &&
                  answer.id !== question.correctAnswerId &&
                  styles.answerTextIncorrect,
              ]}
            >
              {answer.text}
            </Text>
            {getAnswerIcon(answer.id)}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
