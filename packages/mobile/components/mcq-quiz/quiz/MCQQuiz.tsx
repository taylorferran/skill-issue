import React, { useState, useEffect } from "react";
import { View, ScrollView, Text, Pressable } from "react-native";
import { styles } from "./MCQQuiz.styles";
import { QuestionCard } from "../question-card/QuestionCard";
import { QuizResult } from "../quiz-result/QuizResult";
import { FinishButton } from "@/components/buttons/FinishButton";
import { QuizState } from "@/types/Quiz";
import { StarRating } from "@/components/star-rating/StarRating";
import { useQuiz } from "@/contexts/QuizContext";

type MCQQuizProps = {
  data: QuizState;
  onFinish: () => void;
  timePerQuestion?: number;
  challengeId?: string;
  userId?: string;
  onSubmitAnswer?: (answerData: {
    challengeId: string;
    userId: string;
    selectedOption: number;
    responseTime: number;
    confidence: number | null;
    userFeedback: string;
  }) => Promise<void>;
};

interface QuizSessionState {
  currentQuestionIndex: number;
  selectedAnswerId: number | null;
  hasAnswered: boolean;
  isCorrect: boolean;
  timeLeft: number;
  isTimeUp: boolean;
  confidenceRating: number | null;
  usefulRating: number | null;
}

export const MCQQuiz: React.FC<MCQQuizProps> = ({
  data,
  onFinish,
  timePerQuestion = 30,
  challengeId,
  userId,
  onSubmitAnswer,
}) => {
  const { setQuizState } = useQuiz();
  const isSingleQuestion = !Array.isArray(data);
  const questions = isSingleQuestion ? [data] : data;

  // ✅ Consolidated state
  const [quizSession, setQuizSession] = useState<QuizSessionState>({
    currentQuestionIndex: 0,
    selectedAnswerId: null,
    hasAnswered: false,
    isCorrect: false,
    timeLeft: timePerQuestion,
    isTimeUp: false,
    confidenceRating: null,
    usefulRating: null
  });

  const currentQuestion = questions[quizSession.currentQuestionIndex];
  const isLastQuestion = quizSession.currentQuestionIndex === questions.length - 1;

  // Update context with quiz state
  useEffect(() => {
    setQuizState({
      currentQuestion: quizSession.currentQuestionIndex + 1,
      totalQuestions: questions.length,
      isSingleQuestion,
      timeLeft: quizSession.timeLeft,
      totalTime: timePerQuestion,
      isTimeUp: quizSession.isTimeUp,
    });
  }, [
    quizSession.currentQuestionIndex,
    quizSession.timeLeft,
    quizSession.isTimeUp,
    questions.length,
    isSingleQuestion,
    timePerQuestion,
    setQuizState,
  ]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      setQuizState(null);
    };
  }, [setQuizState]);

  // Reset quiz session when data changes
  useEffect(() => {
    setQuizSession({
      currentQuestionIndex: 0,
      selectedAnswerId: null,
      hasAnswered: false,
      isCorrect: false,
      timeLeft: timePerQuestion,
      isTimeUp: false,
      usefulRating: null,
      confidenceRating: null
    });
  }, [data, timePerQuestion]);

  // Reset timer when question changes
  useEffect(() => {
    setQuizSession((prev) => ({
      ...prev,
      timeLeft: timePerQuestion,
      isTimeUp: false,
    }));
  }, [quizSession.currentQuestionIndex, timePerQuestion]);

  // Timer countdown with auto-submit
  useEffect(() => {
    if (quizSession.hasAnswered || quizSession.timeLeft === 0) return;

    const timer = setInterval(() => {
      setQuizSession((prev) => {
        if (prev.timeLeft <= 1) {
          // Time's up!
          if (prev.selectedAnswerId !== null) {
            // Answer was selected but not confirmed - auto confirm it
            const correct = prev.selectedAnswerId === currentQuestion.correctAnswerId;
            return {
              ...prev,
              timeLeft: 0,
              isTimeUp: true,
              hasAnswered: true,
              isCorrect: correct,
            };
          } else {
            // No answer selected - mark as failed
            return {
              ...prev,
              timeLeft: 0,
              isTimeUp: true,
              hasAnswered: true,
              isCorrect: false,
            };
          }
        }
        return {
          ...prev,
          timeLeft: prev.timeLeft - 1,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizSession.hasAnswered, quizSession.timeLeft, quizSession.selectedAnswerId, currentQuestion.correctAnswerId]);

  const handleAnswerSelect = (answerId: number) => {
    if (quizSession.hasAnswered || quizSession.isTimeUp) return;
    setQuizSession((prev) => ({ ...prev, selectedAnswerId: answerId }));
  };

  const handleConfirmAnswer = () => {
    if (quizSession.selectedAnswerId === null || quizSession.hasAnswered) return;

    const correct = quizSession.selectedAnswerId === currentQuestion.correctAnswerId;
    setQuizSession((prev) => ({
      ...prev,
      hasAnswered: true,
      isCorrect: correct,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onFinish();
    } else {
      setQuizSession((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        selectedAnswerId: null,
        hasAnswered: false,
        isCorrect: false,
        rating: null,
        timeLeft: timePerQuestion,
        isTimeUp: false,
      }));
    }
  };

  const handleRatingSelect = (selectedRating: number) => {
    setQuizSession((prev) => ({ ...prev, rating: selectedRating }));
    console.log(`User rated question ${currentQuestion.id} with ${selectedRating} stars`);
  };

  const handleFinish = async () => {
    if (!quizSession.confidenceRating || !quizSession.usefulRating || quizSession.selectedAnswerId === null) {
      return;
    }

    const responseTime = (timePerQuestion - quizSession.timeLeft) * 1000;
    const userFeedback = `User rated usefulness ${quizSession.usefulRating} out of 5`;

    if (onSubmitAnswer && challengeId && userId) {
      await onSubmitAnswer({
        challengeId,
        userId,
        selectedOption: quizSession.selectedAnswerId,
        responseTime,
        confidence: quizSession.confidenceRating,
        userFeedback,
      });
    }

    onFinish();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.mainContent}>
        <QuestionCard
          question={currentQuestion}
          selectedAnswerId={quizSession.selectedAnswerId}
          onAnswerSelect={handleAnswerSelect}
          hasAnswered={quizSession.hasAnswered}
          isTimeUp={quizSession.isTimeUp}
          questionNumber={quizSession.currentQuestionIndex + 1}
          totalQuestions={questions.length}
        />

        {/* Confirm Answer Button */}
        {quizSession.selectedAnswerId !== null && 
         !quizSession.hasAnswered && 
         !quizSession.isTimeUp && (
          <View style={styles.buttonContainer}>
            <Pressable style={styles.confirmButton} onPress={handleConfirmAnswer}>
              <Text style={styles.confirmButtonText}>Confirm Answer</Text>
            </Pressable>
          </View>
        )}

        {/* SINGLE QUESTION MODE */}
        {isSingleQuestion && quizSession.hasAnswered && (
          <View style={styles.buttonContainer}>
            <QuizResult 
              isCorrect={quizSession.isCorrect} 
              explanation={currentQuestion.explanation} 
            />
            <StarRating 
              text='How confident were you?'
              rating={quizSession.confidenceRating} 
              onRatingSelect={(rating) => setQuizSession((prev => ({...prev, confidenceRating: rating})))} />
            <StarRating 
              rating={quizSession.usefulRating} 
              text='How useful was this question?'
              onRatingSelect={(rating) => setQuizSession((prev => ({...prev, usefulRating: rating})))} />
            {quizSession.usefulRating!== null && quizSession.confidenceRating && (
              <View style={styles.buttonContainer}>
                <FinishButton onPress={handleFinish} text={'Finish'} />
              </View>
            )}
          </View>
        )}

        {/* MULTIPLE QUESTION MODE */}
        {!isSingleQuestion && quizSession.hasAnswered && (
          <>
            <QuizResult 
              isCorrect={quizSession.isCorrect} 
              explanation={currentQuestion.explanation} 
            />
            <View style={styles.buttonContainer}>
              <FinishButton  onPress={handleNext} text={isLastQuestion ? 'Finish' : quizSession.hasAnswered ? 'Next': 'Confirm'} />
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
};
