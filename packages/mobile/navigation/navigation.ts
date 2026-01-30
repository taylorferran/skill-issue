// lib/navigation.ts
import { router, useLocalSearchParams } from "expo-router";
import z from "zod";
import { Href } from "expo-router";
import { QuizStateSchema } from "@/types/Quiz";

/**
 * Active navigation routes
 * 
 * Structure:
 * - Skills Tab: skills → assessment → quiz (nested)
 * - Profile Tab: profile (single screen)
 */
const pages = {
  // Skills Tab Routes (nested: skills → assessment → quiz)
  skills: {
    path: "/(tabs)/(skills)" as const,
    params: z.object({}),
  },
  assessment: {
    path: "/(tabs)/(skills)/assessment" as const,
    params: z.object({
      skill: z.string(),
      skillId: z.string().uuid().optional(),
      progress: z.number(),
      isNewSkill: z.boolean().optional(),
    }),
  },
  quiz: {
    path: "/(tabs)/(skills)/assessment/quiz" as const,
    params: z.object({
      skill: z.string(),
      data: QuizStateSchema,
      challengeId: z.string().uuid(),
    }),
  },
  
  // Profile Tab Route
  profile: {
    path: "/(tabs)/(profile)" as const,
    params: z.object({}),
  },
} as const;

/* 
 * DEPRECATED ROUTES - Removed during navigation cleanup (Jan 2026)
 * 
 * Archived routes (no longer in use):
 * - dashboard: "/" (duplicate of skills route)
 * - skillSelection: "/" (renamed to 'skills')
 * - topicSelection: "/[skill]" (archived - future subtopics feature → archived-features/topic-selection/)
 * - learnTopic: "/[skill]/[topic]" (old pattern, not in use)
 * - questions: "/[skill]/questions" (renamed to 'assessment', path flattened)
 * 
 * Deprecated files location: deprecated/(dashboard)/
 * Archived files location: archived-features/topic-selection/
 */

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


