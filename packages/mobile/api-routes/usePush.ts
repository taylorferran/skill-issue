import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import z from "zod";

export const usePush = buildApiEndpointHook({
  method: "POST",
  apiInstance: "backend",
  url: "/push",
  requestSchema: z.object({
    pushToken: z.string(),
  }),
  paramType: "Body",
});
