import Anthropic from '@anthropic-ai/sdk';
import { EVALUATION_CONFIG, getEvaluationPromptTemplate } from '@/config/evaluation';
import type {
  ChallengeEvaluation,
  EvaluationRequest,
  EvaluationScores,
  EvaluationReasons,
} from '@/types';

/**
 * LLM-as-Judge Challenge Evaluator
 *
 * Evaluates generated challenges on 5 quality dimensions:
 * - Clarity: Is the question unambiguous?
 * - Difficulty Alignment: Does it match the target difficulty?
 * - Distractor Quality: Are wrong options plausible but incorrect?
 * - Educational Value: Does the explanation teach effectively?
 * - Skill Relevance: Does it test the stated skill?
 *
 * Used as a quality gate before storing challenges.
 */
export class ChallengeEvaluator {
  private client: Anthropic;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('Missing ANTHROPIC_API_KEY for evaluator');
    }
    this.client = new Anthropic({ apiKey: key });
  }

  /**
   * Evaluate a generated challenge using LLM-as-Judge
   */
  async evaluate(request: EvaluationRequest): Promise<ChallengeEvaluation> {
    const startTime = Date.now();

    const prompt = this.buildEvaluationPrompt(request);

    try {
      const message = await this.client.messages.create({
        model: EVALUATION_CONFIG.model,
        max_tokens: 500,
        temperature: 0.3, // Lower temperature for more consistent evaluation
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText =
        message.content[0].type === 'text' ? message.content[0].text : '';

      const durationMs = Date.now() - startTime;

      const evaluation = this.parseEvaluationResponse(responseText, durationMs, {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      });

      console.log(
        `[Evaluator] Challenge evaluated: composite=${evaluation.compositeScore.toFixed(2)}, passed=${evaluation.passed}`
      );

      return evaluation;
    } catch (error) {
      console.error('[Evaluator] Evaluation failed:', error);

      // Return a failing evaluation on error
      return this.createFailedEvaluation(
        'Evaluation API call failed',
        Date.now() - startTime
      );
    }
  }

  /**
   * Build the evaluation prompt from template
   */
  private buildEvaluationPrompt(request: EvaluationRequest): string {
    const { challenge, skillName, skillDescription, targetDifficulty } = request;
    const correctLetter = ['A', 'B', 'C', 'D'][challenge.correctAnswerIndex];

    return getEvaluationPromptTemplate()
      .replace(/\{\{skill_name\}\}/g, skillName)
      .replace(/\{\{skill_description\}\}/g, skillDescription)
      .replace(/\{\{target_difficulty\}\}/g, targetDifficulty.toString())
      .replace(/\{\{question\}\}/g, challenge.question)
      .replace(/\{\{option_0\}\}/g, challenge.options[0] || '')
      .replace(/\{\{option_1\}\}/g, challenge.options[1] || '')
      .replace(/\{\{option_2\}\}/g, challenge.options[2] || '')
      .replace(/\{\{option_3\}\}/g, challenge.options[3] || '')
      .replace(/\{\{correct_letter\}\}/g, correctLetter)
      .replace(/\{\{correct_option\}\}/g, challenge.options[challenge.correctAnswerIndex] || '')
      .replace(/\{\{explanation\}\}/g, challenge.explanation || 'No explanation provided');
  }

  /**
   * Parse the LLM evaluation response into structured scores
   */
  private parseEvaluationResponse(
    response: string,
    durationMs: number,
    usage: { inputTokens: number; outputTokens: number }
  ): ChallengeEvaluation {
    try {
      // Extract JSON from response (handle potential markdown)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize scores (0-10 from LLM, convert to 0-1)
      const scores: EvaluationScores = {
        clarity: this.normalizeScore(parsed.clarity),
        difficultyAlignment: this.normalizeScore(parsed.difficultyAlignment),
        distractorQuality: this.normalizeScore(parsed.distractorQuality),
        educationalValue: this.normalizeScore(parsed.educationalValue),
        skillRelevance: this.normalizeScore(parsed.skillRelevance),
      };

      // Extract per-dimension reasons
      const reasons: EvaluationReasons = {
        clarity: parsed.clarityReason || 'No reason provided',
        difficultyAlignment: parsed.difficultyReason || 'No reason provided',
        distractorQuality: parsed.distractorReason || 'No reason provided',
        educationalValue: parsed.educationalReason || 'No reason provided',
        skillRelevance: parsed.relevanceReason || 'No reason provided',
        overall: parsed.overall || 'No overall summary provided',
      };

      // Calculate weighted composite score
      const compositeScore = this.calculateCompositeScore(scores);

      // Determine if it passes quality threshold
      const passed = compositeScore >= EVALUATION_CONFIG.qualityThreshold;

      return {
        scores,
        reasons,
        compositeScore,
        passed,
        usage,
        durationMs,
      };
    } catch (error) {
      console.error('[Evaluator] Failed to parse response:', error);
      console.error('[Evaluator] Response was:', response);

      return this.createFailedEvaluation(
        `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        durationMs,
        usage
      );
    }
  }

  /**
   * Normalize a 0-10 score to 0-1 range
   */
  private normalizeScore(value: unknown): number {
    if (typeof value !== 'number') {
      return 0;
    }
    // Clamp to 0-10, then normalize to 0-1
    const clamped = Math.max(0, Math.min(10, value));
    return clamped / 10;
  }

  /**
   * Calculate weighted composite score from individual scores
   */
  private calculateCompositeScore(scores: EvaluationScores): number {
    const { weights } = EVALUATION_CONFIG;

    return (
      scores.clarity * weights.clarity +
      scores.difficultyAlignment * weights.difficultyAlignment +
      scores.distractorQuality * weights.distractorQuality +
      scores.educationalValue * weights.educationalValue +
      scores.skillRelevance * weights.skillRelevance
    );
  }

  /**
   * Create a failed evaluation result
   */
  private createFailedEvaluation(
    reason: string,
    durationMs: number,
    usage: { inputTokens: number; outputTokens: number } = { inputTokens: 0, outputTokens: 0 }
  ): ChallengeEvaluation {
    return {
      scores: {
        clarity: 0,
        difficultyAlignment: 0,
        distractorQuality: 0,
        educationalValue: 0,
        skillRelevance: 0,
      },
      reasons: {
        clarity: reason,
        difficultyAlignment: reason,
        distractorQuality: reason,
        educationalValue: reason,
        skillRelevance: reason,
        overall: reason,
      },
      compositeScore: 0,
      passed: false,
      usage,
      durationMs,
    };
  }

  /**
   * Get the prompt template (for Opik versioning)
   */
  static getPromptTemplate(): string {
    return getEvaluationPromptTemplate();
  }
}

// Singleton instance
let evaluatorInstance: ChallengeEvaluator | null = null;

/**
 * Get or create the evaluator singleton
 */
export function getEvaluator(): ChallengeEvaluator {
  if (!evaluatorInstance) {
    evaluatorInstance = new ChallengeEvaluator();
  }
  return evaluatorInstance;
}

/**
 * Check if evaluation is enabled
 */
export function isEvaluationEnabled(): boolean {
  return EVALUATION_CONFIG.enabled;
}
