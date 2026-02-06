import { createLLMProvider, createOpenAIProvider, OpenAIProvider, AnthropicProvider } from './llm-provider';
import { opikService } from './opik';
import type { ChallengeScenario, DatasetGenerationResult, DatasetItem } from '@/types';

const SCENARIOS_PER_DIFFICULTY = 2;
const SCENARIOS_PER_LEVEL_DATASET = 5;  // For per-skill-per-level datasets
const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export type LLMProviderType = 'anthropic' | 'openai';

/**
 * Dataset Generator Service
 *
 * Generates synthetic datasets for skills to enable prompt evaluation and experimentation.
 * Each dataset contains scenarios across all difficulty levels (1-10), with multiple
 * scenarios per difficulty to ensure diversity.
 *
 * Supports both Anthropic (Claude) and OpenAI providers. Using OpenAI for dataset
 * generation breaks the circularity when optimizing Claude-based prompts.
 */
export class DatasetGenerator {
  private llmProvider: AnthropicProvider | OpenAIProvider;
  private providerType: LLMProviderType;

  constructor(provider: LLMProviderType = 'anthropic') {
    this.providerType = provider;
    this.llmProvider = provider === 'openai' ? createOpenAIProvider() : createLLMProvider();
  }

  /**
   * Generate a complete dataset for a skill.
   * Creates 2 scenarios per difficulty level = 20 items total.
   * Traces the entire operation with nested LLM spans for each difficulty.
   */
  async generateDatasetForSkill(params: {
    skillId: string;
    skillName: string;
    skillDescription: string;
  }): Promise<DatasetGenerationResult> {
    const datasetName = `skill_${params.skillId}_scenarios`;
    const startTime = Date.now();

    // Check if dataset already exists
    const existing = await opikService.findDataset(datasetName);
    if (existing) {
      console.log(`[DatasetGenerator] Dataset already exists: ${datasetName}`);
      return {
        datasetName,
        itemsCreated: 0,
        scenarios: [],
      };
    }

    // Start trace for this dataset generation
    const traceId = await opikService.startTrace({
      name: 'dataset_generation',
      input: {
        skillId: params.skillId,
        skillName: params.skillName,
        skillDescription: params.skillDescription,
        scenariosPerDifficulty: SCENARIOS_PER_DIFFICULTY,
        difficultyLevels: DIFFICULTY_LEVELS.length,
      },
      tags: [
        'dataset',
        `skill:${params.skillName}`,
      ],
    });

    console.log(`[DatasetGenerator] Generating dataset for skill: ${params.skillName}`);

    try {
      // Create the dataset in Opik
      await opikService.createDataset({
        name: datasetName,
        description: `Challenge scenarios for ${params.skillName}`,
      });

      // Generate scenarios for each difficulty level
      const allScenarios: ChallengeScenario[] = [];
      const datasetItems: DatasetItem[] = [];
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      for (const difficulty of DIFFICULTY_LEVELS) {
        console.log(`[DatasetGenerator] Generating scenarios for difficulty ${difficulty}...`);

        const { scenarios, usage, prompt, rawResponse, durationMs } = await this.generateScenariosForDifficulty({
          skillName: params.skillName,
          skillDescription: params.skillDescription,
          difficulty,
          count: SCENARIOS_PER_DIFFICULTY,
        });

        // Create LLM span for this difficulty level
        await opikService.createSpan({
          traceId,
          name: `generate_scenarios_d${difficulty}`,
          type: 'llm',
          model: 'claude-haiku-4-5-20251001',
          provider: 'anthropic',
          input: { prompt },
          output: {
            scenarios: scenarios.length,
            rawResponse: rawResponse.substring(0, 500) + (rawResponse.length > 500 ? '...' : ''),
          },
          promptTokens: usage.inputTokens,
          completionTokens: usage.outputTokens,
          durationMs,
        });

        totalInputTokens += usage.inputTokens;
        totalOutputTokens += usage.outputTokens;

        for (const scenario of scenarios) {
          allScenarios.push(scenario);
          datasetItems.push(this.scenarioToDatasetItem({
            skillId: params.skillId,
            skillName: params.skillName,
            skillDescription: params.skillDescription,
            scenario,
          }));
        }
      }

      // Add items to Opik dataset
      await opikService.addDatasetItems(datasetName, datasetItems);

      const totalDuration = Date.now() - startTime;
      console.log(`[DatasetGenerator] Created ${datasetItems.length} scenarios for ${params.skillName}`);

      // End trace with success
      await opikService.endTrace({
        traceId,
        output: {
          datasetName,
          itemsCreated: datasetItems.length,
          totalInputTokens,
          totalOutputTokens,
          durationMs: totalDuration,
        },
      });

      return {
        datasetName,
        itemsCreated: datasetItems.length,
        scenarios: allScenarios,
      };
    } catch (error) {
      // End trace with error
      await opikService.endTrace({
        traceId,
        output: { error: String(error) },
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Generate a level-specific dataset for a skill.
   * Creates 5 scenarios for a single difficulty level.
   * Used for per-skill-per-level prompt optimization.
   *
   * Dataset naming:
   * - Anthropic: skill_{id}_level_{level}_scenarios
   * - OpenAI: skill_{id}_level_{level}_openai_scenarios
   */
  async generateDatasetForSkillLevel(params: {
    skillId: string;
    skillName: string;
    skillDescription: string;
    level: number;
  }): Promise<DatasetGenerationResult> {
    // Include provider in dataset name for OpenAI to distinguish from Claude-generated
    const suffix = this.providerType === 'openai' ? '_openai_scenarios' : '_scenarios';
    const datasetName = `skill_${params.skillId}_level_${params.level}${suffix}`;
    const startTime = Date.now();

    // Check if dataset already exists
    const existing = await opikService.findDataset(datasetName);
    if (existing) {
      console.log(`[DatasetGenerator] Dataset already exists: ${datasetName}`);
      return {
        datasetName,
        itemsCreated: 0,
        scenarios: [],
      };
    }

    // Start trace for this dataset generation
    const traceId = await opikService.startTrace({
      name: 'dataset_generation_level',
      input: {
        skillId: params.skillId,
        skillName: params.skillName,
        skillDescription: params.skillDescription,
        level: params.level,
        scenariosPerLevel: SCENARIOS_PER_LEVEL_DATASET,
      },
      tags: [
        'dataset',
        'per-level',
        `skill:${params.skillName}`,
        `level:${params.level}`,
        `provider:${this.providerType}`,
      ],
    });

    console.log(`[DatasetGenerator] Generating level-specific dataset: ${datasetName}`);

    try {
      // Create the dataset in Opik
      await opikService.createDataset({
        name: datasetName,
        description: `Challenge scenarios for ${params.skillName} at difficulty level ${params.level}`,
      });

      // Generate scenarios for this specific level
      const { scenarios, usage, prompt, rawResponse, durationMs } = await this.generateScenariosForDifficulty({
        skillName: params.skillName,
        skillDescription: params.skillDescription,
        difficulty: params.level,
        count: SCENARIOS_PER_LEVEL_DATASET,
      });

      // Create LLM span for this generation
      const modelName = this.providerType === 'openai' ? 'gpt-4o-mini' : 'claude-haiku-4-5-20251001';
      await opikService.createSpan({
        traceId,
        name: `generate_scenarios_level_${params.level}`,
        type: 'llm',
        model: modelName,
        provider: this.providerType,
        input: { prompt },
        output: {
          scenarios: scenarios.length,
          rawResponse: rawResponse.substring(0, 500) + (rawResponse.length > 500 ? '...' : ''),
        },
        promptTokens: usage.inputTokens,
        completionTokens: usage.outputTokens,
        durationMs,
      });

      // Convert scenarios to dataset items
      const datasetItems: DatasetItem[] = scenarios.map(scenario =>
        this.scenarioToDatasetItem({
          skillId: params.skillId,
          skillName: params.skillName,
          skillDescription: params.skillDescription,
          scenario,
        })
      );

      // Add items to Opik dataset
      await opikService.addDatasetItems(datasetName, datasetItems);

      const totalDuration = Date.now() - startTime;
      console.log(`[DatasetGenerator] Created ${datasetItems.length} scenarios for ${params.skillName} level ${params.level}`);

      // End trace with success
      await opikService.endTrace({
        traceId,
        output: {
          datasetName,
          itemsCreated: datasetItems.length,
          totalInputTokens: usage.inputTokens,
          totalOutputTokens: usage.outputTokens,
          durationMs: totalDuration,
        },
      });

      return {
        datasetName,
        itemsCreated: datasetItems.length,
        scenarios,
      };
    } catch (error) {
      // End trace with error
      await opikService.endTrace({
        traceId,
        output: { error: String(error) },
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Generate level-specific datasets for all levels of a skill.
   * Creates 10 datasets (one per level) with 5 scenarios each.
   */
  async generateAllLevelDatasetsForSkill(params: {
    skillId: string;
    skillName: string;
    skillDescription: string;
  }): Promise<{ generated: number[]; skipped: number[]; errors: number[] }> {
    const generated: number[] = [];
    const skipped: number[] = [];
    const errors: number[] = [];

    for (const level of DIFFICULTY_LEVELS) {
      try {
        const result = await this.generateDatasetForSkillLevel({
          ...params,
          level,
        });

        if (result.itemsCreated > 0) {
          generated.push(level);
        } else {
          skipped.push(level);
        }
      } catch (error) {
        console.error(`[DatasetGenerator] Error generating level ${level}:`, error);
        errors.push(level);
      }
    }

    return { generated, skipped, errors };
  }

  /**
   * Use LLM to generate diverse scenarios for a specific difficulty.
   * Returns scenarios along with usage info for tracing.
   */
  private async generateScenariosForDifficulty(params: {
    skillName: string;
    skillDescription: string;
    difficulty: number;
    count: number;
  }): Promise<{
    scenarios: ChallengeScenario[];
    usage: { inputTokens: number; outputTokens: number };
    prompt: string;
    rawResponse: string;
    durationMs: number;
  }> {
    const prompt = `You are generating test scenarios for evaluating MCQ challenge generation.

SKILL: ${params.skillName}
DESCRIPTION: ${params.skillDescription}
DIFFICULTY LEVEL: ${params.difficulty}/10

Generate ${params.count} diverse scenarios that a challenge at this difficulty level should cover.

For difficulty ${params.difficulty}/10:
${this.getDifficultyGuidance(params.difficulty)}

Each scenario should specify:
1. A specific context/situation where this skill applies
2. The key concepts that should be tested
3. What makes this appropriate for difficulty ${params.difficulty}

OUTPUT FORMAT (strict JSON array):
[
  {
    "scenario": "Brief description of the testing context",
    "expected_concepts": ["concept1", "concept2"],
    "difficulty": ${params.difficulty}
  }
]

Generate ${params.count} diverse, non-overlapping scenarios.`;

    const startTime = Date.now();

    try {
      const response = await this.llmProvider.generateRaw(prompt, {
        maxTokens: 1500,
        temperature: 0.8, // Higher temp for diversity
      });

      const durationMs = Date.now() - startTime;
      const jsonMatch = response.text.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        console.warn(`[DatasetGenerator] Failed to parse scenarios for difficulty ${params.difficulty}`);
        return {
          scenarios: this.getFallbackScenarios(params.difficulty, params.count),
          usage: response.usage,
          prompt,
          rawResponse: response.text,
          durationMs,
        };
      }

      const parsed = JSON.parse(jsonMatch[0]) as ChallengeScenario[];
      return {
        scenarios: parsed.slice(0, params.count),
        usage: response.usage,
        prompt,
        rawResponse: response.text,
        durationMs,
      };
    } catch (error) {
      console.error(`[DatasetGenerator] Error generating scenarios:`, error);
      return {
        scenarios: this.getFallbackScenarios(params.difficulty, params.count),
        usage: { inputTokens: 0, outputTokens: 0 },
        prompt,
        rawResponse: String(error),
        durationMs: Date.now() - startTime,
      };
    }
  }

  private getDifficultyGuidance(difficulty: number): string {
    if (difficulty <= 2) {
      return '- Basic recall and recognition\n- Fundamental concepts\n- Clear, straightforward questions';
    } else if (difficulty <= 4) {
      return '- Understanding relationships between concepts\n- Simple application of knowledge\n- Some context required';
    } else if (difficulty <= 6) {
      return '- Application to new situations\n- Combining multiple concepts\n- Analysis of scenarios';
    } else if (difficulty <= 8) {
      return '- Complex problem-solving\n- Edge cases and exceptions\n- Deep understanding required';
    } else {
      return '- Expert-level knowledge\n- Subtle distinctions\n- Real-world complex scenarios\n- Multiple valid approaches to consider';
    }
  }

  private getFallbackScenarios(difficulty: number, count: number): ChallengeScenario[] {
    return Array.from({ length: count }, (_, i) => ({
      scenario: `Generic scenario ${i + 1} at difficulty ${difficulty}`,
      expected_concepts: ['general knowledge'],
      difficulty,
    }));
  }

  private scenarioToDatasetItem(params: {
    skillId: string;
    skillName: string;
    skillDescription: string;
    scenario: ChallengeScenario;
  }): DatasetItem {
    return {
      input: {
        skill_id: params.skillId,
        skill_name: params.skillName,
        skill_description: params.skillDescription,
        difficulty: params.scenario.difficulty,
        scenario: params.scenario.scenario,
        expected_concepts: params.scenario.expected_concepts,
      },
      expected_output: {
        difficulty_range: [
          Math.max(1, params.scenario.difficulty - 1),
          Math.min(10, params.scenario.difficulty + 1),
        ],
        required_concepts: params.scenario.expected_concepts,
        question_characteristics: {
          min_length: 10,
          max_length: 500,
          must_have_explanation: true,
          option_count: 4,
        },
      },
      metadata: {
        source: 'synthetic',
        item_id: `${params.skillId}_d${params.scenario.difficulty}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        created_at: new Date().toISOString(),
      },
    };
  }

  /**
   * Check all skills and generate datasets for any missing ones
   */
  async ensureAllSkillsHaveDatasets(skills: Array<{
    id: string;
    name: string;
    description: string;
  }>): Promise<{ generated: string[]; skipped: string[] }> {
    const generated: string[] = [];
    const skipped: string[] = [];

    for (const skill of skills) {
      const datasetName = `skill_${skill.id}_scenarios`;
      const existing = await opikService.findDataset(datasetName);

      if (existing) {
        skipped.push(skill.name);
        continue;
      }

      await this.generateDatasetForSkill({
        skillId: skill.id,
        skillName: skill.name,
        skillDescription: skill.description,
      });
      generated.push(skill.name);
    }

    return { generated, skipped };
  }
}

// Export factory function to create generator with specific provider
export function createDatasetGenerator(provider: LLMProviderType = 'anthropic'): DatasetGenerator {
  return new DatasetGenerator(provider);
}

// Default singleton instance (uses Anthropic)
export const datasetGenerator = new DatasetGenerator();
