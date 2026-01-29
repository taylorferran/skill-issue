import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { 
  CreateUserRequestSchema,
  CreateUserResponseSchema 
} from "@learning-platform/shared";


export const useCreateUser = buildApiEndpointHook({
    method: 'POST',
    apiInstance: 'backend',
    url: '/users',
    requestSchema: CreateUserRequestSchema,
    responseSchema: CreateUserResponseSchema,
    paramType: "Body"
});
