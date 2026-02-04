import React, { useState } from "react";
import { router } from "expo-router";
import { MCQQuiz } from "@/components/mcq-quiz/quiz/MCQQuiz";
import { useRouteParams, navigateTo } from "@/navigation/navigation";
import { useUser } from "@/contexts/UserContext";
import { useSubmitAnswer } from "@/api-routes/submitAnswer";
import { useGetUserSkills } from "@/api-routes/getUserSkills";
import { Alert } from "react-native";
import type { AnswerChallengeResponse } from "@learning-platform/shared";
import type { MCQQuestion } from "@/types/Quiz";
import { notificationEventEmitter } from "@/utils/notificationEvents";

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
  const { execute: submitAnswer, isLoading: isSubmitting } = useSubmitAnswer();
  const { execute: fetchUserSkills, isLoading: isFetchingSkills } = useGetUserSkills();
  
  // Combined loading state for the entire finish flow
  const isProcessing = isSubmitting || isFetchingSkills;
  
  // Store quiz result for optimistic update
  const [quizResult, setQuizResult] = useState<QuizResultData | null>(null);

  const quizKey = Array.isArray(data)
    ? data.map((q) => q.id).join("-")
    : data.id;
  
  // Extract question data (single question mode for skills)
  const questionData: MCQQuestion = Array.isArray(data) ? data[0] : data;

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

      // Emit notification event to refresh pending challenges in header
      notificationEventEmitter.emit();

      console.log('[Quiz] ✅ Answer submitted successfully:', result);
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
    // Construct answered challenge data for optimistic update
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
    } else {
      // If missing data, just go back
      router.back();
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
