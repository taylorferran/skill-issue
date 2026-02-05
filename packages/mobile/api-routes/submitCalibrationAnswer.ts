import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { 
  SubmitCalibrationAnswerRequestSchema,
  SubmitCalibrationAnswerResponseSchema 
} from "@learning-platform/shared";

/**
 * Hook for submitting a calibration answer
 * POST /api/users/:userId/skills/:skillId/calibration/answer
 * 
 * @example
 * const { execute, isLoading } = useSubmitCalibrationAnswer();
 * 
 * // Call to submit an answer
 * const result = await execute({ 
 *   userId: "user-uuid",
 *   skillId: "skill-uuid",
 *   difficulty: 5,           // difficulty level of current question (1-10)
 *   selectedOption: 2,       // user's selected answer index (0-3)
 *   responseTime: 15000      // optional: response time in milliseconds
 * });
 * // Returns: { isCorrect, correctOption, explanation, progress: { answered, total } }
 */
export const useSubmitCalibrationAnswer = buildApiEndpointHook({
  method: 'POST',
  apiInstance: 'backend',
  url: '/users/:userId/skills/:skillId/calibration/answer',
  requestSchema: SubmitCalibrationAnswerRequestSchema,
  responseSchema: SubmitCalibrationAnswerResponseSchema,
  paramType: "PathAndBody"
});
