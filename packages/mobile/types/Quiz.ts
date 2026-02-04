import type { GetPendingChallengesResponse, GetChallengeResponse } from "@learning-platform/shared";

export type MCQItem = {
  id: number;
  question: string;
  isCorrect?: boolean;
  timestamp?: string;
};

// types/quiz.types.ts (or in navigation.ts)
import z from "zod";

// Zod schemas
export const MCQAnswerSchema = z.object({
  id: z.number(),
  text: z.string(),
});

export const MCQQuestionSchema = z.object({
  id: z.number(),
  question: z.string(),
  answers: z.array(MCQAnswerSchema),
  correctAnswerId: z.number(),
  explanation: z.string(),
});

export const QuizStateSchema = z.union([
  MCQQuestionSchema,
  z.array(MCQQuestionSchema),
]);

// TypeScript types (inferred from Zod - single source of truth!)
export type MCQAnswer = z.infer<typeof MCQAnswerSchema>;
export type MCQQuestion = z.infer<typeof MCQQuestionSchema>;
export type QuizState = z.infer<typeof QuizStateSchema>;

// Challenge types from shared
export type Challenge = GetPendingChallengesResponse[number];
export type FullChallenge = GetChallengeResponse;

// Extended challenge type that includes notification identifier for OS notification management
// Used when challenge is received via push notification
export type ChallengeWithNotification = Challenge & {
  notificationIdentifier?: string;
};

/**
 * Helper function to convert a Challenge (full or partial) to MCQQuestion format
 * This maps backend Challenge schema to the format MCQQuiz expects
 * 
 * When using a FullChallenge (from GET /challenges/:id), correctAnswerId and explanation
 * will be populated from the backend. When using a pending challenge, these will be 0/empty.
 */
export function challengeToMCQQuestion(challenge: Challenge | FullChallenge): MCQQuestion {
  // Check if this is a full challenge by looking for correctOption property
  const isFullChallenge = 'correctOption' in challenge;
  
  // Get the challenge ID - full challenge uses 'id', pending uses 'challengeId'
  const challengeId = isFullChallenge 
    ? (challenge as FullChallenge).id 
    : (challenge as Challenge).challengeId;
  
  return {
    id: parseInt(challengeId.slice(0, 8), 16), // Convert UUID to number for component use
    question: challenge.question,
    answers: challenge.options.map((option, index) => ({
      id: index,
      text: option,
    })),
    correctAnswerId: isFullChallenge ? (challenge as FullChallenge).correctOption : 0,
    explanation: isFullChallenge ? (challenge as FullChallenge).explanation || "" : "",
  };
}
