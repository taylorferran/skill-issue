// lib/navigation.ts
import { router, useLocalSearchParams } from "expo-router";
import z from "zod";
import { Href } from "expo-router";
import { QuizStateSchema } from "@/types/Quiz";

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
  quiz: {
    path: "/[skill]/questions/quiz" as const,
    params: z.object({
      skill: z.string(),
      data: QuizStateSchema,
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
  ...args: z.infer<(typeof routes)[K]["params"]> extends Record<string, never>
    ? []
    : [params: z.infer<(typeof routes)[K]["params"]>]
) {
  const [params] = args;
  let pathname = routes[route].path;
  const queryParams: Record<string, string> = {};

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      // Check if this key is a path parameter
      if (pathname.includes(`[${key}]`)) {
        pathname = pathname.replace(`[${key}]`, String(value)) as any;
      } else {
        // It's a query parameter - serialize it
        if (typeof value === "object") {
          queryParams[key] = JSON.stringify(value);
        } else {
          queryParams[key] = String(value);
        }
      }
    });
  }

  // Push with both pathname and params
  router.push({
    pathname: pathname as any,
    params: queryParams,
  } as Href);
}

export function dismissTo<K extends keyof typeof pages>(
  route: K,
  ...args: z.infer<(typeof pages)[K]["params"]> extends Record<string, never>
    ? []
    : [params: z.infer<(typeof pages)[K]["params"]>]
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
  route: K,
): z.infer<(typeof pages)[K]["params"]> {
  const rawParams = useLocalSearchParams();
  const schema = pages[route].params;

  const deserialized = deserializeParams(rawParams as Record<string, any>);
  const parsed = schema.parse(deserialized);

  return parsed;
}

// lib/navigation.ts
export function navigateBack() {
  const pathname = router.pathname || '/';
  const segments = pathname.split('/').filter(Boolean);
  
  // Already at root
  if (segments.length === 0) return;
  
  // /profile stays
  if (segments[0] === 'profile') return;
  
  // /[skill] -> go to /
  if (segments.length === 1) {
    router.push('/');
    return;
  }
  
  // /[skill]/questions -> go to /[skill]
  if (segments.length === 2 && segments[1] === 'questions') {
    router.push(`/${segments[0]}`);
    return;
  }
  
  // /[skill]/questions/quiz -> go to /[skill]/questions
  if (segments.length === 3 && segments[1] === 'questions' && segments[2] === 'quiz') {
    router.push(`/${segments[0]}/questions`);
    return;
  }
  
  // Fallback
  router.push('/');
}
