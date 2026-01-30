import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { GetPendingChallengesResponseSchema } from "@learning-platform/shared";
import { z } from "zod";

// Request schema for path parameters
const GetPendingChallengesPathSchema = z.object({
  userId: z.string().uuid(),
});

/**
 * Hook for fetching user's pending challenges
 * GET /users/:userId/challenges/pending
 * 
 * @example
 * const { execute, data, isLoading, error } = useGetPendingChallenges();
 * 
 * // Call with userId as path parameter
 * const challenges = await execute({ userId: "uuid-here" });
 */
export const useGetPendingChallenges = buildApiEndpointHook({
  method: 'GET',
  apiInstance: 'backend',
  url: '/users/:userId/challenges/pending',
  requestSchema: GetPendingChallengesPathSchema,
  responseSchema: GetPendingChallengesResponseSchema,
  paramType: "Path"
});
