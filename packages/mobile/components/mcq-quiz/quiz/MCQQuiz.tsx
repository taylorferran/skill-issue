import React, { useState, useEffect } from "react";
import { View, ScrollView, Text, Pressable, ActivityIndicator } from "react-native";
import { styles } from "./MCQQuiz.styles";
import { Theme } from "@/theme/Theme";
import { QuestionCard } from "../question-card/QuestionCard";
import { QuizResult } from "../quiz-result/QuizResult";
import { FinishButton } from "@/components/buttons/FinishButton";
import { QuizState } from "@/types/Quiz";
import { StarRating } from "@/components/star-rating/StarRating";
import { useQuiz } from "@/contexts/QuizContext";

type MCQQuizProps = {
  data: QuizState;
  onFinish: () => void;
  challengeId?: string;
  userId?: string;
  isFinishing?: boolean;
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
  elapsedTime: number;
  confidenceRating: number | null;
  usefulRating: number | null;
}

export const MCQQuiz: React.FC<MCQQuizProps> = ({
  data,
  onFinish,
  challengeId,
  userId,
  isFinishing,
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
    elapsedTime: 0,
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
      elapsedTime: quizSession.elapsedTime,
    });
  }, [
    quizSession.currentQuestionIndex,
    quizSession.elapsedTime,
    questions.length,
    isSingleQuestion,
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
      elapsedTime: 0,
      usefulRating: null,
      confidenceRating: null
    });
  }, [data]);

  // Reset timer when question changes
  useEffect(() => {
    setQuizSession((prev) => ({
      ...prev,
      elapsedTime: 0,
    }));
  }, [quizSession.currentQuestionIndex]);

  // Timer that counts up until user answers
  useEffect(() => {
    if (quizSession.hasAnswered) return;

    const timer = setInterval(() => {
      setQuizSession((prev) => ({
        ...prev,
        elapsedTime: prev.elapsedTime + 1,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [quizSession.hasAnswered]);

  const handleAnswerSelect = (answerId: number) => {
    if (quizSession.hasAnswered) return;
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
        usefulRating: null,
        confidenceRating: null,
        elapsedTime: 0,
      }));
    }
  };

  const handleFinish = async () => {
    console.log('[MCQQuiz] 🎯 handleFinish called');
    
    if (!quizSession.confidenceRating || !quizSession.usefulRating || quizSession.selectedAnswerId === null) {
      console.log('[MCQQuiz] ⛔ Early return - missing ratings or answer:', {
        hasConfidence: !!quizSession.confidenceRating,
        hasUseful: !!quizSession.usefulRating,
        hasAnswer: quizSession.selectedAnswerId !== null
      });
      return;
    }

    // Response time is the elapsed time in milliseconds
    const responseTime = quizSession.elapsedTime * 1000;
    const userFeedback = `User rated usefulness ${quizSession.usefulRating} out of 5`;

    console.log('[MCQQuiz] 🔍 Checking guard condition:', {
      hasOnSubmitAnswer: !!onSubmitAnswer,
      challengeId: challengeId || 'UNDEFINED/EMPTY',
      userId: userId || 'UNDEFINED/EMPTY',
      willSubmit: !!(onSubmitAnswer && challengeId && userId)
    });

    if (onSubmitAnswer && challengeId && userId) {
      console.log('[MCQQuiz] 📤 Calling onSubmitAnswer with:', {
        challengeId,
        userId,
        selectedOption: quizSession.selectedAnswerId,
        responseTime,
        confidence: quizSession.confidenceRating,
      });
      
      try {
        await onSubmitAnswer({
          challengeId,
          userId,
          selectedOption: quizSession.selectedAnswerId,
          responseTime,
          confidence: quizSession.confidenceRating,
          userFeedback,
        });
        console.log('[MCQQuiz] ✅ onSubmitAnswer completed successfully');
      } catch (error) {
        console.error('[MCQQuiz] ❌ onSubmitAnswer failed:', error);
        throw error;
      }
    } else {
      console.log('[MCQQuiz] ⚠️ Skipping onSubmitAnswer - guard condition failed:', {
        hasOnSubmitAnswer: !!onSubmitAnswer,
        hasChallengeId: !!challengeId,
        hasUserId: !!userId,
        challengeIdValue: challengeId,
        userIdValue: userId
      });
    }

    console.log('[MCQQuiz] 🏁 Calling onFinish()');
    onFinish();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.mainContent}>
          <QuestionCard
            question={currentQuestion}
            selectedAnswerId={quizSession.selectedAnswerId}
            onAnswerSelect={handleAnswerSelect}
            hasAnswered={quizSession.hasAnswered}
            questionNumber={quizSession.currentQuestionIndex + 1}
            totalQuestions={questions.length}
          />

          {/* Confirm Answer Button */}
          {quizSession.selectedAnswerId !== null && 
           !quizSession.hasAnswered && (
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

      {/* Loading State - Show when processing */}
      {isFinishing && (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Theme.colors.primary.main} />
          <Text style={styles.loadingText}>We are processing your skill level...</Text>
        </View>
      )}
    </View>
  );
};
