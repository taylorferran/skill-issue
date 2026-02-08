import { z } from 'zod';
import { apiFetch, ParamType } from './fetch-utils';
import type {
  // Request types
  AnswerChallengeRequest,
  CreateUserRequest,
  UpdateUserRequest,
  EnrollSkillRequest,
  UpdateUserSkillRequest,
  DeleteSkillRequest,
  GenerateSkillDescriptionRequest,
  CreateSkillRequest,
  GenerateCalibrationRequest,
  StartCalibrationRequest,
  SubmitCalibrationAnswerRequest,
  CompleteCalibrationRequest,
  // Response types
  AnswerChallengeResponse,
  GetChallengeResponse,
  GetUserSkillsResponse,
  GetChallengeHistoryResponse,
  GetPendingChallengesResponse,
  GetSkillsResponse,
  CreateUserResponse,
  GetUserResponse,
  UpdateUserResponse,
  EnrollSkillResponse,
  UpdateUserSkillResponse,
  DeleteSkillResponse,
  GenerateSkillDescriptionResponse,
  CreateSkillResponse,
  GenerateCalibrationResponse,
  StartCalibrationResponse,
  SubmitCalibrationAnswerResponse,
  CompleteCalibrationResponse,
  SchedulerTickResponse,
  SendPushNotificationResponse,
} from '@learning-platform/shared';

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

/**
 * Query keys for skills-related queries
 */
export const skillsKeys = {
  all: ['skills'] as const,
  lists: () => [...skillsKeys.all, 'list'] as const,
  list: (filters: { active?: boolean } = {}) =>
    [...skillsKeys.lists(), filters] as const,
  user: (userId: string) => [...skillsKeys.all, 'user', userId] as const,
  history: (userId: string, skillId: string) =>
    [...skillsKeys.all, 'history', userId, skillId] as const,
  pending: (userId: string) => [...skillsKeys.all, 'pending', userId] as const,
  detail: (skillId: string) => [...skillsKeys.all, 'detail', skillId] as const,
};

/**
 * Query keys for user-related queries
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  detail: (userId: string) => [...userKeys.all, 'detail', userId] as const,
};

/**
 * Query keys for challenge-related queries
 */
export const challengeKeys = {
  all: ['challenges'] as const,
  detail: (challengeId: string) =>
    [...challengeKeys.all, 'detail', challengeId] as const,
};

/**
 * Query keys for calibration-related queries
 */
export const calibrationKeys = {
  all: ['calibration'] as const,
  status: (userId: string, skillId: string) =>
    [...calibrationKeys.all, 'status', userId, skillId] as const,
};

// ============================================================================
// REQUEST SCHEMAS (for runtime validation)
// ============================================================================

const UserIdPathSchema = z.object({
  userId: z.string().uuid(),
});

const ChallengeIdPathSchema = z.object({
  challengeId: z.string().uuid(),
});

const SkillIdPathSchema = z.object({
  skillId: z.string().uuid(),
});

const UserIdSkillIdPathSchema = z.object({
  userId: z.string().uuid(),
  skillId: z.string().uuid(),
});

const ChallengeHistoryQuerySchema = z.object({
  userId: z.string().uuid(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

const SendPushSchema = z.object({
  pushToken: z.string(),
});

// ============================================================================
// FETCH FUNCTIONS FOR QUERIES (GET requests)
// ============================================================================

/**
 * Fetch all available skills
 * GET /skills
 */
export const fetchSkills = async (): Promise<GetSkillsResponse> => {
  return apiFetch(
    {
      method: 'GET',
      url: '/skills',
      paramType: undefined,
    }
  );
};

/**
 * Fetch user's enrolled skills
 * GET /users/:userId/skills
 */
export const fetchUserSkills = async (userId: string): Promise<GetUserSkillsResponse> => {
  return apiFetch(
    {
      method: 'GET',
      url: '/users/:userId/skills',
      requestSchema: UserIdPathSchema,
      paramType: 'Path',
    },
    { userId }
  );
};

/**
 * Fetch challenge history for a user
 * GET /users/:userId/challenges/history
 */
export const fetchChallengeHistory = async (
  userId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<GetChallengeHistoryResponse> => {
  const { limit = 10, offset = 0 } = options;

  return apiFetch(
    {
      method: 'GET',
      url: '/users/:userId/challenges/history',
      requestSchema: ChallengeHistoryQuerySchema,
      paramType: 'PathAndQuery',
    },
    { userId, limit, offset }
  );
};

/**
 * Fetch pending challenges for a user
 * GET /users/:userId/challenges/pending
 */
export const fetchPendingChallenges = async (userId: string): Promise<GetPendingChallengesResponse> => {
  return apiFetch(
    {
      method: 'GET',
      url: '/users/:userId/challenges/pending',
      requestSchema: UserIdPathSchema,
      paramType: 'Path',
    },
    { userId }
  );
};

/**
 * Fetch a single challenge by ID
 * GET /challenges/:challengeId
 */
export const fetchChallenge = async (challengeId: string): Promise<GetChallengeResponse> => {
  return apiFetch(
    {
      method: 'GET',
      url: '/challenges/:challengeId',
      requestSchema: ChallengeIdPathSchema,
      paramType: 'Path',
    },
    { challengeId }
  );
};

/**
 * Fetch a user by ID
 * GET /users/:userId
 */
export const fetchUser = async (userId: string): Promise<GetUserResponse> => {
  return apiFetch(
    {
      method: 'GET',
      url: '/users/:userId',
      requestSchema: UserIdPathSchema,
      paramType: 'Path',
    },
    { userId }
  );
};

// ============================================================================
// MUTATION FUNCTIONS (POST/PUT/DELETE requests)
// ============================================================================

/**
 * Submit an answer to a challenge
 * POST /answer
 */
export const submitAnswer = async (data: AnswerChallengeRequest): Promise<AnswerChallengeResponse> => {
  return apiFetch(
    {
      method: 'POST',
      url: '/answer',
      requestSchema: z.object({
        challengeId: z.string().uuid(),
        userId: z.string().uuid(),
        selectedOption: z.number().min(0).max(3),
        responseTime: z.number().positive().optional(),
        confidence: z.number().min(1).max(5).optional(),
        userFeedback: z.string().optional(),
      }),
      paramType: 'Body',
    },
    data
  );
};

/**
 * Create a new user
 * POST /users
 */
export const createUser = async (data: CreateUserRequest): Promise<CreateUserResponse> => {
  return apiFetch(
    {
      method: 'POST',
      url: '/users',
      requestSchema: z.object({
        id: z.string().uuid().optional(),
        deviceId: z.string().optional(),
        timezone: z.string().default('UTC'),
        quietHoursStart: z.number().min(0).max(23).optional(),
        quietHoursEnd: z.number().min(0).max(23).optional(),
        maxChallengesPerDay: z.number().min(1).max(100).default(5),
      }),
      paramType: 'Body',
    },
    data
  );
};

/**
 * Update user settings
 * PUT /users/:userId
 */
export const updateUser = async (
  userId: string,
  data: UpdateUserRequest
): Promise<UpdateUserResponse> => {
  return apiFetch(
    {
      method: 'PUT',
      url: '/users/:userId',
      requestSchema: z.object({
        userId: z.string().uuid(),
        deviceId: z.string().optional(),
        timezone: z.string().optional(),
        quietHoursStart: z.number().min(0).max(23).optional(),
        quietHoursEnd: z.number().min(0).max(23).optional(),
        maxChallengesPerDay: z.number().min(1).max(100).optional(),
      }),
      paramType: 'PathAndBody',
    },
    { userId, ...data }
  );
};

/**
 * Enroll a user in a skill
 * POST /users/:userId/skills
 */
export const enrollSkill = async (
  userId: string,
  data: EnrollSkillRequest
): Promise<EnrollSkillResponse> => {
  return apiFetch(
    {
      method: 'POST',
      url: '/users/:userId/skills',
      requestSchema: z.object({
        userId: z.string().uuid(),
        skillId: z.string().uuid(),
        difficultyTarget: z.number().min(0).max(10).default(0),
      }),
      paramType: 'PathAndBody',
    },
    { userId, ...data }
  );
};

/**
 * Update user skill settings
 * PUT /users/:userId/skills/:skillId
 */
export const updateUserSkill = async (
  userId: string,
  skillId: string,
  data: UpdateUserSkillRequest
): Promise<UpdateUserSkillResponse> => {
  return apiFetch(
    {
      method: 'PUT',
      url: '/users/:userId/skills/:skillId',
      requestSchema: z.object({
        userId: z.string().uuid(),
        skillId: z.string().uuid(),
        difficultyTarget: z.number().min(1).max(10).optional(),
      }),
      paramType: 'PathAndBody',
    },
    { userId, skillId, ...data }
  );
};

/**
 * Delete a user skill enrollment
 * DELETE /users/:userId/skills/:skillId
 */
export const deleteSkill = async (userId: string, skillId: string): Promise<DeleteSkillResponse> => {
  return apiFetch(
    {
      method: 'DELETE',
      url: '/users/:userId/skills/:skillId',
      requestSchema: UserIdSkillIdPathSchema,
      paramType: 'Path',
    },
    { userId, skillId }
  );
};

/**
 * Generate skill description from name
 * POST /skills/generate-description
 */
export const generateSkillDescription = async (skillName: string): Promise<GenerateSkillDescriptionResponse> => {
  return apiFetch(
    {
      method: 'POST',
      url: '/skills/generate-description',
      requestSchema: z.object({
        skillName: z.string().min(1).max(200),
      }),
      paramType: 'Body',
    },
    { skillName }
  );
};

/**
 * Create a new skill
 * POST /skills
 */
export const createSkill = async (data: CreateSkillRequest): Promise<CreateSkillResponse> => {
  return apiFetch(
    {
      method: 'POST',
      url: '/skills',
      requestSchema: z.object({
        name: z.string().min(1).max(200),
        description: z.string().min(10).max(2000),
      }),
      paramType: 'Body',
    },
    data
  );
};

/**
 * Generate calibration questions for a skill
 * POST /skills/:skillId/calibration/generate
 */
export const generateCalibration = async (skillId: string): Promise<GenerateCalibrationResponse> => {
  return apiFetch(
    {
      method: 'POST',
      url: '/skills/:skillId/calibration/generate',
      requestSchema: SkillIdPathSchema,
      paramType: 'Path',
    },
    { skillId }
  );
};

/**
 * Start calibration for a user skill
 * POST /users/:userId/skills/:skillId/calibration/start
 */
export const startCalibration = async (userId: string, skillId: string): Promise<StartCalibrationResponse> => {
  return apiFetch(
    {
      method: 'POST',
      url: '/users/:userId/skills/:skillId/calibration/start',
      requestSchema: UserIdSkillIdPathSchema,
      paramType: 'Path',
    },
    { userId, skillId }
  );
};

/**
 * Submit a calibration answer
 * POST /users/:userId/skills/:skillId/calibration/answer
 */
export const submitCalibrationAnswer = async (
  userId: string,
  skillId: string,
  data: SubmitCalibrationAnswerRequest
): Promise<SubmitCalibrationAnswerResponse> => {
  return apiFetch(
    {
      method: 'POST',
      url: '/users/:userId/skills/:skillId/calibration/answer',
      requestSchema: z.object({
        userId: z.string().uuid(),
        skillId: z.string().uuid(),
        difficulty: z.number().min(1).max(10),
        selectedOption: z.number().min(0).max(3),
        responseTime: z.number().positive().optional(),
      }),
      paramType: 'PathAndBody',
    },
    { userId, skillId, ...data }
  );
};

/**
 * Complete calibration for a user skill
 * POST /users/:userId/skills/:skillId/calibration/complete
 */
export const completeCalibration = async (userId: string, skillId: string): Promise<CompleteCalibrationResponse> => {
  return apiFetch(
    {
      method: 'POST',
      url: '/users/:userId/skills/:skillId/calibration/complete',
      requestSchema: UserIdSkillIdPathSchema,
      paramType: 'Path',
    },
    { userId, skillId }
  );
};

/**
 * Trigger scheduler tick (admin/development)
 * POST /scheduler/tick
 */
export const triggerSchedulerTick = async (): Promise<SchedulerTickResponse> => {
  return apiFetch(
    {
      method: 'POST',
      url: '/scheduler/tick',
      paramType: undefined,
    }
  );
};

/**
 * Send push notification
 * POST /push
 */
export const sendPushNotification = async (pushToken: string): Promise<SendPushNotificationResponse> => {
  return apiFetch(
    {
      method: 'POST',
      url: '/push',
      requestSchema: SendPushSchema,
      paramType: 'Body',
    },
    { pushToken }
  );
};
