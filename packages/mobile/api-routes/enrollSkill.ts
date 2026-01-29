import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { 
  EnrollSkillRequestSchema,
  EnrollSkillResponseSchema 
} from "@learning-platform/shared";
import { z } from "zod";

// Combined schema for path + body parameters
const EnrollSkillCombinedSchema = z.object({
  userId: z.string().uuid(), // Path parameter
  skillId: z.string().uuid(), // Body parameter
  difficultyTarget: z.number().min(1).max(10).default(2).optional(), // Body parameter
});

/**
 * Hook for enrolling user in a new skill
 * POST /users/:userId/skills
 * 
 * @example
 * const { execute, isLoading } = useEnrollSkill();
 * 
 * // Call with userId (path) + skillId, difficultyTarget (body)
 * const enrollment = await execute({ 
 *   userId: "user-uuid",
 *   skillId: "skill-uuid",
 *   difficultyTarget: 2  // optional, defaults to 2
 * });
 * 
 * Note: The API layer will handle:
 * - userId as path parameter (replace :userId in URL)
 * - skillId and difficultyTarget as body parameters
 */
export const useEnrollSkill = buildApiEndpointHook({
  method: 'POST',
  apiInstance: 'backend',
  url: '/users/:userId/skills',
  requestSchema: EnrollSkillCombinedSchema,
  responseSchema: EnrollSkillResponseSchema,
  paramType: "PathAndBody" // Auto-detects :userId for path, sends skillId + difficultyTarget in body
});
