import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import {
  CreateSkillRequestSchema,
  CreateSkillResponseSchema,
} from "@learning-platform/shared";

/**
 * Hook for creating a new skill
 * POST /skills
 *
 * @example
 * const { execute, isLoading } = useCreateSkill();
 *
 * const newSkill = await execute({
 *   name: "Python Programming",
 *   description: "Learn Python from basics to advanced concepts"
 * });
 */
export const useCreateSkill = buildApiEndpointHook({
  method: "POST",
  apiInstance: "backend",
  url: "/skills",
  requestSchema: CreateSkillRequestSchema,
  responseSchema: CreateSkillResponseSchema,
  paramType: "Body",
});
