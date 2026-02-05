import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import {
  GenerateSkillDescriptionRequestSchema,
  GenerateSkillDescriptionResponseSchema,
} from "@learning-platform/shared";

/**
 * Hook for generating skill description from name
 * POST /skills/generate-description
 *
 * @example
 * const { execute, isLoading } = useGenerateSkillDescription();
 *
 * const result = await execute({ skillName: "Python Programming" });
 * // Returns: { skillName, description, isVague, message }
 */
export const useGenerateSkillDescription = buildApiEndpointHook({
  method: "POST",
  apiInstance: "backend",
  url: "/skills/generate-description",
  requestSchema: GenerateSkillDescriptionRequestSchema,
  responseSchema: GenerateSkillDescriptionResponseSchema,
  paramType: "Body",
});
