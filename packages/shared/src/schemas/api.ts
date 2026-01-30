import { z } from 'zod';

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

/**
 * Request schema for submitting an answer to a challenge
 * POST /api/answer
 */
export const AnswerChallengeRequestSchema = z.object({
  challengeId: z.string().uuid(),
  userId: z.string().uuid(),
  selectedOption: z.number().min(0).max(3),
  responseTime: z.number().positive().optional(),
  confidence: z.number().min(1).max(5).optional(),
  userFeedback: z.string().optional(),
});

/**
 * Request schema for creating a new user
 * POST /api/users
 */
export const CreateUserRequestSchema = z.object({
  id: z.string().uuid().optional(),
  deviceId: z.string().optional(),
  timezone: z.string().default('UTC'),
  quietHoursStart: z.number().min(0).max(23).optional(),
  quietHoursEnd: z.number().min(0).max(23).optional(),
  maxChallengesPerDay: z.number().min(1).max(100).default(5),
});

/**
 * Request schema for updating user settings
 * PUT /api/users/:userId
 */
export const UpdateUserRequestSchema = z.object({
  deviceId: z.string().optional(),
  timezone: z.string().optional(),
  quietHoursStart: z.number().min(0).max(23).optional(),
  quietHoursEnd: z.number().min(0).max(23).optional(),
  maxChallengesPerDay: z.number().min(1).max(100).optional(),
});

/**
 * Request schema for enrolling a user in a skill
 * POST /api/users/:userId/skills
 */
export const EnrollSkillRequestSchema = z.object({
  skillId: z.string().uuid(),
  difficultyTarget: z.number().min(0).max(10).default(0),
});

/**
 * Request schema for generating skill description from name
 * POST /api/skills/generate-description
 */
export const GenerateSkillDescriptionRequestSchema = z.object({
  skillName: z.string().min(1).max(200),
});

/**
 * Request schema for creating a new skill
 * POST /api/skills
 */
export const CreateSkillRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
});

/**
 * Request schema for generating calibration questions
 * POST /api/skills/:skillId/calibration/generate
 */
export const GenerateCalibrationRequestSchema = z.object({
  skillId: z.string().uuid(),
});

/**
 * Request schema for starting calibration
 * POST /api/users/:userId/skills/:skillId/calibration/start
 */
export const StartCalibrationRequestSchema = z.object({
  userId: z.string().uuid(),
  skillId: z.string().uuid(),
});

/**
 * Request schema for submitting calibration answer
 * POST /api/users/:userId/skills/:skillId/calibration/answer
 */
export const SubmitCalibrationAnswerRequestSchema = z.object({
  difficulty: z.number().min(1).max(10),
  selectedOption: z.number().min(0).max(3),
  responseTime: z.number().positive().optional(),
});

/**
 * Request schema for completing calibration
 * POST /api/users/:userId/skills/:skillId/calibration/complete
 */
export const CompleteCalibrationRequestSchema = z.object({
  userId: z.string().uuid(),
  skillId: z.string().uuid(),
});

/**
 * Request schema for updating user skill state
 * PUT /api/users/:userId/skills/:skillId
 */
export const UpdateUserSkillRequestSchema = z.object({
  difficultyTarget: z.number().min(1).max(10).optional(),
});

/**
 * Request schema for deleting a user skill
 * DELETE /api/users/:userId/skills/:skillId
 */
export const DeleteSkillRequestSchema = z.object({
  userId: z.string().uuid(),
  skillId: z.string().uuid(),
});

/**
 * Request schema for sending a push notification
 * POST /api/push
 */
export const SendPushNotificationRequestSchema = z.object({
  pushToken: z.string(),
});

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Response schema for health check
 * GET /api/health
 */
export const HealthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
});

/**
 * Response schema for deleting a user skill
 * DELETE /api/users/:userId/skills/:skillId
 */
export const DeleteSkillResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

/**
 * Response schema for submitting an answer
 * POST /api/answer
 */
export const AnswerChallengeResponseSchema = z.object({
  isCorrect: z.boolean(),
  correctOption: z.number().min(0).max(3),
  explanation: z.string().nullable(),
});

/**
 * Response schema for getting a challenge
 * GET /api/challenges/:challengeId
 */
export const GetChallengeResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  skillId: z.string().uuid(),
  skillName: z.string(),
  difficulty: z.number().min(1).max(10),
  question: z.string(),
  options: z.array(z.string()).length(4),
  createdAt: z.string(),
});

/**
 * Response schema for getting user skills
 * GET /api/users/:userId/skills
 */
export const GetUserSkillsResponseSchema = z.array(
  z.object({
    skillId: z.string().uuid(),
    skillName: z.string(),
    skillDescription: z.string(),
    difficultyTarget: z.number().min(0).max(10),
    attemptsTotal: z.number().min(0),
    correctTotal: z.number().min(0),
    accuracy: z.number().min(0).max(1),
    streakCorrect: z.number().min(0),
    streakIncorrect: z.number().min(0),
    lastChallengedAt: z.string().nullable(),
    lastResult: z.enum(['correct', 'incorrect', 'ignored']).nullable(),
    needsCalibration: z.boolean(),
  })
);

/**
 * Response schema for getting challenge history
 * GET /api/users/:userId/challenges/history
 */
export const GetChallengeHistoryResponseSchema = z.array(
  z.object({
    answerId: z.string().uuid(),
    challengeId: z.string().uuid(),
    skillId: z.string().uuid(),
    skillName: z.string(),
    difficulty: z.number().min(1).max(10),
    question: z.string(),
    options: z.array(z.string()).length(4),
    selectedOption: z.number().min(0).max(3),
    correctOption: z.number().min(0).max(3),
    isCorrect: z.boolean(),
    explanation: z.string().nullable(),
    responseTime: z.number().nullable(),
    confidence: z.number().min(1).max(5).nullable(),
    answeredAt: z.string(),
    createdAt: z.string(),
  })
);

/**
 * Response schema for getting pending challenges
 * GET /api/users/:userId/challenges/pending
 */
export const GetPendingChallengesResponseSchema = z.array(
  z.object({
    challengeId: z.string().uuid(),
    skillId: z.string().uuid(),
    skillName: z.string(),
    difficulty: z.number().min(1).max(10),
    question: z.string(),
    options: z.array(z.string()).length(4),
    createdAt: z.string(),
  })
);

/**
 * Response schema for getting all skills
 * GET /api/skills
 */
export const GetSkillsResponseSchema = z.array(
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    active: z.boolean(),
  })
);

/**
 * Response schema for creating a user
 * POST /api/users
 */
export const CreateUserResponseSchema = z.object({
  id: z.string().uuid(),
  deviceId: z.string().nullable(),
  timezone: z.string(),
  quietHoursStart: z.number().min(0).max(23).nullable(),
  quietHoursEnd: z.number().min(0).max(23).nullable(),
  maxChallengesPerDay: z.number().min(1),
  createdAt: z.string(),
});

/**
 * Response schema for getting a user
 * GET /api/users/:userId
 */
export const GetUserResponseSchema = z.object({
  id: z.string().uuid(),
  deviceId: z.string().nullable(),
  timezone: z.string(),
  quietHoursStart: z.number().min(0).max(23).nullable(),
  quietHoursEnd: z.number().min(0).max(23).nullable(),
  maxChallengesPerDay: z.number().min(1),
  createdAt: z.string(),
});

/**
 * Response schema for getting all users
 * GET /api/users
 */
export const GetUsersResponseSchema = z.array(
  z.object({
    id: z.string().uuid(),
    deviceId: z.string().nullable(),
    timezone: z.string(),
    quietHoursStart: z.number().min(0).max(23).nullable(),
    quietHoursEnd: z.number().min(0).max(23).nullable(),
    maxChallengesPerDay: z.number().min(1),
    createdAt: z.string(),
  })
);

/**
 * Response schema for updating a user
 * PUT /api/users/:userId
 */
export const UpdateUserResponseSchema = z.object({
  id: z.string().uuid(),
  deviceId: z.string().nullable(),
  timezone: z.string(),
  quietHoursStart: z.number().min(0).max(23).nullable(),
  quietHoursEnd: z.number().min(0).max(23).nullable(),
  maxChallengesPerDay: z.number().min(1),
  createdAt: z.string(),
});

/**
 * Response schema for enrolling in a skill
 * POST /api/users/:userId/skills
 */
export const EnrollSkillResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  skillId: z.string().uuid(),
  skillName: z.string(),
  difficultyTarget: z.number().min(0).max(10),
  attemptsTotal: z.number().min(0),
  correctTotal: z.number().min(0),
  streakCorrect: z.number().min(0),
  streakIncorrect: z.number().min(0),
  lastChallengedAt: z.string().nullable(),
  lastResult: z.enum(['correct', 'incorrect', 'ignored']).nullable(),
  updatedAt: z.string(),
});

/**
 * Response schema for updating user skill
 * PUT /api/users/:userId/skills/:skillId
 */
export const UpdateUserSkillResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  skillId: z.string().uuid(),
  skillName: z.string(),
  difficultyTarget: z.number().min(0).max(10),
  attemptsTotal: z.number().min(0),
  correctTotal: z.number().min(0),
  streakCorrect: z.number().min(0),
  streakIncorrect: z.number().min(0),
  lastChallengedAt: z.string().nullable(),
  lastResult: z.enum(['correct', 'incorrect', 'ignored']).nullable(),
  updatedAt: z.string(),
});

/**
 * Response schema for generating skill description
 * POST /api/skills/generate-description
 */
export const GenerateSkillDescriptionResponseSchema = z.object({
  skillName: z.string(),
  description: z.string(),
  isVague: z.boolean(),
  message: z.string(),
});

/**
 * Response schema for creating a skill
 * POST /api/skills
 */
export const CreateSkillResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  active: z.boolean(),
  createdAt: z.string(),
});

/**
 * Response schema for generating calibration questions
 * POST /api/skills/:skillId/calibration/generate
 */
export const GenerateCalibrationResponseSchema = z.object({
  skillId: z.string().uuid(),
  skillName: z.string(),
  status: z.enum(['generated', 'already_exists']),
  questionsCount: z.number(),
  message: z.string(),
});

/**
 * Response schema for calibration question
 */
export const CalibrationQuestionSchema = z.object({
  difficulty: z.number().min(1).max(10),
  question: z.string(),
  options: z.array(z.string()).length(4),
});

/**
 * Response schema for starting calibration
 * POST /api/users/:userId/skills/:skillId/calibration/start
 */
export const StartCalibrationResponseSchema = z.object({
  userId: z.string().uuid(),
  skillId: z.string().uuid(),
  skillName: z.string(),
  status: z.enum(['ready', 'generating', 'completed']),
  questions: z.array(CalibrationQuestionSchema),
  message: z.string(),
});

/**
 * Response schema for submitting calibration answer
 * POST /api/users/:userId/skills/:skillId/calibration/answer
 */
export const SubmitCalibrationAnswerResponseSchema = z.object({
  isCorrect: z.boolean(),
  correctOption: z.number().min(0).max(3),
  explanation: z.string().nullable(),
  progress: z.object({
    answered: z.number(),
    total: z.number(),
  }),
});

/**
 * Response schema for completing calibration
 * POST /api/users/:userId/skills/:skillId/calibration/complete
 */
export const CompleteCalibrationResponseSchema = z.object({
  userId: z.string().uuid(),
  skillId: z.string().uuid(),
  skillName: z.string(),
  difficultyTarget: z.number().min(1).max(10),
  calibrationResults: z.object({
    totalAnswered: z.number(),
    totalCorrect: z.number(),
    accuracy: z.number(),
    averageCorrectDifficulty: z.number(),
  }),
  message: z.string(),
});

/**
 * Response schema for scheduler tick
 * POST /api/scheduler/tick
 */
export const SchedulerTickResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  timestamp: z.string(),
  error: z.string().optional(),
});

/**
 * Response schema for push notification
 * POST /api/push
 */
export const SendPushNotificationResponseSchema = z.object({
  success: z.boolean(),
  ticketId: z.string().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Generic error response schema
 * Used across all endpoints
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
  message: z.string().optional(),
});

// ============================================================================
// TYPE INFERENCE HELPERS
// ============================================================================

// Request types
export type AnswerChallengeRequest = z.infer<typeof AnswerChallengeRequestSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type EnrollSkillRequest = z.infer<typeof EnrollSkillRequestSchema>;
export type UpdateUserSkillRequest = z.infer<typeof UpdateUserSkillRequestSchema>;
export type SendPushNotificationRequest = z.infer<typeof SendPushNotificationRequestSchema>;
export type DeleteSkillRequest = z.infer<typeof DeleteSkillRequestSchema>;
export type GenerateSkillDescriptionRequest = z.infer<typeof GenerateSkillDescriptionRequestSchema>;
export type CreateSkillRequest = z.infer<typeof CreateSkillRequestSchema>;
export type GenerateCalibrationRequest = z.infer<typeof GenerateCalibrationRequestSchema>;
export type StartCalibrationRequest = z.infer<typeof StartCalibrationRequestSchema>;
export type SubmitCalibrationAnswerRequest = z.infer<typeof SubmitCalibrationAnswerRequestSchema>;
export type CompleteCalibrationRequest = z.infer<typeof CompleteCalibrationRequestSchema>;

// Response types
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type AnswerChallengeResponse = z.infer<typeof AnswerChallengeResponseSchema>;
export type GetChallengeResponse = z.infer<typeof GetChallengeResponseSchema>;
export type GetUserSkillsResponse = z.infer<typeof GetUserSkillsResponseSchema>;
export type GetChallengeHistoryResponse = z.infer<typeof GetChallengeHistoryResponseSchema>;
export type GetPendingChallengesResponse = z.infer<typeof GetPendingChallengesResponseSchema>;
export type GetSkillsResponse = z.infer<typeof GetSkillsResponseSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type GetUsersResponse = z.infer<typeof GetUsersResponseSchema>;
export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;
export type UpdateUserResponse = z.infer<typeof UpdateUserResponseSchema>;
export type EnrollSkillResponse = z.infer<typeof EnrollSkillResponseSchema>;
export type UpdateUserSkillResponse = z.infer<typeof UpdateUserSkillResponseSchema>;
export type DeleteSkillResponse = z.infer<typeof DeleteSkillResponseSchema>;
export type SchedulerTickResponse = z.infer<typeof SchedulerTickResponseSchema>;
export type SendPushNotificationResponse = z.infer<typeof SendPushNotificationResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type GenerateSkillDescriptionResponse = z.infer<typeof GenerateSkillDescriptionResponseSchema>;
export type CreateSkillResponse = z.infer<typeof CreateSkillResponseSchema>;
export type GenerateCalibrationResponse = z.infer<typeof GenerateCalibrationResponseSchema>;
export type StartCalibrationResponse = z.infer<typeof StartCalibrationResponseSchema>;
export type SubmitCalibrationAnswerResponse = z.infer<typeof SubmitCalibrationAnswerResponseSchema>;
export type CompleteCalibrationResponse = z.infer<typeof CompleteCalibrationResponseSchema>;
export type CalibrationQuestion = z.infer<typeof CalibrationQuestionSchema>;
