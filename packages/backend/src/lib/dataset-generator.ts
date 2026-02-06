import { createLLMProvider, createOpenAIProvider, OpenAIProvider, AnthropicProvider } from './llm-provider';
import { opikService } from './opik';
import type { GeneratedChallenge, DatasetGenerationResult, DatasetItem } from '@/types';

const EXAMPLES_PER_LEVEL = 5;  // Number of example challenges per difficulty level
const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export type LLMProviderType = 'anthropic' | 'openai';

/**
 * Dataset Generator Service
 *
 * Generates example-based datasets for prompt optimization.
 * Each dataset contains high-quality example challenges that serve as
 * benchmarks for evaluating generated challenge quality.
 *
 * Key design: Uses GPT-4o to generate examples (breaks Claude circularity).
 * Dataset items have empty `input` and example challenges in `expected_output`.
 */
export class DatasetGenerator {
  private llmProvider: AnthropicProvider | OpenAIProvider;
  private providerType: LLMProviderType;

  constructor(provider: LLMProviderType = 'openai') {
    this.providerType = provider;
    // Default to OpenAI for example generation (breaks circularity)
    this.llmProvider = provider === 'openai' ? createOpenAIProvider() : createLLMProvider();
  }

  /**
   * Generate a level-specific dataset with example challenges.
   * Creates 5 high-quality example challenges for a single difficulty level.
   *
   * Dataset structure:
   * - input: {} (empty - no hints for generation)
   * - expected_output: { question, options, correctAnswerIndex, explanation }
   *
   * Dataset naming: skill_{id}_level_{level}_examples
   */
  async generateDatasetForLevel(params: {
    skillId: string;
    skillName: string;
    skillDescription: string;
    level: number;
    count?: number;
  }): Promise<DatasetGenerationResult> {
    const count = params.count || EXAMPLES_PER_LEVEL;
    const datasetName = `skill_${params.skillId}_level_${params.level}_examples`;
    const startTime = Date.now();

    // Check if dataset already exists
    const existing = await opikService.findDataset(datasetName);
    if (existing) {
      console.log(`[DatasetGenerator] Dataset already exists: ${datasetName}`);
      return {
        datasetName,
        itemsCreated: 0,
        examples: [],
      };
    }

    // Start trace for this dataset generation
    const traceId = await opikService.startTrace({
      name: 'dataset_generation_examples',
      input: {
        skillId: params.skillId,
        skillName: params.skillName,
        skillDescription: params.skillDescription,
        level: params.level,
        examplesPerLevel: count,
      },
      tags: [
        'dataset',
        'examples',
        `skill:${params.skillName}`,
        `level:${params.level}`,
        `provider:${this.providerType}`,
      ],
    });

    console.log(`[DatasetGenerator] Generating example dataset: ${datasetName}`);

    try {
      // Create the dataset in Opik
      await opikService.createDataset({
        name: datasetName,
        description: `Example challenges for ${params.skillName} at difficulty level ${params.level}`,
      });

      // Generate example challenges using GPT-4o
      const { examples, usage, prompt, rawResponse, durationMs } = await this.generateExampleChallenges({
        skillName: params.skillName,
        skillDescription: params.skillDescription,
        difficulty: params.level,
        count,
      });

      // Create LLM span for this generation
      await opikService.createSpan({
        traceId,
        name: `generate_examples_level_${params.level}`,
        type: 'llm',
        model: 'gpt-4o',
        provider: 'openai',
        input: { prompt },
        output: {
          examplesGenerated: examples.length,
          rawResponse: rawResponse.substring(0, 500) + (rawResponse.length > 500 ? '...' : ''),
        },
        promptTokens: usage.inputTokens,
        completionTokens: usage.outputTokens,
        durationMs,
      });

      // Convert examples to dataset items with empty input
      const datasetItems: DatasetItem[] = examples.map((example, i) =>
        this.exampleToDatasetItem(example, i + 1)
      );

      // Add items to Opik dataset
      await opikService.addDatasetItems(datasetName, datasetItems);

      const totalDuration = Date.now() - startTime;
      console.log(`[DatasetGenerator] Created ${datasetItems.length} examples for ${params.skillName} level ${params.level}`);

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
        examples,
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
   * Generate example datasets for all levels of a skill.
   * Creates 10 datasets (one per level) with 5 examples each.
   */
  async generateAllLevelDatasets(params: {
    skillId: string;
    skillName: string;
    skillDescription: string;
  }): Promise<{ generated: number[]; skipped: number[]; errors: number[] }> {
    const generated: number[] = [];
    const skipped: number[] = [];
    const errors: number[] = [];

    for (const level of DIFFICULTY_LEVELS) {
      try {
        const result = await this.generateDatasetForLevel({
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
   * Generate high-quality example challenges using GPT-4o.
   * These serve as benchmarks for evaluating generated challenge quality.
   */
  private async generateExampleChallenges(params: {
    skillName: string;
    skillDescription: string;
    difficulty: number;
    count: number;
  }): Promise<{
    examples: GeneratedChallenge[];
    usage: { inputTokens: number; outputTokens: number };
    prompt: string;
    rawResponse: string;
    durationMs: number;
  }> {
    const prompt = `You are creating high-quality example multiple-choice questions that will be used as benchmarks.

SKILL: ${params.skillName}
DESCRIPTION: ${params.skillDescription}
DIFFICULTY LEVEL: ${params.difficulty}/10

${this.getDifficultyGuidance(params.difficulty)}

Generate ${params.count} diverse, high-quality MCQ challenges. These will serve as gold-standard examples of what good challenges look like.

REQUIREMENTS:
- Each question must be clear, unambiguous, and answerable in under 30 seconds
- Exactly 4 options per question, with exactly 1 correct answer
- Distractors should be plausible but clearly wrong to someone who knows the material
- Include a brief, educational explanation for why the answer is correct
- Questions should be diverse (don't repeat similar concepts)
- Difficulty should genuinely match level ${params.difficulty}/10

QUALITY STANDARDS (these are benchmark examples):
- Question: 15-25 words, direct and focused
- Options: 3-8 words each, no obvious giveaways
- Explanation: 20-30 words, teaches the concept
- Correct answer position should vary across questions

OUTPUT FORMAT (strict JSON array):
[
  {
    "question": "Clear, focused question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Brief explanation of why this is correct"
  }
]

Generate ${params.count} high-quality examples now:`;

    const startTime = Date.now();

    try {
      // Use GPT-4o for high-quality example generation
      const response = await (this.llmProvider as OpenAIProvider).generateRaw(prompt, {
        model: 'gpt-4o',  // Full GPT-4o for quality
        maxTokens: 3000,
        temperature: 0.7,
      });

      const durationMs = Date.now() - startTime;
      const jsonMatch = response.text.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        console.warn(`[DatasetGenerator] Failed to parse examples for difficulty ${params.difficulty}`);
        return {
          examples: [],
          usage: response.usage,
          prompt,
          rawResponse: response.text,
          durationMs,
        };
      }

      const parsed = JSON.parse(jsonMatch[0]) as GeneratedChallenge[];

      // Validate and add actualDifficulty
      const validExamples = parsed
        .slice(0, params.count)
        .filter(ex => this.isValidChallenge(ex))
        .map(ex => ({
          ...ex,
          actualDifficulty: params.difficulty,
        }));

      return {
        examples: validExamples,
        usage: response.usage,
        prompt,
        rawResponse: response.text,
        durationMs,
      };
    } catch (error) {
      console.error(`[DatasetGenerator] Error generating examples:`, error);
      return {
        examples: [],
        usage: { inputTokens: 0, outputTokens: 0 },
        prompt,
        rawResponse: String(error),
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Validate that a challenge has the required structure.
   */
  private isValidChallenge(challenge: GeneratedChallenge): boolean {
    return (
      typeof challenge.question === 'string' &&
      challenge.question.length >= 10 &&
      Array.isArray(challenge.options) &&
      challenge.options.length === 4 &&
      typeof challenge.correctAnswerIndex === 'number' &&
      challenge.correctAnswerIndex >= 0 &&
      challenge.correctAnswerIndex <= 3 &&
      typeof challenge.explanation === 'string'
    );
  }

  private getDifficultyGuidance(difficulty: number): string {
    const descriptions: Record<number, string> = {
      1: 'Complete Beginner: Basic recall, fundamental terms, no prior knowledge needed.',
      2: 'Novice: Basic terminology, simple concepts, minimal exposure required.',
      3: 'Basic Understanding: Core principles, definitions, foundational knowledge.',
      4: 'Developing: Apply basic concepts to straightforward scenarios.',
      5: 'Intermediate: Solid foundation needed, analyze and compare concepts.',
      6: 'Proficient: Integrate multiple concepts, real-world application with nuance.',
      7: 'Advanced: Deep understanding, edge cases, evaluate competing methods.',
      8: 'Expert: Specialized knowledge, critical evaluation, synthesis across topics.',
      9: 'Specialist: Mastery level, nuanced judgment, obscure details.',
      10: 'Subject Matter Expert: Frontier knowledge, cutting-edge, unresolved debates.',
    };

    return `DIFFICULTY ${difficulty}/10 means: ${descriptions[difficulty] || descriptions[5]}`;
  }

  /**
   * Convert an example challenge to a dataset item.
   * Key: input is EMPTY, expected_output contains the example challenge.
   */
  private exampleToDatasetItem(example: GeneratedChallenge, itemNumber: number): DatasetItem {
    return {
      input: {},  // Empty input - no hints for generation
      expected_output: {
        question: example.question,
        options: example.options,
        correctAnswerIndex: example.correctAnswerIndex,
        explanation: example.explanation,
      },
      metadata: {
        source: 'gpt-4o',
        item_id: itemNumber,
        created_at: new Date().toISOString(),
      },
    };
  }
}

// Export factory function to create generator
export function createDatasetGenerator(provider: LLMProviderType = 'openai'): DatasetGenerator {
  return new DatasetGenerator(provider);
}

// Default singleton instance (uses OpenAI for example generation)
export const datasetGenerator = new DatasetGenerator();
