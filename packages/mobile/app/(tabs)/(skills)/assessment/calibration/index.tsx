import { useGenerateCalibration } from "@/api-routes/generateCalibration";
import { useStartCalibration } from "@/api-routes/startCalibration";
import { useSubmitCalibrationAnswer } from "@/api-routes/submitCalibrationAnswer";
import { useCompleteCalibration } from "@/api-routes/completeCalibration";
import { useEnrollSkill } from "@/api-routes/enrollSkill";
import { useGetUserSkills } from "@/api-routes/getUserSkills";
import { CalibrationQuestion } from "@learning-platform/shared";
import { useRouteParams, navigateTo } from "@/navigation/navigation";
import { useUser } from "@/contexts/UserContext";
import { useState, useEffect, useRef } from "react";
import { useIsFocused } from "@react-navigation/native";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { Theme } from "@/theme/Theme";
import { MaterialIcons } from "@expo/vector-icons";
import { QuizResult } from "@/components/mcq-quiz/quiz-result/QuizResult";
import { QuestionCard } from "@/components/mcq-quiz/question-card/QuestionCard";
import { markSkillAssessed } from "@/utils/assessmentStorage";
import { useSkillsStore } from "@/stores/skillsStore";
import { quizTimerEmitter } from "@/utils/quizTimerEmitter";
import { styles } from "./_index.styles";
import type { MCQQuestion } from "@/types/Quiz";

interface CalibrationAnswer {
  difficulty: number;
  selectedOption: number;
  responseTime: number;
  isCorrect: boolean;
}

/**
 * Helper function to transform CalibrationQuestion to MCQQuestion format
 * This allows us to use the shared QuestionCard component
 */
function calibrationToMCQQuestion(calibration: CalibrationQuestion, correctOption: number): MCQQuestion {
  return {
    id: calibration.difficulty, // Use difficulty as unique ID for each question
    question: calibration.question,
    answers: calibration.options.map((option, index) => ({
      id: index,
      text: option,
    })),
    correctAnswerId: correctOption,
    explanation: "", // Will be populated after answer submission
  };
}

// Generate unique calibration instance ID
let calibrationInstanceCounter = 0;

export default function CalibrationQuizScreen() {
  const { skill, skillId } = useRouteParams('calibration');
  const { userId } = useUser();
  const { setUserSkills } = useSkillsStore();
  
  // Track if screen is focused - pause timer when not visible
  const isFocused = useIsFocused();
   
  // Generate unique ID for this calibration instance
  const calibrationInstanceId = useRef(`calibration-${++calibrationInstanceCounter}-${Date.now()}`);
  
  // API hooks
  const { execute: generateCalibration, isLoading: isGenerating } = useGenerateCalibration();
  const { execute: startCalibration, isLoading: isStarting } = useStartCalibration();
  const { execute: submitAnswer, isLoading: isSubmitting } = useSubmitCalibrationAnswer();
  const { execute: completeCalibration, isLoading: isCompleting } = useCompleteCalibration();
  const { execute: enrollSkill, isLoading: isEnrolling } = useEnrollSkill();
  const { execute: fetchUserSkills } = useGetUserSkills();
  
  // State
  const [questions, setQuestions] = useState<CalibrationQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [correctOption, setCorrectOption] = useState<number>(0);
  const [answers, setAnswers] = useState<CalibrationAnswer[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Timer
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  
  const currentQuestion = questions[currentQuestionIndex];
  
  // Transform current question to MCQQuestion format for QuestionCard
  const currentMCQQuestion: MCQQuestion | undefined = currentQuestion 
    ? calibrationToMCQQuestion(currentQuestion, correctOption)
    : undefined;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const totalQuestions = questions.length;
  
  // Initialize calibration on mount
  useEffect(() => {
    const instanceId = calibrationInstanceId.current;
    console.log(`[Calibration] 🎯 Mounting calibration instance: ${instanceId}`);
    
    // Immediately reset and set this as the active quiz
    quizTimerEmitter.reset(instanceId);
    
    const initializeCalibration = async () => {
      if (!userId || !skillId || isInitialized) return;
      
      try {
        // First generate questions (ensures they exist)
        await generateCalibration({ skillId });
        
        // Then start calibration to get questions
        const result = await startCalibration({ userId, skillId });
        
        if (result.questions && result.questions.length > 0) {
          setQuestions(result.questions);
          setIsInitialized(true);
        } else {
          setError("No calibration questions available");
        }
      } catch (err) {
        console.error("[Calibration] Failed to initialize:", err);
        setError("Failed to load calibration questions. Please try again.");
      }
    };
    
    initializeCalibration();
    
    return () => {
      console.log(`[Calibration] 🧹 Unmounting calibration instance: ${instanceId}`);
      isMountedRef.current = false;
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      // Clear the active quiz
      quizTimerEmitter.clearActiveQuiz();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Emit time updates via event emitter for Header component
  useEffect(() => {
    if (!isMountedRef.current) return;
    quizTimerEmitter.emit(elapsedTime, calibrationInstanceId.current);
  }, [elapsedTime]);
  
  // Timer effect - resets for each question
  useEffect(() => {
    // Don't start timer if component unmounted, answered, finished, no question, or not focused
    if (!isMountedRef.current || hasAnswered || isFinished || !currentQuestion || !isFocused) {
      if (timerIntervalRef.current) {
        console.log('[Calibration] 🛑 Timer stopped (answered/finished/no question/unfocused)');
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }
    
    // Clear any existing timer before starting a new one
    if (timerIntervalRef.current) {
      console.log('[Calibration] 🛑 Clearing old timer before starting new one');
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Reset timer for new question
    setElapsedTime(0);
    
    console.log('[Calibration] ⏱️ Starting timer for question', currentQuestionIndex + 1);
    
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
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    return () => {
      if (timerIntervalRef.current) {
        console.log('[Calibration] 🛑 Clearing timer (effect cleanup)');
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [currentQuestionIndex, hasAnswered, isFinished, currentQuestion, isFocused]);
  
  const handleOptionSelect = (index: number) => {
    if (hasAnswered) return;
    setSelectedOption(index);
  };
  
  const handleConfirmAnswer = async () => {
    if (selectedOption === null || !currentQuestion || !userId || !skillId) return;
    
    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    try {
      const responseTime = elapsedTime * 1000; // Convert to milliseconds
      
      const result = await submitAnswer({
        userId,
        skillId,
        difficulty: currentQuestion.difficulty,
        selectedOption,
        responseTime
      });
      
      // Update state with answer results
      setHasAnswered(true);
      setIsCorrect(result.isCorrect);
      setExplanation(result.explanation);
      setCorrectOption(result.correctOption); // This updates currentMCQQuestion for QuestionCard
      
      // Store answer for tracking
      setAnswers(prev => [...prev, {
        difficulty: currentQuestion.difficulty,
        selectedOption,
        responseTime,
        isCorrect: result.isCorrect
      }]);
    } catch (err) {
      console.error("[Calibration] Failed to submit answer:", err);
      Alert.alert("Error", "Failed to submit answer. Please try again.");
    }
  };
  
  const handleNext = async () => {
    if (isLastQuestion) {
      // Complete calibration
      await handleFinish();
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
      setIsCorrect(false);
      setExplanation(null);
      setCorrectOption(0); // Reset correct option for next question
    }
  };
  
  const handleFinish = async () => {
    if (!userId || !skillId) return;
    
    try {
      // Complete calibration to get difficulty target
      const result = await completeCalibration({ userId, skillId });
      
      // Enroll user in skill with calculated difficulty
      await enrollSkill({
        userId,
        skillId,
        difficultyTarget: result.difficultyTarget
      });
      
      // Mark as assessed locally
      await markSkillAssessed(skillId, result.difficultyTarget);
      
      // Refresh user skills
      const updatedSkills = await fetchUserSkills({ userId });
      setUserSkills(updatedSkills);
      
      setIsFinished(true);
      
      // Navigate back to assessment
      Alert.alert(
        "Calibration Complete!",
        `Your difficulty level has been set to ${result.difficultyTarget} based on your performance.`,
        [
          {
            text: "Continue",
            onPress: () => navigateTo("assessment", { skill, skillId })
          }
        ]
      );
    } catch (err) {
      console.error("[Calibration] Failed to complete:", err);
      Alert.alert(
        "Error",
        "Failed to complete calibration. Please try again."
      );
    }
  };
  
  const handleExit = () => {
    Alert.alert(
      "Exit Calibration?",
      "Your progress will be lost. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Exit", 
          style: "destructive",
          onPress: () => navigateTo("assessment", { skill, skillId })
        }
      ]
    );
  };
  
  // Loading state
  if (isGenerating || isStarting || !isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary.main} />
        <Text style={styles.loadingText}>Loading calibration questions...</Text>
      </View>
    );
  }
  
  // Error state
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="error-outline" size={48} color={Theme.colors.error.main} />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={handleExit}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }
  
  // No questions state
  if (!currentQuestion || !currentMCQQuestion) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No questions available</Text>
        <Pressable style={styles.retryButton} onPress={handleExit}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }
  
  const progress = ((currentQuestionIndex + (hasAnswered ? 1 : 0)) / totalQuestions) * 100;
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Question {currentQuestionIndex + 1} of {totalQuestions}</Text>
            <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
        
        {/* Difficulty Badge */}
        <View style={styles.difficultyBadge}>
          <MaterialIcons name="signal-cellular-alt" size={14} color={Theme.colors.text.inverse} />
          <Text style={styles.difficultyText}>Difficulty {currentQuestion.difficulty}</Text>
        </View>
        
        {/* Question Card - Using shared component */}
        <QuestionCard
          question={currentMCQQuestion}
          selectedAnswerId={selectedOption}
          onAnswerSelect={handleOptionSelect}
          hasAnswered={hasAnswered}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
        />
        
        {/* Confirm Answer Button */}
        {selectedOption !== null && !hasAnswered && (
          <View style={styles.buttonContainer}>
            <Pressable style={styles.confirmButton} onPress={handleConfirmAnswer} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Theme.colors.text.inverse} />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Answer</Text>
              )}
            </Pressable>
          </View>
        )}
        
        {/* Result Display */}
        {hasAnswered && (
          <View style={styles.resultContainer}>
            <QuizResult isCorrect={isCorrect} explanation={explanation || "No explanation available."} />
            
            <Pressable 
              style={[styles.nextButton, isLastQuestion && styles.finishButton]} 
              onPress={handleNext}
              disabled={isCompleting || isEnrolling}
            >
              {isCompleting || isEnrolling ? (
                <ActivityIndicator size="small" color={Theme.colors.text.inverse} />
              ) : (
                <Text style={styles.nextButtonText}>
                  {isLastQuestion ? "Finish" : "Next Question"}
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
