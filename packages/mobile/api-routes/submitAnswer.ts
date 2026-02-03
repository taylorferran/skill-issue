import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { 
  AnswerChallengeRequestSchema,
  AnswerChallengeResponseSchema 
} from "@learning-platform/shared";

/**
 * Hook for submitting an answer to a challenge
 * POST /answer
 * 
 * @example
 * const { execute, isLoading } = useSubmitAnswer();
 * 
 * // Call with answer data
 * const result = await execute({ 
 *   challengeId: "challenge-uuid",
 *   userId: "user-uuid",
 *   selectedOption: 2,
 *   responseTime: 15000,  // milliseconds
 *   confidence: 4,        // 1-5 rating
 *   userFeedback: "User rated usefulness 3 out of 5"
 * });
 * 
 * Note: The API layer will send all parameters in the request body
 */
export const useSubmitAnswer = buildApiEndpointHook({
  method: 'POST',
  apiInstance: 'backend',
  url: '/answer',
  requestSchema: AnswerChallengeRequestSchema,
  responseSchema: AnswerChallengeResponseSchema,
  paramType: "Body"
});
