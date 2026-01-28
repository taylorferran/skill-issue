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
  customTemplate?: string;
}

export interface SkillUpdateRequest {
  userId: string;
  skillId: string;
  isCorrect: boolean;
  responseTimeMs: number;
  difficulty: number;
}

// ============= LLM Types =============
export interface LLMUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface GeneratedChallengeWithUsage {
  challenge: GeneratedChallenge;
  usage: LLMUsage;
  prompt: string;      // The actual prompt sent to the LLM
  rawResponse: string; // The raw LLM response before parsing
}

export interface LLMProvider {
  generateChallenge(request: ChallengeDesignRequest): Promise<GeneratedChallengeWithUsage>;
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
export interface OpikConfig {
  apiKey?: string;
  workspace?: string;
  projectName?: string;
}

export type SpanType = 'general' | 'tool' | 'llm' | 'guardrail';

export interface OpikErrorInfo {
  exception_type: string;
  message?: string;
  traceback: string;
}

export interface OpikTrace {
  id: string;
  project_name: string;
  name: string;
  start_time: string;
  end_time?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  tags?: string[];
  error_info?: OpikErrorInfo;
  thread_id?: string;
}

export interface OpikSpan {
  id: string;
  trace_id: string;
  parent_span_id?: string;
  project_name: string;
  name: string;
  type: SpanType;
  start_time: string;
  end_time?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  model?: string;
  provider?: string;
  tags?: string[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error_info?: OpikErrorInfo;
  total_estimated_cost?: number;
}

export interface OpikPrompt {
  id?: string;
  name: string;
  template: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface OpikFeedbackScore {
  name: string;
  value: number;
  source: 'ui' | 'sdk' | 'online_scoring';
  category_name?: string;
  reason?: string;
}

// Legacy type for backwards compatibility
export interface OpikTraceParams {
  name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

// LLM response with usage info
export interface LLMResponse<T> {
  data: T;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}
