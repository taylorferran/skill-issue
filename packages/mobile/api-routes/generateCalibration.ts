import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { 
  GenerateCalibrationRequestSchema,
  GenerateCalibrationResponseSchema 
} from "@learning-platform/shared";

/**
 * Hook for generating calibration questions for a skill
 * POST /api/skills/:skillId/calibration/generate
 * 
 * @example
 * const { execute, isLoading } = useGenerateCalibration();
 * 
 * // Call to generate 10 calibration questions (difficulty 1-10)
 * const result = await execute({ 
 *   skillId: "skill-uuid"
 * });
 * // Returns: { skillId, skillName, status, questionsCount, message }
 */
export const useGenerateCalibration = buildApiEndpointHook({
  method: 'POST',
  apiInstance: 'backend',
  url: '/skills/:skillId/calibration/generate',
  requestSchema: GenerateCalibrationRequestSchema,
  responseSchema: GenerateCalibrationResponseSchema,
  paramType: "PathAndBody"
});
