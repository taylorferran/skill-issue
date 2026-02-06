import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { useSkillsStore } from "@/stores/skillsStore";
import { GetPendingChallengesResponseSchema } from "@learning-platform/shared";
import { z } from "zod";

// Request schema for path parameters
const GetPendingChallengesPathSchema = z.object({
  userId: z.string().uuid(),
});

// Storage key parameters - separate from API request
interface PendingChallengesStorageParams {
  skillId: string | null | undefined;
}

/**
 * Hook for fetching user's pending challenges with per-skill caching
 * GET /users/:userId/challenges/pending
 * 
 * Each skill assessment page has its own isolated cache.
 * Pass storageProps on hook initialization for instant cache loading:
 * 
 * @example
 * const { execute, data, isLoading, isFetching, error } = useGetPendingChallenges({
 *   storageProps: { skillId: 'skill-uuid' }  // Type-safe cache key
 * });
 * 
 * // Call with userId as path parameter - returns cached data first, then updates
 * const challenges = await execute({ userId: "uuid-here" });
 */
export const useGetPendingChallenges = buildApiEndpointHook(
  {
    method: 'GET',
    apiInstance: 'backend',
    url: '/users/:userId/challenges/pending',
    requestSchema: GetPendingChallengesPathSchema,
    responseSchema: GetPendingChallengesResponseSchema,
    paramType: "Path",
  },
  {
    useStore: useSkillsStore,
    // Type-safe storage key function - handles null/undefined skillId gracefully
    storageKey: (params: PendingChallengesStorageParams) =>
      `assessment-${params?.skillId || 'default'}-pending`,
  }
);
