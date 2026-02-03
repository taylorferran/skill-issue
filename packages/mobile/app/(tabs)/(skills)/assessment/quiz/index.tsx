import React, { useState } from "react";
import { router } from "expo-router";
import { MCQQuiz } from "@/components/mcq-quiz/quiz/MCQQuiz";
import { useRouteParams } from "@/navigation/navigation";
import { useUser } from "@/contexts/UserContext";
import { useSubmitAnswer } from "@/api-routes/submitAnswer";
import { Alert } from "react-native";
import type { AnswerChallengeResponse } from "@learning-platform/shared";
import type { MCQQuestion } from "@/types/Quiz";

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
  const { data, challengeId, skill } = useRouteParams("quiz");
  const { userId } = useUser();
  const { execute: submitAnswer, isLoading: isSubmitting } = useSubmitAnswer();
  
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

  const handleFinish = () => {
    // Construct answered challenge data for optimistic update
    if (quizResult && questionData) {
      const answeredChallenge = {
        answerId: `temp-${Date.now()}`, // Temporary ID until server assigns one
        challengeId: challengeId,
        skillId: '', // Will be filled by assessment screen
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

      // Navigate back with answered challenge data
      router.back();
      
      // Use setTimeout to ensure the navigation completes before setting params
      setTimeout(() => {
        router.setParams({
          answeredChallenge: JSON.stringify(answeredChallenge),
        });
      }, 100);
    } else {
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
    />
  );
};

export default SkillAssessmentScreen;
