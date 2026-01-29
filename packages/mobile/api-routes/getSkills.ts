import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { GetSkillsResponseSchema } from "@learning-platform/shared";

/**
 * Hook for fetching all available skills
 * GET /skills
 * 
 * @example
 * const { execute, data, isLoading, error } = useGetSkills();
 * 
 * // Call without parameters
 * const allSkills = await execute();
 */
export const useGetSkills = buildApiEndpointHook({
  method: 'GET',
  apiInstance: 'backend',
  url: '/skills',
  responseSchema: GetSkillsResponseSchema,
});
