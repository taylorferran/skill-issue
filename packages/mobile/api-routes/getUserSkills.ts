import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { GetUserSkillsResponseSchema } from "@learning-platform/shared";
import { z } from "zod";

// Request schema for path parameters
const GetUserSkillsPathSchema = z.object({
  userId: z.string().uuid(),
});

/**
 * Hook for fetching user's enrolled skills
 * GET /users/:userId/skills
 * 
 * @example
 * const { execute, data, isLoading, error } = useGetUserSkills();
 * 
 * // Call with userId as path parameter
 * const skills = await execute({ userId: "uuid-here" });
 */
export const useGetUserSkills = buildApiEndpointHook({
  method: 'GET',
  apiInstance: 'backend',
  url: '/users/:userId/skills',
  requestSchema: GetUserSkillsPathSchema,
  responseSchema: GetUserSkillsResponseSchema,
  paramType: "Path" // Only has path params, no query params needed (could use PathAndQuery for future filtering)
});
