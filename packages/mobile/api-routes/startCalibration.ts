import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { 
  StartCalibrationRequestSchema,
  StartCalibrationResponseSchema 
} from "@learning-platform/shared";

/**
 * Hook for starting a calibration session and retrieving questions
 * POST /api/users/:userId/skills/:skillId/calibration/start
 * 
 * @example
 * const { execute, isLoading } = useStartCalibration();
 * 
 * // Call to start calibration and get questions
 * const result = await execute({ 
 *   userId: "user-uuid",
 *   skillId: "skill-uuid"
 * });
 * // Returns: { userId, skillId, skillName, status, questions[], message }
 * // questions: [{ difficulty: 1-10, question: string, options: string[4] }]
 */
export const useStartCalibration = buildApiEndpointHook({
  method: 'POST',
  apiInstance: 'backend',
  url: '/users/:userId/skills/:skillId/calibration/start',
  requestSchema: StartCalibrationRequestSchema,
  responseSchema: StartCalibrationResponseSchema,
  paramType: "PathAndBody"
});
