/**
 * LLM-as-Judge Evaluation Configuration
 *
 * Configure the challenge quality evaluation system.
 * The evaluator assesses generated challenges on multiple dimensions
 * and acts as a quality gate before storing challenges.
 */

export const EVALUATION_CONFIG = {
  /**
   * Enable/disable the LLM-as-Judge evaluator.
   * When disabled, challenges bypass quality evaluation.
   * Default: enabled (set LLM_JUDGE_ENABLED=false to disable)
   */
  enabled: process.env.LLM_JUDGE_ENABLED !== 'false',

  /**
   * Minimum composite score required to pass quality gate.
   * Challenges scoring below this threshold are rejected.
   * Range: 0-1, Default: 0.7 (70%)
   */
  qualityThreshold: parseFloat(process.env.LLM_JUDGE_THRESHOLD || '0.7'), 

  /**
   * Veto threshold for individual scores.
   * If ANY individual score falls below this, the challenge fails regardless of composite.
   * Range: 0-1, Default: 0.4 (40%)
   */
  vetoThreshold: parseFloat(process.env.LLM_JUDGE_VETO_THRESHOLD || '0.4'),

  /**
   * Weights for calculating composite score.
   * Must sum to 1.0 for proper weighting.
   */
  weights: {
    clarity: 0.20,           // Question clarity and unambiguity
    difficultyAlignment: 0.25, // Match between target and actual difficulty
    distractorQuality: 0.20, // Plausibility of wrong answers
    educationalValue: 0.15,  // Quality of explanation
    skillRelevance: 0.20,    // Relevance to the stated skill
  },

  /**
   * Model to use for evaluation.
   * Using same model as generation for cost efficiency.
   */
  model: 'claude-haiku-4-5-20251001',

  /**
   * Maximum retries if evaluation fails to parse.
   */
  maxRetries: 1,
};

/**
 * Validate that weights sum to 1.0
 */
export function validateWeights(): boolean {
  const sum = Object.values(EVALUATION_CONFIG.weights).reduce((a, b) => a + b, 0);
  return Math.abs(sum - 1.0) < 0.001;
}

/**
 * Get the evaluation prompt template with placeholders.
 * Used for Opik prompt versioning.
 */
export function getEvaluationPromptTemplate(): string {
  return `You are an expert educator evaluating the quality of a multiple-choice question.

## Challenge to Evaluate
**Skill Being Tested**: {{skill_name}}
**Skill Description**: {{skill_description}}
**Target Difficulty**: {{target_difficulty}}/10

**Question**: {{question}}
**Options**:
A) {{option_0}}
B) {{option_1}}
C) {{option_2}}
D) {{option_3}}
**Correct Answer**: {{correct_letter}}) {{correct_option}}
**Explanation**: {{explanation}}

## Evaluation Criteria
Rate each dimension from 0-10, where 0 is completely failing and 10 is excellent. Provide a brief reason for each score.

1. **CLARITY**: Is the question clear and unambiguous? Could a competent person misinterpret what's being asked?

2. **DIFFICULTY_ALIGNMENT**: Does the question's complexity appropriately match the target difficulty of {{target_difficulty}}/10? Consider: vocabulary level, required knowledge depth, cognitive load.

3. **DISTRACTOR_QUALITY**: Are the wrong options plausible enough to require real knowledge to eliminate, but clearly incorrect to someone who understands the material?

4. **EDUCATIONAL_VALUE**: Does the explanation effectively teach WHY the correct answer is right? Would a learner gain understanding?

5. **SKILL_RELEVANCE**: Does this question genuinely test competence in "{{skill_name}}" as described?

CRITICAL: You MUST return ALL 5 scores and ALL 5 reasons. Missing fields will invalidate the evaluation.

Return ONLY valid JSON with no markdown formatting. Example format:
{"clarity": 7, "clarityReason": "The question is clear because...", "difficultyAlignment": 6, "difficultyReason": "The difficulty matches because...", "distractorQuality": 8, "distractorReason": "The distractors are good because...", "educationalValue": 7, "educationalReason": "The explanation teaches...", "skillRelevance": 9, "relevanceReason": "This tests the skill because...", "overall": "Good question with minor issues in X"}

Your response (JSON only, no other text):`;
}
