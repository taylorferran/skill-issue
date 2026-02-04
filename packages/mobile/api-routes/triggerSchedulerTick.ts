import { buildApiEndpointHook } from "@/api/hooks/buildGenericApiHook";
import { SchedulerTickResponseSchema } from "@learning-platform/shared";

export const useTriggerSchedulerTick = buildApiEndpointHook({
  method: "POST",
  apiInstance: "backend",
  url: "/scheduler/tick",
  responseSchema: SchedulerTickResponseSchema,
});
