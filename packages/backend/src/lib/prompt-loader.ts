/**
 * Prompt Loader for Optimized Challenge Prompts
 *
 * This module loads the appropriate prompt for challenge generation based on
 * skill ID and difficulty level. It supports per-skill-per-level optimized
 * prompts with fallback to the base template.
 *
 * Priority:
 * 1. Optimized prompt for skill+level (if exists and deployed)
 * 2. Base template with variable substitution
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to optimized prompts JSON (relative to project root)
const OPTIMIZED_PROMPTS_PATH = join(
  __dirname,
  '../../../../optimization/prompts/optimized_prompts.json'
);

// Difficulty descriptions (matches optimizer's DIFFICULTY_DESCRIPTIONS)
const DIFFICULTY_DESCRIPTIONS: Record<number, string> = {
  1: 'Complete Beginner: Generate a question requiring no prior knowledge; assume the respondent is encountering this subject for the very first time.',
  2: 'Novice: Generate a question about basic terminology or fundamental concepts that someone with minimal exposure to the subject could answer.',
  3: 'Basic Understanding: Generate a question that tests foundational knowledge, requiring the respondent to recall core principles or definitions.',
  4: 'Developing Competence: Generate a question that requires applying basic concepts to straightforward scenarios or making simple connections between ideas.',
  5: 'Intermediate: Generate a question that assumes solid foundational knowledge and tests the ability to analyze, compare, or apply concepts in moderately complex situations.',
  6: 'Proficient: Generate a question requiring integration of multiple concepts, awareness of common exceptions, or application to real-world contexts with some nuance.',
  7: 'Advanced: Generate a question that tests deep understanding, including edge cases, limitations of standard approaches, or the ability to evaluate competing methods.',
  8: 'Expert: Generate a question requiring specialized knowledge, critical evaluation of complex scenarios, or synthesis across multiple advanced topics.',
  9: 'Specialist: Generate a question that assumes mastery of the field, testing nuanced judgment, obscure details, or the ability to navigate ambiguous or contested areas.',
  10: 'Subject Matter Expert: Generate a question at the frontier of the domain, requiring knowledge of cutting-edge developments, unresolved debates, or the ability to identify novel insights.',
};

// Base prompt template with {{variable}} placeholders
const BASE_PROMPT_TEMPLATE = `You are generating a multiple-choice challenge to test knowledge and competence.

SKILL: {{skill_name}}
DESCRIPTION: {{skill_description}}
DIFFICULTY LEVEL: {{difficulty}}/10

Generate a single MCQ challenge that tests real competence in this skill at this difficulty level.

RULES:
- Difficulty {{difficulty}} means: {{difficulty_description}}
- Question must be answerable in under 30 seconds
- 4 options, only 1 correct
- Randomly shuffle the order of correct answer among the options
- Don't repeat questions you've generated before - each challenge must be unique try to make it unique
- Distractors should be plausible but clearly wrong to someone who knows the subject
- Include a brief explanation of why the answer is correct
- Tailor the question specifically to the skill described above
- Make sure the correct answer is not ambiguous or debatable

BREVITY REQUIREMENTS (CRITICAL):
- Question: 15-25 words maximum, no unnecessary words
- Options: 3-8 words each, direct answers only
- Explanation: 20-30 words maximum, concise reasoning
- Avoid: storytelling, excessive context, verbose setups, filler words
- Focus: Test the concept directly and efficiently

Examples of good brevity:
✓ "Which sorting algorithm has O(n log n) average time complexity?"
✗ "When implementing a search on a large dataset, which algorithm would be best?"

✓ "What is the capital of France?"
✗ "If you were traveling through Europe and wanted to visit the capital city of France, which city would you go to?"

OUTPUT FORMAT (strict JSON):
{
  "question": "...",
  "options": ["A...", "B...", "C...", "D..."],
  "correctAnswerIndex": 0,
  "explanation": "...",
  "actualDifficulty": {{difficulty}}
}

Generate the challenge now:`;

interface OptimizedPrompt {
  prompt: string;
  baseline_score: number;
  best_score: number;
  improvement: number;
  improvement_percent: number;
  refinements: number;
  optimized_at: string;
  status: 'pending' | 'deployed' | 'disabled';
}

interface OptimizedPromptsData {
  prompts: {
    [skillId: string]: {
      [level: string]: OptimizedPrompt;
    };
  };
  metadata: {
    created_at: string;
    last_updated: string;
    skills_optimized: string[];
    schema_version?: string;
  };
}

// Cache for optimized prompts to avoid repeated file reads
let optimizedPromptsCache: OptimizedPromptsData | null = null;
let cacheLoadedAt: number = 0;
const CACHE_TTL_MS = 60000; // Refresh cache every 60 seconds

/**
 * Load optimized prompts from JSON file with caching.
 */
function loadOptimizedPrompts(): OptimizedPromptsData | null {
  const now = Date.now();

  // Return cached data if still valid
  if (optimizedPromptsCache && now - cacheLoadedAt < CACHE_TTL_MS) {
    return optimizedPromptsCache;
  }

  try {
    if (!existsSync(OPTIMIZED_PROMPTS_PATH)) {
      console.log('[PromptLoader] No optimized prompts file found');
      return null;
    }

    const data = readFileSync(OPTIMIZED_PROMPTS_PATH, 'utf-8');
    optimizedPromptsCache = JSON.parse(data) as OptimizedPromptsData;
    cacheLoadedAt = now;

    return optimizedPromptsCache;
  } catch (error) {
    console.error('[PromptLoader] Error loading optimized prompts:', error);
    return null;
  }
}

/**
 * Get the difficulty description for a given level.
 */
export function getDifficultyDescription(difficulty: number): string {
  return DIFFICULTY_DESCRIPTIONS[difficulty] || DIFFICULTY_DESCRIPTIONS[5];
}

/**
 * Get the appropriate prompt for challenge generation.
 *
 * This function checks for an optimized prompt specific to the skill+level
 * combination. If one exists and is deployed, it returns the concrete (baked)
 * prompt directly. Otherwise, it falls back to the base template with
 * variable substitution.
 *
 * @param skillId - The skill ID (UUID)
 * @param skillName - The skill name for template substitution
 * @param skillDescription - The skill description for template substitution
 * @param difficulty - The difficulty level (1-10)
 * @returns The prompt string ready for use
 */
export function getPromptForChallenge(
  skillId: string,
  skillName: string,
  skillDescription: string,
  difficulty: number
): string {
  // Try to load optimized prompts
  const optimizedData = loadOptimizedPrompts();

  if (optimizedData) {
    const skillPrompts = optimizedData.prompts[skillId];

    if (skillPrompts) {
      const levelPrompt = skillPrompts[String(difficulty)];

      if (levelPrompt && levelPrompt.status === 'deployed' && levelPrompt.prompt) {
        console.log(
          `[PromptLoader] Using optimized prompt for ${skillId} level ${difficulty} ` +
            `(score: ${levelPrompt.best_score.toFixed(3)}, improvement: ${levelPrompt.improvement_percent.toFixed(1)}%)`
        );
        // Return the concrete (baked) prompt directly - no substitution needed
        return levelPrompt.prompt;
      }
    }
  }

  // Fallback to base template with variable substitution
  console.log(`[PromptLoader] Using base template for ${skillId} level ${difficulty}`);

  return BASE_PROMPT_TEMPLATE
    .replace(/\{\{skill_name\}\}/g, skillName)
    .replace(/\{\{skill_description\}\}/g, skillDescription)
    .replace(/\{\{difficulty\}\}/g, String(difficulty))
    .replace(/\{\{difficulty_description\}\}/g, getDifficultyDescription(difficulty));
}

/**
 * Check if an optimized prompt exists for a skill+level combination.
 */
export function hasOptimizedPrompt(skillId: string, difficulty: number): boolean {
  const optimizedData = loadOptimizedPrompts();

  if (!optimizedData) {
    return false;
  }

  const skillPrompts = optimizedData.prompts[skillId];
  if (!skillPrompts) {
    return false;
  }

  const levelPrompt = skillPrompts[String(difficulty)];
  return !!(levelPrompt && levelPrompt.status === 'deployed' && levelPrompt.prompt);
}

/**
 * Get optimization stats for a skill.
 */
export function getSkillOptimizationStats(skillId: string): {
  totalLevels: number;
  optimizedLevels: number;
  deployedLevels: number;
  averageImprovement: number;
} | null {
  const optimizedData = loadOptimizedPrompts();

  if (!optimizedData) {
    return null;
  }

  const skillPrompts = optimizedData.prompts[skillId];
  if (!skillPrompts) {
    return null;
  }

  const levels = Object.keys(skillPrompts);
  const deployed = levels.filter(
    level => skillPrompts[level].status === 'deployed'
  );
  const improvements = levels.map(level => skillPrompts[level].improvement_percent || 0);
  const avgImprovement =
    improvements.length > 0
      ? improvements.reduce((a, b) => a + b, 0) / improvements.length
      : 0;

  return {
    totalLevels: 10,
    optimizedLevels: levels.length,
    deployedLevels: deployed.length,
    averageImprovement: avgImprovement,
  };
}

/**
 * Clear the optimized prompts cache.
 * Call this after updating the optimized_prompts.json file.
 */
export function clearPromptCache(): void {
  optimizedPromptsCache = null;
  cacheLoadedAt = 0;
  console.log('[PromptLoader] Prompt cache cleared');
}
