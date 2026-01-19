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
