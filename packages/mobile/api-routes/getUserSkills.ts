import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { useSkillsStore } from "@/stores/skillsStore";
import { GetUserSkillsResponseSchema } from "@learning-platform/shared";
import { z } from "zod";

// Request schema for path parameters
const GetUserSkillsPathSchema = z.object({
  userId: z.string().uuid(),
});

/**
 * Hook for fetching user's enrolled skills with automatic caching
 * GET /users/:userId/skills
 * 
 * Data is automatically cached and returned immediately while fresh data is fetched in background.
 * 
 * @example
 * const { data, isLoading, error, execute, clearCache } = useGetUserSkills();
 * 
 * // On mount: returns cached data immediately, fetches fresh data in background
 * // data = cached data initially, auto-updates when API returns
 * 
 * // Manual refresh
 * await execute({ userId: "uuid-here" });
 */
export const useGetUserSkills = buildApiEndpointHook(
  {
    method: 'GET',
    apiInstance: 'backend',
    url: '/users/:userId/skills',
    requestSchema: GetUserSkillsPathSchema,
    responseSchema: GetUserSkillsResponseSchema,
    paramType: "Path"
  },
  {
    useStore: useSkillsStore,
    storageKey: (params) => `userSkills:${params?.userId || 'default'}`,
  }
);
