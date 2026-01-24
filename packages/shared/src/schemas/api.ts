import { z } from 'zod';

/**
 * Schema for submitting an answer to a challenge
 * POST /api/answer
 */
export const AnswerChallengeSchema = z.object({
  challengeId: z.string().uuid(),
  userId: z.string().uuid(),
  selectedOption: z.number().min(0).max(3),
  responseTime: z.number().positive().optional(),
  confidence: z.number().min(1).max(5).optional(),
  userFeedback: z.string().optional(),
});

/**
 * Schema for creating a new user
 * POST /api/users
 */
export const CreateUserSchema = z.object({
  id: z.string().uuid().optional(),
  deviceId: z.string().optional(),
  discordUserId: z.string().optional(),
  timezone: z.string().default('UTC'),
  quietHoursStart: z.number().min(0).max(23).optional(),
  quietHoursEnd: z.number().min(0).max(23).optional(),
  maxChallengesPerDay: z.number().min(1).max(100).default(5),
});

/**
 * Schema for updating user settings
 * PUT /api/users/:userId
 */
export const UpdateUserSchema = z.object({
  deviceId: z.string().optional(),
  timezone: z.string().optional(),
  quietHoursStart: z.number().min(0).max(23).optional(),
  quietHoursEnd: z.number().min(0).max(23).optional(),
  maxChallengesPerDay: z.number().min(1).max(100).optional(),
});

/**
 * Schema for enrolling a user in a skill
 * POST /api/users/:userId/skills
 */
export const EnrollSkillSchema = z.object({
  skillId: z.string().uuid(),
  difficultyTarget: z.number().min(1).max(10).default(2),
});

/**
 * Schema for updating user skill state
 * PUT /api/users/:userId/skills/:skillId
 */
export const UpdateUserSkillSchema = z.object({
  difficultyTarget: z.number().min(1).max(10).optional(),
});

// Export type inference helpers
export type AnswerChallengeInput = z.infer<typeof AnswerChallengeSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type EnrollSkillInput = z.infer<typeof EnrollSkillSchema>;
export type UpdateUserSkillInput = z.infer<typeof UpdateUserSkillSchema>;
