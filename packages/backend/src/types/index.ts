import { z } from 'zod';

// ============= User Types =============
export interface User {
  id: string;
  timezone: string;
  quietHoursStart?: number; // 0-23
  quietHoursEnd?: number; // 0-23
  maxChallengesPerDay: number;
  createdAt: Date;
}

// ============= Skill Types =============
export interface Skill {
  id: string;
  name: string;
  description: string;
  difficultySpec: any; // JSONB
  active: boolean;
  createdAt: Date;
}

export interface UserSkillState {
  id: string;
  userId: string;
  skillId: string;
  difficultyTarget: number;
  streakCorrect: number;
  streakIncorrect: number;
  attemptsTotal: number;
  correctTotal: number;
  lastChallengedAt?: Date;
  lastResult?: 'correct' | 'incorrect' | 'ignored';
  updatedAt: Date;
}

// ============= Challenge Types =============
export interface Challenge {
  id: string;
  skillId: string;
  userId: string;
  difficulty: number;
  type: 'mcq'; // Start with MCQ only
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string | null;
  generatedAt: Date;
  sentAt?: Date;
  answeredAt?: Date;
  userAnswer?: number;
  isCorrect?: boolean;
  responseTimeMs?: number;
  userConfidence?: number; // 1-5
}

export interface Answer {
  id: string;
  challengeId: string;
  userId: string;
  selectedOption: number;
  isCorrect: boolean;
  responseTime?: number;
  confidence?: number;
  userFeedback?: string;
  answeredAt: Date;
}

// Zod schemas for validation
export const AnswerChallengeSchema = z.object({
  challengeId: z.string().uuid(),
  answerIndex: z.number().int().min(0).max(3),
  confidence: z.number().int().min(1).max(5).optional(),
  responseTimeMs: z.number().int().positive(),
});

export type AnswerChallengeRequest = z.infer<typeof AnswerChallengeSchema>;

// ============= Agent Types =============
export interface SchedulingDecision {
  shouldChallenge: boolean;
  userId: string;
  skillId: string;
  difficultyTarget: number;
  reason: string;
  scheduledFor?: Date;
}

export interface ChallengeDesignRequest {
  skillId: string;
  skillName?: string;
  skillDescription?: string;
  difficulty: number;
  userId: string;
}

export interface SkillUpdateRequest {
  userId: string;
  skillId: string;
  isCorrect: boolean;
  responseTimeMs: number;
  difficulty: number;
}

// ============= LLM Types =============
export interface LLMProvider {
  generateChallenge(request: ChallengeDesignRequest): Promise<GeneratedChallenge>;
}

export interface GeneratedChallenge {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  actualDifficulty: number;
}

// ============= Push Notification Types =============
export interface PushNotification {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// ============= Opik Types =============
export interface OpikTraceParams {
  name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  tags?: string[];
}
