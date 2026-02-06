import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { useSkillsStore } from "@/stores/skillsStore";
import { GetSkillsResponseSchema } from "@learning-platform/shared";

/**
 * Hook for fetching all available skills with caching
 * GET /skills
 * 
 * Returns cached data immediately and auto-fetches fresh data in background.
 * Cache is stored persistently using skills store.
 * 
 * @example
 * const { execute, data, isLoading, error } = useGetSkills();
 * 
 * // Call without parameters - returns cached data first, then updates
 * const allSkills = await execute();
 */
export const useGetSkills = buildApiEndpointHook(
  {
    method: 'GET',
    apiInstance: 'backend',
    url: '/skills',
    responseSchema: GetSkillsResponseSchema,
  },
  {
    useStore: useSkillsStore,
    storageKey: "availableSkills",
  }
);
