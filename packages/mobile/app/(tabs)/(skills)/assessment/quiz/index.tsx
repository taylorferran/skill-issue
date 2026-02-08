import React, { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MCQQuiz } from "@/components/mcq-quiz/quiz/MCQQuiz";
import { useRouteParams, navigateTo } from "@/navigation/navigation";
import { useUser } from "@/contexts/UserContext";
import { submitAnswer, skillsKeys, userKeys } from "@/api/routes";
import { Alert } from "react-native";
import type { AnswerChallengeResponse, GetChallengeHistoryResponse, GetUserSkillsResponse } from "@learning-platform/shared";
import type { MCQQuestion, Challenge, ChallengeWithNotification } from "@/types/Quiz";
import { notificationEventEmitter } from "@/utils/notificationEvents";
import { useNotificationStore } from "@/stores/notificationStore";
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
  const queryClient = useQueryClient();
  
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
  
  // TanStack Query Mutation for submitting answers
  const submitMutation = useMutation({
    mutationFn: submitAnswer,
    
    // Optimistic update before mutation
    onMutate: async (newAnswer) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: skillsKeys.history(userId || '', skillId || '') });
      await queryClient.cancelQueries({ queryKey: skillsKeys.user(userId || '') });
      
      // Snapshot the previous values for potential rollback
      const previousHistory = queryClient.getQueryData<GetChallengeHistoryResponse>(
        skillsKeys.history(userId || '', skillId || '')
      );
      const previousSkills = queryClient.getQueryData<GetUserSkillsResponse>(
        skillsKeys.user(userId || '')
      );
      
      // Create optimistic history entry
      const questionData = Array.isArray(data) ? data[0] : data;
      const optimisticAnswer = {
        answerId: `temp-${Date.now()}`,
        challengeId: newAnswer.challengeId,
        skillId: skillId || '',
        skillName: skill || '',
        difficulty: 5, // Default difficulty
        question: questionData?.question || '',
        options: questionData?.answers?.map((a: { text: string }) => a.text) || [],
        selectedOption: newAnswer.selectedOption,
        correctOption: -1, // Will be updated after submission
        isCorrect: false, // Will be updated after submission
        explanation: null,
        responseTime: newAnswer.responseTime,
        confidence: newAnswer.confidence,
        answeredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      
      // Optimistically update history cache
      queryClient.setQueryData(
        skillsKeys.history(userId || '', skillId || ''),
        (old: GetChallengeHistoryResponse | undefined) => [
          optimisticAnswer,
          ...(old || [])
        ]
      );
      
      // Return the previous values for rollback on error
      return { previousHistory, previousSkills, optimisticAnswer };
    },
    
    // If mutation fails, roll back to previous values
    onError: (err, newAnswer, context) => {
      console.error('[Quiz] ❌ Submission failed, rolling back optimistic update:', err);
      
      if (context?.previousHistory) {
        queryClient.setQueryData(
          skillsKeys.history(userId || '', skillId || ''),
          context.previousHistory
        );
      }
      if (context?.previousSkills) {
        queryClient.setQueryData(skillsKeys.user(userId || ''), context.previousSkills);
      }
      
      Alert.alert('Error', 'Failed to submit your answer. Please try again.');
    },
    
    // After success or error, update with real data or invalidate
    onSuccess: (result, variables, context) => {
      // Update the optimistic entry with real server data
      if (context?.optimisticAnswer && skillId) {
        const questionData = Array.isArray(data) ? data[0] : data;
        const finalAnswer = {
          ...context.optimisticAnswer,
          correctOption: result.correctOption,
          isCorrect: result.isCorrect,
          explanation: result.explanation,
        };
        
        queryClient.setQueryData(
          skillsKeys.history(userId || '', skillId),
          (old: GetChallengeHistoryResponse | undefined) => {
            if (!old) return [finalAnswer];
            // Replace the temp entry with the final one
            return old.map((entry) =>
              entry.answerId === context.optimisticAnswer?.answerId ? finalAnswer : entry
            );
          }
        );
        
        // Also invalidate user skills to refresh stats
        queryClient.invalidateQueries({ queryKey: skillsKeys.user(userId || '') });
        
        console.log('[Quiz] ✅ Updated cache with server response');
      }
    },
  });
  
  const { removePendingChallenge } = useNotificationStore();
  
  // Store quiz result for navigation
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
  const questionData = useMemo<MCQQuestion>(() => {
    return Array.isArray(data) ? data[0] : data;
  }, [data]);
  
  if (renderCount.current === 1) {
    console.log(`[Quiz] 🎯 FIRST RENDER - challengeId: ${challengeId}, quizKey: ${quizKey}`);
  } else if (renderCount.current % 10 === 0) {
    console.log(`[Quiz] ⚠️ RENDER #${renderCount.current} - possible infinite loop!`);
  }

  // Add challenge to pending list on mount ONLY
  const hasAddedChallenge = useRef(false);
  
  useEffect(() => {
    if (hasAddedChallenge.current) {
      return;
    }
    
    if (challengeId && questionData && skillId) {
      console.log(`[Quiz] ➕ Adding challenge to pending list: ${challengeId}`);
      
      const { addPendingChallenge } = useNotificationStore.getState();
      
      const challenge: Challenge = {
        challengeId: challengeId,
        skillId: skillId,
        skillName: skill || '',
        question: questionData.question,
        options: questionData.answers.map(a => a.text),
        difficulty: 5,
        createdAt: new Date().toISOString(),
      };
      
      addPendingChallenge(challenge);
      hasAddedChallenge.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitAnswer = async (answerData: AnswerSubmissionData) => {
    console.log('[Quiz] 📝 Submitting answer:', {
      challengeId: answerData.challengeId,
      selectedOption: answerData.selectedOption,
      confidence: answerData.confidence,
    });

    // Execute the mutation (onMutate handles optimistic updates)
    const result = await submitMutation.mutateAsync({
      challengeId: answerData.challengeId,
      userId: answerData.userId,
      selectedOption: answerData.selectedOption,
      responseTime: answerData.responseTime,
      confidence: answerData.confidence || undefined,
      userFeedback: answerData.userFeedback,
    });

    // Store result for navigation
    const quizResultData: QuizResultData = {
      ...result,
      selectedOption: answerData.selectedOption,
      responseTime: answerData.responseTime,
      confidence: answerData.confidence,
    };
    setQuizResult(quizResultData);

    // Remove the challenge from pending notifications
    if (answerData.challengeId) {
      const { pendingChallenges } = useNotificationStore.getState();
      
      const challenge = pendingChallenges.find(c => c.challengeId === answerData.challengeId) as ChallengeWithNotification | undefined;
      
      if (challenge?.notificationIdentifier) {
        clearNotification(challenge.notificationIdentifier);
      }
      
      removePendingChallenge(answerData.challengeId);
      
      // Emit notification event to refresh badge count
      notificationEventEmitter.emit();
    }
  };

  const handleFinish = async () => {
    if (quizResult && questionData && skillId && userId) {
      const answeredChallenge = {
        answerId: `temp-${Date.now()}`,
        challengeId: challengeId,
        skillId: skillId,
        skillName: skill,
        difficulty: 5,
        question: questionData.question,
        options: questionData.answers.map((a: { text: string }) => a.text),
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
        // Get current cache data from TanStack Query
        const cachedUserSkills = queryClient.getQueryData<GetUserSkillsResponse>(
          skillsKeys.user(userId)
        );
        const cachedHistory = queryClient.getQueryData<GetChallengeHistoryResponse>(
          skillsKeys.history(userId, skillId)
        );
        
        // Calculate progress from cached data
        const skillData = cachedUserSkills?.find((s) => s.skillId === skillId);
        const progress = skillData ? skillData.accuracy * 100 : 0;
        
        console.log('[Quiz] ✅ Navigating to assessment with cached data:', {
          progress,
          historyCount: cachedHistory?.length || 0,
        });
        
        // Navigate with initialData to prevent flicker
        navigateTo('assessment', { 
          skill, 
          skillId, 
          progress,
          answeredChallenge: JSON.stringify(answeredChallenge),
          initialData: {
            userSkills: cachedUserSkills,
            history: cachedHistory,
          },
        });
      } catch (error) {
        console.error('[Quiz] ❌ Failed to navigate with cached data:', error);
        // Fallback: navigate without initialData
        navigateTo('assessment', { 
          skill, 
          skillId, 
          progress: 0,
          answeredChallenge: JSON.stringify(answeredChallenge),
        });
      }
    } else if (skill && skillId) {
      navigateTo('assessment', { 
        skill, 
        skillId,
      });
    } else {
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
      isFinishing={submitMutation.isPending}
    />
  );
};

export default SkillAssessmentScreen;
