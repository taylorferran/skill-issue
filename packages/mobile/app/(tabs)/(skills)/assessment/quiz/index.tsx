import React, { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { MCQQuiz } from "@/components/mcq-quiz/quiz/MCQQuiz";
import { useRouteParams, navigateTo } from "@/navigation/navigation";
import { useUser } from "@/contexts/UserContext";
import { useSubmitAnswer } from "@/api-routes/submitAnswer";
import { useGetUserSkills } from "@/api-routes/getUserSkills";
import { Alert } from "react-native";
import type { AnswerChallengeResponse } from "@learning-platform/shared";
import type { MCQQuestion, Challenge, ChallengeWithNotification } from "@/types/Quiz";
import { notificationEventEmitter } from "@/utils/notificationEvents";
import { useNotificationStore } from "@/stores/notificationStore";
import { useSkillsStore } from "@/stores/skillsStore";
import { clearNotification } from "@/utils/badgeUtils";

interface AnswerSubmissionData {
  challengeId: string;
  userId: string;
  selectedOption: number;
  responseTime: number;
  confidence: number | null;
  userFeedback: string;
}

interface QuizResultData extends AnswerChallengeResponse {
  selectedOption: number;
  responseTime: number;
  confidence: number | null;
}

const SkillAssessmentScreen = () => {
  const { data, challengeId, skill, skillId } = useRouteParams("quiz");
  const { userId } = useUser();
  
  // Mount tracking for debugging
  useEffect(() => {
    console.log(`[QuizScreen] 🔄 Mounted - challengeId: ${challengeId}`);
    return () => {
      console.log(`[QuizScreen] 🧹 Unmounted - challengeId: ${challengeId}`);
    };
  }, [challengeId]);
  
  // RENDER TRACKING - To detect infinite loops
  const renderCount = useRef(0);
  const prevQuizKey = useRef<string | null>(null);
  const prevDataRef = useRef<string | null>(null);
  
  renderCount.current++;
  
  const dataString = JSON.stringify(data);
  if (prevDataRef.current !== dataString) {
    if (renderCount.current > 1) {
      console.log(`[Quiz] 🔄 RENDER #${renderCount.current} - DATA CHANGED`);
    }
    prevDataRef.current = dataString;
  }
  
  const { execute: submitAnswer, isLoading: isSubmitting } = useSubmitAnswer();
  const { execute: fetchUserSkills, isLoading: isFetchingSkills } = useGetUserSkills();
  const { removePendingChallenge } = useNotificationStore();
  const { setSkillPendingChallenges, getCachedPendingChallenges } = useSkillsStore();
    
  // Combined loading state for the entire finish flow
  const isProcessing = isSubmitting || isFetchingSkills;
    
  // Store quiz result for optimistic update
  const [quizResult, setQuizResult] = useState<QuizResultData | null>(null);

  // MEMOIZE quizKey based on challenge data
  const quizKey = useMemo(() => {
    const key = Array.isArray(data)
      ? data.map((q) => q.id).join("-")
      : data.id;
    
    if (prevQuizKey.current && prevQuizKey.current !== String(key)) {
      console.log(`[Quiz] 🔑 quizKey changed: ${prevQuizKey.current} → ${key}`);
    }
    prevQuizKey.current = String(key);
    return key;
  }, [data]);
    
  // Extract question data (single question mode for skills)
  // MEMOIZE to prevent useEffect from running unnecessarily
  const questionData = useMemo<MCQQuestion>(() => {
    return Array.isArray(data) ? data[0] : data;
  }, [data]);
  
  if (renderCount.current === 1) {
    console.log(`[Quiz] 🎯 FIRST RENDER - challengeId: ${challengeId}, quizKey: ${quizKey}`);
  } else if (renderCount.current % 10 === 0) {
    console.log(`[Quiz] ⚠️ RENDER #${renderCount.current} - possible infinite loop!`);
  }

  // Add challenge to pending list on mount ONLY - use ref to track if already added
  const hasAddedChallenge = useRef(false);
  
  useEffect(() => {
    // Only run once per mount - prevent infinite re-adds
    if (hasAddedChallenge.current) {
      return;
    }
    
    if (challengeId && questionData && skillId) {
      console.log(`[Quiz] ➕ Adding challenge to pending list: ${challengeId} (render #${renderCount.current})`);
      
      // Get addPendingChallenge from store directly (stable reference)
      const { addPendingChallenge } = useNotificationStore.getState();
      
      // Create a challenge object to add to the pending list
      const challenge: Challenge = {
        challengeId: challengeId,
        skillId: skillId,
        skillName: skill || '',
        question: questionData.question,
        options: questionData.answers.map(a => a.text),
        difficulty: 5, // Default difficulty
        createdAt: new Date().toISOString(),
      };
      
      addPendingChallenge(challenge);
      hasAddedChallenge.current = true;
    }
  // Only depend on the initial mount, not on changing references
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitAnswer = async (answerData: AnswerSubmissionData) => {
    try {
      console.log('[Quiz] 📝 Submitting answer:', {
        challengeId: answerData.challengeId,
        selectedOption: answerData.selectedOption,
        confidence: answerData.confidence,
      });

      const result = await submitAnswer({
        challengeId: answerData.challengeId,
        userId: answerData.userId,
        selectedOption: answerData.selectedOption,
        responseTime: answerData.responseTime,
        confidence: answerData.confidence || undefined,
        userFeedback: answerData.userFeedback,
      });

      // Store result for optimistic update
      setQuizResult({
        ...result,
        selectedOption: answerData.selectedOption,
        responseTime: answerData.responseTime,
        confidence: answerData.confidence,
      });

      // Remove the challenge from pending notifications immediately after successful submission
      // This updates the badge count while the loading spinner is still visible for skill progress fetching
      if (answerData.challengeId) {
        // Get the challenge from the store to find its notification identifier (if from push notification)
        const { pendingChallenges } = useNotificationStore.getState();
        
        const challenge = pendingChallenges.find(c => c.challengeId === answerData.challengeId) as ChallengeWithNotification | undefined;
        
        // Clear the OS notification if it has a notification identifier
        if (challenge?.notificationIdentifier) {
          clearNotification(challenge.notificationIdentifier);
        }
        
        removePendingChallenge(answerData.challengeId);
        
        // Also remove from skillsStore cache to ensure assessment page is updated
        if (skillId) {
          const currentPending = getCachedPendingChallenges(skillId) || [];
          const updatedPending = currentPending.filter(c => c.challengeId !== answerData.challengeId);
          setSkillPendingChallenges(skillId, updatedPending);
        }
        // Emit notification event to refresh badge count immediately
        notificationEventEmitter.emit();
      }

    } catch (error) {
      console.error('[Quiz] ❌ Failed to submit answer:', error);
      Alert.alert(
        'Error',
        'Failed to submit your answer. Please try again.'
      );
      throw error;
    }
  };

  const handleFinish = async () => {
    // Only proceed if quiz was completed and answer was submitted successfully
    if (quizResult && questionData && skillId && userId) {
      const answeredChallenge = {
        answerId: `temp-${Date.now()}`, // Temporary ID until server assigns one
        challengeId: challengeId,
        skillId: skillId,
        skillName: skill,
        difficulty: 5, // Default, could be passed in params
        question: questionData.question,
        options: questionData.answers.map(a => a.text),
        selectedOption: quizResult.selectedOption,
        correctOption: quizResult.correctOption,
        isCorrect: quizResult.isCorrect,
        explanation: quizResult.explanation,
        responseTime: quizResult.responseTime,
        confidence: quizResult.confidence,
        answeredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      try {
        // Fetch current skill progress from API
        console.log('[Quiz] 🔄 Fetching skill progress for navigation...');
        const userSkills = await fetchUserSkills({ userId });
        const skillData = userSkills?.find(s => s.skillId === skillId);
        const progress = skillData ? skillData.accuracy * 100 : 0;
        
        console.log('[Quiz] ✅ Navigating to assessment with progress:', progress);
        
        // Challenge already removed from pending in handleSubmitAnswer
        // Navigate explicitly to assessment with all required params
        navigateTo('assessment', { 
          skill, 
          skillId, 
          progress,
          answeredChallenge: JSON.stringify(answeredChallenge),
        });
      } catch (error) {
        console.error('[Quiz] ❌ Failed to fetch skill progress:', error);
        // Fallback: navigate without progress data
        navigateTo('assessment', { 
          skill, 
          skillId, 
          progress: 0,
          answeredChallenge: JSON.stringify(answeredChallenge),
        });
      }
    } else if (skill && skillId) {
      // If quiz was not completed but we have route params, navigate to assessment
      navigateTo('assessment', { 
        skill, 
        skillId,
      });
    } else {
      // Fallback: navigate to skills if no route params available
      router.navigate('/(tabs)/(skills)');
    }
  };

  return (
    <MCQQuiz
      key={quizKey}
      data={data}
      onFinish={handleFinish}
      challengeId={challengeId}
      userId={userId || ''}
      onSubmitAnswer={handleSubmitAnswer}
      isFinishing={isProcessing}
    />
  );
};

export default SkillAssessmentScreen;
