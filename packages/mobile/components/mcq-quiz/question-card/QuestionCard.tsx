import { Theme } from "@/theme/Theme";
import { Ionicons } from "@expo/vector-icons";
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
    const isCorrect = answerId === question.correctAnswerId;
    const isSelected = answerId === selectedAnswerId;

    if (!hasAnswered && !isTimeUp) {
      return isSelected 
        ? [styles.answerOption, styles.answerOptionSelected]
        : styles.answerOption;
    }

    if (isCorrect) {
      return [styles.answerOption, styles.answerOptionCorrect];
    }
    
    if (isSelected && !isCorrect) {
      return [styles.answerOption, styles.answerOptionIncorrect];
    }

    return styles.answerOption;
  };

  const getAnswerIndicator = (answerId: number) => {
    const isCorrect = answerId === question.correctAnswerId;
    const isSelected = answerId === selectedAnswerId;

    // Show checkmark for correct answer after answering
    if ((hasAnswered || isTimeUp) && isCorrect) {
      return (
        <View style={[styles.radioContainer, styles.radioSelected]}>
          <Ionicons
            name="checkmark"
            size={16}
            color={Theme.colors.text.inverse}
          />
        </View>
      );
    }

    // Show radio button for selection state
    if (isSelected) {
      return (
        <View style={[styles.radioContainer, styles.radioSelected]}>
          {!hasAnswered && !isTimeUp && <View style={styles.radioInner} />}
          {(hasAnswered || isTimeUp) && !isCorrect && (
            <Ionicons
              name="checkmark"
              size={16}
              color={Theme.colors.text.inverse}
            />
          )}
        </View>
      );
    }

    // Default radio button
    return <View style={styles.radioContainer} />;
  };

  return (
    <View style={styles.questionCard}>
      {/* Question Text (large, prominent iOS style) */}
      <Text style={styles.questionText}>{question.question}</Text>

      {/* Answer Options */}
      <View style={styles.answersContainer}>
        {question.answers.map((answer: any) => (
          <TouchableOpacity
            key={answer.id}
            style={getAnswerStyle(answer.id)}
            onPress={() => onAnswerSelect(answer.id)}
            disabled={hasAnswered || isTimeUp}
            activeOpacity={0.98}
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
            {getAnswerIndicator(answer.id)}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
