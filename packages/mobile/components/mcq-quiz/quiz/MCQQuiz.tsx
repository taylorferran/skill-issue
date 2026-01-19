import React, { useState, useEffect } from "react";
import { View, ScrollView, Text } from "react-native";
import { styles } from "./MCQQuiz.styles";
import { QuestionCard } from "../question-card/QuestionCard";
import { QuizResult } from "../quiz-result/QuizResult";
import { QuizTimer } from "../timer/QuizTimer";
import { FinishButton } from "@/components/buttons/FinishButton";
import { QuizState } from "@/types/Quiz";
import { spacing } from "@/theme/ThemeUtils";
import { StarRating } from "@/components/star-rating/StarRating";

type MCQQuizProps = {
  data: QuizState;
  onFinish: () => void;
  timePerQuestion?: number; // in seconds
};

export const MCQQuiz: React.FC<MCQQuizProps> = ({
  data,
  onFinish,
  timePerQuestion = 30,
}) => {
  const isSingleQuestion = !Array.isArray(data);
  const questions = isSingleQuestion ? [data] : data;

  // Debug: Log quiz mode
  React.useEffect(() => {
    console.log("Quiz Mode:", isSingleQuestion ? "SINGLE" : "MULTIPLE");
    console.log("Total Questions:", questions.length);
  }, []);

  useEffect(() => {
    setCurrentQuestionIndex(0);
    setSelectedAnswerId(null);
    setHasAnswered(false);
    setIsCorrect(false);
    setRating(null);
    setTimeLeft(timePerQuestion);
    setIsTimeUp(false);
  }, [data, timePerQuestion]); // Reset when data or timePerQuestion changes

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [rating, setRating] = useState<number | null>(null); // ✅ New state for rating
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Reset timer when question changes
  useEffect(() => {
    setTimeLeft(timePerQuestion);
    setIsTimeUp(false);
  }, [currentQuestionIndex, timePerQuestion]);

  // Timer countdown
  useEffect(() => {
    if (hasAnswered || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, hasAnswered]);

  const handleAnswerSelect = (answerId: number) => {
    if (hasAnswered || isTimeUp) return;

    setSelectedAnswerId(answerId);
    setHasAnswered(true);
    const correct = answerId === currentQuestion.correctAnswerId;
    setIsCorrect(correct);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onFinish();
    } else {
      // Move to next question
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswerId(null);
      setHasAnswered(false);
      setIsCorrect(false);
    }
  };

  const handleRatingSelect = (selectedRating: number) => {
    setRating(selectedRating);
    // TODO: Save rating to backend/analytics here
    console.log(
      `User rated question ${currentQuestion.id} with ${selectedRating} stars`,
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with Close and Timer */}
      <View style={styles.header}>
        <QuizTimer
          timeLeft={timeLeft}
          totalTime={timePerQuestion}
          isTimeUp={isTimeUp}
        />
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <QuestionCard
          question={currentQuestion}
          selectedAnswerId={selectedAnswerId}
          onAnswerSelect={handleAnswerSelect}
          hasAnswered={hasAnswered}
          isTimeUp={isTimeUp}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
        />

        {/* SINGLE QUESTION MODE */}
        {isSingleQuestion && hasAnswered && (
          <>
            {/* Show explanation without continue button */}
            <QuizResult
              isCorrect={isCorrect}
              explanation={currentQuestion.explanation}
            />

            {/* Show star rating */}
            <StarRating rating={rating} onRatingSelect={handleRatingSelect} />

            {/* Only show continue button after rating is given */}
            {rating !== null && (
              <View style={styles.buttonContainer}>
                <FinishButton onPress={onFinish} isLastQuestion={true} />
              </View>
            )}
          </>
        )}

        {/* MULTIPLE QUESTION MODE: Show next/finish button */}
        {!isSingleQuestion && hasAnswered && (
          <View style={styles.buttonContainer}>
            <FinishButton onPress={handleNext} isLastQuestion={isLastQuestion} />
          </View>
        )}
      </View>
    </ScrollView>
  );
};
