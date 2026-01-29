import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { DeleteSkillResponseSchema } from "@learning-platform/shared";
import { z } from "zod";

// Schema for path parameters (userId and skillId)
const DeleteSkillParamsSchema = z.object({
  userId: z.string().uuid(),
  skillId: z.string().uuid(),
});

/**
 * Hook for deleting/unenrolling a user from a skill
 * DELETE /users/:userId/skills/:skillId
 * 
 * @example
 * const { execute, isLoading } = useDeleteSkill();
 * 
 * // Call with userId and skillId as path parameters
 * const result = await execute({ 
 *   userId: "user-uuid",
 *   skillId: "skill-uuid"
 * });
 * 
 * Note: Both parameters are used in the URL path
 */
export const useDeleteSkill = buildApiEndpointHook({
  method: 'DELETE',
  apiInstance: 'backend',
  url: '/users/:userId/skills/:skillId',
  requestSchema: DeleteSkillParamsSchema,
  responseSchema: DeleteSkillResponseSchema,
  paramType: "Path" // Both userId and skillId are path parameters
});
