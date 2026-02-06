import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, ScrollView, Text, Pressable, ActivityIndicator } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { styles } from "./MCQQuiz.styles";
import { Theme } from "@/theme/Theme";
import { QuestionCard } from "../question-card/QuestionCard";
import { QuizResult } from "../quiz-result/QuizResult";
import { FinishButton } from "@/components/buttons/FinishButton";
import { QuizState } from "@/types/Quiz";
import { StarRating } from "@/components/star-rating/StarRating";
import { quizTimerEmitter } from "@/utils/quizTimerEmitter";

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
  isFinished: boolean;
}

// Generate unique quiz instance ID
let quizInstanceCounter = 0;

export const MCQQuiz: React.FC<MCQQuizProps> = ({
  data,
  onFinish,
  challengeId,
  userId,
  isFinishing,
  onSubmitAnswer,
}) => {
  const isSingleQuestion = !Array.isArray(data);
  const questions = isSingleQuestion ? [data] : data;
  
  // Generate unique ID for this quiz instance
  const quizInstanceId = useRef(`quiz-${++quizInstanceCounter}-${Date.now()}`);
  
  // Track if component is mounted
  const isMountedRef = useRef(true);
  
  // Store timer interval in a ref so we can always access and clear it
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track if screen is focused - pause timer when not visible
  const isFocused = useIsFocused();

  // Consolidated state
  const [quizSession, setQuizSession] = useState<QuizSessionState>({
    currentQuestionIndex: 0,
    selectedAnswerId: null,
    hasAnswered: false,
    isCorrect: false,
    elapsedTime: 0,
    confidenceRating: null,
    usefulRating: null,
    isFinished: false,
  });

  const currentQuestion = questions[quizSession.currentQuestionIndex];
  const isLastQuestion = quizSession.currentQuestionIndex === questions.length - 1;
  
  // Store quiz key to detect when we switch to a completely different quiz
  const quizKeyRef = useRef<string | null>(null);
  const currentQuizKey = useMemo(() => {
    return isSingleQuestion
      ? (data as any).id
      : (data as any[]).map(q => q.id).join('-');
  }, [data]);

  // Emit time updates via event emitter with quiz instance ID
  useEffect(() => {
    if (!isMountedRef.current) return;
    quizTimerEmitter.emit(quizSession.elapsedTime, quizInstanceId.current);
  }, [quizSession.elapsedTime]);

  // On mount: immediately claim this as the active quiz
  useEffect(() => {
    // Capture the instance ID in a variable for the cleanup function
    const instanceId = quizInstanceId.current;
    console.log(`[MCQQuiz] 🎯 Mounting quiz instance: ${instanceId}`);
    // Immediately reset and set this as the active quiz
    quizTimerEmitter.reset(instanceId);
    
    return () => {
      console.log(`[MCQQuiz] 🧹 Unmounting quiz instance: ${instanceId}`);
      isMountedRef.current = false;
      
      // Clear any running timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      // Clear the active quiz
      quizTimerEmitter.clearActiveQuiz();
    };
  }, []);

  // Reset quiz session when quiz data changes (different quiz)
  useEffect(() => {
    // Check if this is a different quiz
    if (quizKeyRef.current !== currentQuizKey) {
      console.log(`[MCQQuiz] 🔄 Quiz changed: ${quizKeyRef.current} → ${currentQuizKey}`);
      
      // Update the key ref
      quizKeyRef.current = currentQuizKey;
      
      // Clear any existing timer first
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      // Reset the timer emitter for this quiz instance
      quizTimerEmitter.reset(quizInstanceId.current);
      
      // Reset all state
      setQuizSession({
        currentQuestionIndex: 0,
        selectedAnswerId: null,
        hasAnswered: false,
        isCorrect: false,
        elapsedTime: 0,
        usefulRating: null,
        confidenceRating: null,
        isFinished: false,
      });
    }
  }, [currentQuizKey]);

  // Timer effect - only runs when timer should be active
  useEffect(() => {
    // Don't start timer if:
    // - Component is unmounted
    // - User has answered
    // - Quiz is finished
    // - Screen is not focused (navigated away)
    if (!isMountedRef.current || quizSession.hasAnswered || quizSession.isFinished || !isFocused) {
      // Clear any existing timer
      if (timerIntervalRef.current) {
        console.log(`[MCQQuiz] 🛑 Timer stopped (answered/finished/unfocused)`);
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    // Don't start if elapsedTime is 0 and we already have a timer (prevents double timers)
    if (quizSession.elapsedTime === 0 && timerIntervalRef.current) {
      console.log(`[MCQQuiz] ⏱️ Already have timer, not starting another`);
      return;
    }

    // Clear any existing timer before starting a new one
    if (timerIntervalRef.current) {
      console.log(`[MCQQuiz] 🛑 Clearing old timer before starting new one`);
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    console.log(`[MCQQuiz] ⏱️ Starting timer for quiz: ${currentQuizKey}, elapsedTime: ${quizSession.elapsedTime}`);

    // Start new timer
    timerIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        // Safety check - clear timer if component unmounted
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        return;
      }
      
      setQuizSession((prev) => ({
        ...prev,
        elapsedTime: prev.elapsedTime + 1,
      }));
    }, 1000);

    // Cleanup function
    return () => {
      if (timerIntervalRef.current) {
        console.log(`[MCQQuiz] 🛑 Clearing timer (effect cleanup)`);
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [quizSession.hasAnswered, quizSession.isFinished, quizSession.currentQuestionIndex, currentQuizKey, isFocused]);

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
      // Stop timer immediately when finish is pressed
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      setQuizSession((prev) => ({ ...prev, isFinished: true }));
      onFinish();
    } else {
      // Clear timer before moving to next question
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
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
    console.log(`[MCQQuiz] 🎯 handleFinish called`);
    
    // Stop timer immediately when finish is pressed
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    setQuizSession((prev) => ({ ...prev, isFinished: true }));
    
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
