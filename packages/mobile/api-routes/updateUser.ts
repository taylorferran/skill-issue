import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { 
  UpdateUserRequestSchema,
  UpdateUserResponseSchema 
} from "@learning-platform/shared";
import { z } from "zod";

// Combined schema for path + body parameters
const UpdateUserCombinedSchema = z.object({
  userId: z.string().uuid(), // Path parameter
}).merge(UpdateUserRequestSchema); // Merge with body parameters (deviceId, timezone, etc.)

/**
 * Hook for updating user settings
 * PUT /users/:userId
 * 
 * Now uses the generic hook with PathAndBody param type for automatic
 * parameter separation.
 * 
 * @example
 * const { execute, isLoading } = useUpdateUser();
 * 
 * await execute({ 
 *   userId: "user-uuid",        // Path parameter (auto-detected)
 *   deviceId: "expo-push-token" // Body parameter (auto-sent in body)
 * });
 */
export const useUpdateUser = buildApiEndpointHook({
  method: 'PUT',
  apiInstance: 'backend',
  url: '/users/:userId',
  requestSchema: UpdateUserCombinedSchema,
  responseSchema: UpdateUserResponseSchema,
  paramType: "PathAndBody" // Auto-detects :userId for path, sends remaining fields in body
});
