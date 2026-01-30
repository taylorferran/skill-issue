import type { GetPendingChallengesResponse } from "@learning-platform/shared";

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

// Challenge type from shared
export type Challenge = GetPendingChallengesResponse[number];

/**
 * Helper function to convert a Challenge to MCQQuestion format
 * This maps backend Challenge schema to the format MCQQuiz expects
 */
export function challengeToMCQQuestion(challenge: Challenge): MCQQuestion {
  return {
    id: parseInt(challenge.challengeId.slice(0, 8), 16), // Convert UUID to number for component use
    question: challenge.question,
    answers: challenge.options.map((option, index) => ({
      id: index,
      text: option,
    })),
    correctAnswerId: 0, // Will be determined after answer submission
    explanation: "", // Will be populated after answer submission
  };
}
