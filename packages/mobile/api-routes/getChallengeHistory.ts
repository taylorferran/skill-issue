import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { GetChallengeHistoryResponseSchema } from "@learning-platform/shared";
import { z } from "zod";

// Combined request schema for path and query parameters
const GetChallengeHistoryRequestSchema = z.object({
  userId: z.string().uuid(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

/**
 * Hook for fetching user's challenge history
 * GET /users/:userId/challenges/history
 * 
 * @example
 * const { execute, data, isLoading, error } = useGetChallengeHistory();
 * 
 * // Call with userId and optional pagination
 * const history = await execute({ 
 *   userId: "uuid-here",
 *   limit: 20,
 *   offset: 0
 * });
 */
export const useGetChallengeHistory = buildApiEndpointHook({
  method: 'GET',
  apiInstance: 'backend',
  url: '/users/:userId/challenges/history',
  requestSchema: GetChallengeHistoryRequestSchema,
  responseSchema: GetChallengeHistoryResponseSchema,
  paramType: "PathAndQuery"
});
