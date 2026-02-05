import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { 
  CompleteCalibrationRequestSchema,
  CompleteCalibrationResponseSchema 
} from "@learning-platform/shared";

/**
 * Hook for completing calibration and calculating difficulty target
 * POST /api/users/:userId/skills/:skillId/calibration/complete
 * 
 * @example
 * const { execute, isLoading } = useCompleteCalibration();
 * 
 * // Call after all 10 questions answered
 * const result = await execute({ 
 *   userId: "user-uuid",
 *   skillId: "skill-uuid"
 * });
 * // Returns: { 
 * //   userId, skillId, skillName, difficultyTarget, 
 * //   calibrationResults: { totalAnswered, totalCorrect, accuracy, averageCorrectDifficulty },
 * //   message 
 * // }
 */
export const useCompleteCalibration = buildApiEndpointHook({
  method: 'POST',
  apiInstance: 'backend',
  url: '/users/:userId/skills/:skillId/calibration/complete',
  requestSchema: CompleteCalibrationRequestSchema,
  responseSchema: CompleteCalibrationResponseSchema,
  paramType: "PathAndBody"
});
