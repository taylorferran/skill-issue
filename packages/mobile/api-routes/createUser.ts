import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { CreateUserSchema } from "@learning-platform/shared";


export const useCreateUser = buildApiEndpointHook({
    method: 'POST',
    apiInstance: 'backend',
    url: '/users',
    requestSchema: CreateUserSchema,
    paramType: "Body"
});
