import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { GetChallengeResponseSchema } from "@learning-platform/shared";
import { z } from "zod";

// Request schema for path parameters
const GetChallengePathSchema = z.object({
  challengeId: z.string().uuid(),
});

/**
 * Hook for fetching a specific challenge by ID
 * GET /challenges/:challengeId
 * 
 * This endpoint returns the full challenge details including:
 * - correctOption: The index of the correct answer (0-3)
 * - explanation: The explanation text for the correct answer
 * 
 * @example
 * const { execute, data, isLoading, error } = useGetChallenge();
 * 
 * // Call with challengeId as path parameter
 * const challenge = await execute({ challengeId: "uuid-here" });
 */
export const useGetChallenge = buildApiEndpointHook({
  method: 'GET',
  apiInstance: 'backend',
  url: '/challenges/:challengeId',
  requestSchema: GetChallengePathSchema,
  responseSchema: GetChallengeResponseSchema,
  paramType: "Path"
});
