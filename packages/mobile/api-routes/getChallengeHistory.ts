import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { useSkillsStore } from "@/stores/skillsStore";
import { GetChallengeHistoryResponseSchema } from "@learning-platform/shared";
import { z } from "zod";

// Request schema for path and query parameters - API only needs userId, limit, offset
const GetChallengeHistoryRequestSchema = z.object({
  userId: z.string().uuid(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

// Storage key parameters - separate from API request
interface ChallengeHistoryStorageParams {
  skillId: string | null | undefined;
}

/**
 * Hook for fetching user's challenge history with per-skill caching
 * GET /users/:userId/challenges/history
 * 
 * Each skill assessment page has its own isolated cache.
 * Pass storageProps on hook initialization for instant cache loading:
 * 
 * @example
 * const { execute, data, isLoading, error } = useGetChallengeHistory({
 *   storageProps: { skillId: 'skill-uuid' }  // Type-safe cache key
 * });
 * 
 * // Call with userId and pagination - returns cached data first, then updates
 * const history = await execute({ 
 *   userId: "uuid-here",
 *   limit: 20,
 *   offset: 0
 * });
 */
export const useGetChallengeHistory = buildApiEndpointHook<
  typeof GetChallengeHistoryRequestSchema,
  typeof GetChallengeHistoryResponseSchema,
  typeof useSkillsStore,
  ChallengeHistoryStorageParams
>(
  {
    method: 'GET',
    apiInstance: 'backend',
    url: '/users/:userId/challenges/history',
    requestSchema: GetChallengeHistoryRequestSchema,
    responseSchema: GetChallengeHistoryResponseSchema,
    paramType: "PathAndQuery",
  },
  {
    useStore: useSkillsStore,
    // Type-safe storage key function - handles null/undefined skillId gracefully
    storageKey: (params: ChallengeHistoryStorageParams) => 
      `assessment-${params?.skillId || 'default'}-history`,
  }
);
