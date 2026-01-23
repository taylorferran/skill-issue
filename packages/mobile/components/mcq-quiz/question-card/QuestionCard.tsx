import React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { styles } from "./QuestionCard.styles";
import { MCQQuestion, QuizState } from "@/types/Quiz";
import { Theme } from "@/theme/Theme";

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
    if (!hasAnswered) {
      // Before answering - highlight selected answer
      return answerId === selectedAnswerId ? styles.answerOptionSelected : null;
    }

    // After answering - show correct/incorrect
    const isCorrect = answerId === question.correctAnswerId;
    const isSelected = answerId === selectedAnswerId;

    if (isCorrect) {
      return styles.answerOptionCorrect;
    }
    
    if (isSelected && !isCorrect) {
      return styles.answerOptionIncorrect;
    }

    return null;
  };

  const getAnswerTextStyle = (answerId: number) => {
    if (!hasAnswered) return null;

    const isCorrect = answerId === question.correctAnswerId;
    const isSelected = answerId === selectedAnswerId;

    if (isCorrect) {
      return styles.answerTextCorrect;
    }
    
    if (isSelected && !isCorrect) {
      return styles.answerTextIncorrect;
    }

    return null;
  };

  const getAnswerIcon = (answerId: number) => {
    if (!hasAnswered) return null;

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
      <Text style={styles.questionText}>{question.question}</Text>
      <View style={styles.answersContainer}>
        {question.answers.map((answer) => (
          <Pressable
            key={answer.id}
            style={[styles.answerOption, getAnswerStyle(answer.id)]}
            onPress={() => onAnswerSelect(answer.id)}
            disabled={hasAnswered || isTimeUp}
          >
            <Text style={[styles.answerText, getAnswerTextStyle(answer.id)]}>
              {answer.text}
            </Text>
            {getAnswerIcon(answer.id)}
          </Pressable>
        ))}
      </View>
    </View>
  );
};
