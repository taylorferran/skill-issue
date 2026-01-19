// lib/navigation.ts
import { router, useLocalSearchParams } from 'expo-router';
import z from 'zod';
import { Href } from 'expo-router';

const pages = {
  dashboard: {
    path: "/" as const,
    params: z.object({}),
  },
  skillSelection: {
    path: "/" as const,
    params: z.object({}),
  },
  topicSelection: {
    path: "/[skill]" as const,
    params: z.object({
      skill: z.string(),
    }),
  },
  learnTopic: {
    path: "/[skill]/[topic]" as const,
    params: z.object({
      skill: z.string(),
      topic: z.string(),
    }),
  },
  questions: {
    path: "/[skill]/questions" as const,
    params: z.object({
      skill: z.string(),
    }),
  },
   assessment: {
    path: "/[skill]/questions/assessment" as const,
    params: z.object({
      skill: z.string(),
    }),
  },
 
  profile: {
    path: "/profile" as const,
    params: z.object({}),
  },
} as const;

function serializeParams(params: any): Record<string, string> {
  const serialized: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "object") {
      serialized[key] = JSON.stringify(value);
    } else {
      serialized[key] = String(value);
    }
  }
  return serialized;
}

function deserializeParams(params: Record<string, any>): Record<string, any> {
  const deserialized: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      try {
        deserialized[key] = JSON.parse(value);
      } catch {
        deserialized[key] = value;
      }
    } else {
      deserialized[key] = value;
    }
  }
  return deserialized;
}

const routes = { ...pages } as const;

export function navigateTo<K extends keyof typeof routes>(
  route: K,
  ...args: z.infer<(typeof routes)[K]['params']> extends Record<string, never>
    ? []
    : [params: z.infer<(typeof routes)[K]['params']>]
) {
  const [params] = args;
  
  // Build the path with params
  let pathname = routes[route].path;
  
  // Replace dynamic segments with actual values
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      pathname = pathname.replace(`[${key}]`, String(value)) as any;
    });
  }
  
  router.push(pathname as Href);
}

export function dismissTo<K extends keyof typeof pages>(
  route: K,
  ...args: z.infer<typeof pages[K]['params']> extends Record<string, never>
    ? []
    : [params: z.infer<typeof pages[K]['params']>]
) {
  const [params] = args;
  let pathname = pages[route].path;
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      pathname = pathname.replace(`[${key}]`, String(value)) as any;
    });
  }

  router.dismiss();
  router.push(pathname as Href);
}

export function useRouteParams<K extends keyof typeof pages>(
  route: K
): z.infer<typeof pages[K]['params']> {
  const rawParams = useLocalSearchParams();
  const schema = pages[route].params;

  const deserialized = deserializeParams(rawParams as Record<string, any>);
  const parsed = schema.parse(deserialized);

  return parsed;
}
