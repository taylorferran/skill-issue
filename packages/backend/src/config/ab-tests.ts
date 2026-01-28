/**
 * A/B Testing Configuration for Prompt Experiments
 *
 * Define experiments here to test different prompt variations.
 * The system will automatically distribute traffic according to weights
 * and track performance metrics in Opik.
 */

/**
 * Challenge Generation Prompt Experiment
 *
 * Testing different prompt structures to optimize challenge quality
 */
export const CHALLENGE_PROMPT_EXPERIMENT = {
  enabled: process.env.AB_TEST_CHALLENGE_PROMPT_ENABLED === 'true', // Controlled by env var
  experimentName: 'challenge_generation_v1',
  variants: [
    {
      name: 'control',
      weight: 50, // 50% of traffic
      tags: ['control', 'baseline'],
      metadata: {
        description: 'Original baseline prompt',
        version: '1.0',
      },
      template: undefined, // Will use default from AnthropicProvider.getChallengePromptTemplate()
    },
    {
      name: 'detailed_explanation',
      weight: 50, // 50% of traffic
      tags: ['variant_a', 'test'],
      metadata: {
        description: 'Enhanced prompt with more detailed explanation requirements',
        version: '1.1',
      },
      template: `You are an expert educator creating multiple-choice questions.

Create a challenging but fair question for the following skill:

**Skill**: {{skill_name}}
**Description**: {{skill_description}}
**Difficulty Level**: {{difficulty}} (1=easiest, 10=hardest)

Requirements:
- Create exactly 4 answer options
- Mark the correct answer clearly
- Provide a DETAILED explanation (2-3 sentences minimum) that teaches the concept
- Ensure the question is appropriate for the difficulty level
- Make distractors (wrong answers) plausible but clearly incorrect
- Focus on conceptual understanding, not just memorization

Return ONLY valid JSON with this exact structure:
{
  "question": "Your question here",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctOption": 0,
  "explanation": "Detailed explanation here (minimum 2 sentences)"
}`,
    },
  ],
};

/**
 * Future experiments can be added here
 */
export const FUTURE_EXPERIMENT_EXAMPLE = {
  enabled: false,
  experimentName: 'skill_state_prompts',
  variants: [
    {
      name: 'control',
      weight: 100,
      tags: ['control'],
      metadata: {},
      template: undefined,
    },
  ],
};

/**
 * Helper to check if an experiment is enabled
 */
export function isExperimentEnabled(experimentName: string): boolean {
  switch (experimentName) {
    case 'challenge_generation_v1':
      return CHALLENGE_PROMPT_EXPERIMENT.enabled;
    case 'skill_state_prompts':
      return FUTURE_EXPERIMENT_EXAMPLE.enabled;
    default:
      return false;
  }
}
