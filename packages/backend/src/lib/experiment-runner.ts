import { createLLMProvider } from './llm-provider';
import { opikService } from './opik';
import { getEvaluator, isEvaluationEnabled } from './evaluator';
import type { GeneratedChallenge } from '@/types';

// Pricing per 1M tokens (matches opik.ts)
const HAIKU_PRICING = { input: 1.0, output: 5.0 };

function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * HAIKU_PRICING.input;
  const outputCost = (outputTokens / 1_000_000) * HAIKU_PRICING.output;
  return inputCost + outputCost;
}

/**
 * Experiment Runner Service
 *
 * Runs prompt experiments against datasets and logs results to Opik.
 * For each dataset item (scenario), generates a challenge and evaluates it.
 */

interface ExperimentResult {
  experimentName: string;
  datasetName: string;
  itemsEvaluated: number;
  averageScores: Record<string, number>;
  results: Array<{
    datasetItemId: string;
    difficulty: number;
    success: boolean;
    scores: Record<string, number>;
    error?: string;
  }>;
  totalDurationMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

// Flattened dataset item structure (matches what Opik returns)
interface FlatDatasetItem {
  skill_name: string;
  skill_description: string;
  difficulty: number;
  scenario: string;
  expected_concepts: string[];
  difficulty_range_min: number;
  difficulty_range_max: number;
  required_concepts: string[];
  source_type?: string;
  item_id?: string;
}

export class ExperimentRunner {
  private llmProvider = createLLMProvider();
  private lastJudgeReasons: Record<string, string> = {};

  /**
   * Run an experiment against a skill's dataset.
   * Generates challenges for each scenario and evaluates them.
   */
  async runExperiment(params: {
    skillId: string;
    skillName: string;
    experimentName?: string;
    useFullEvaluation?: boolean; // Use LLM-as-judge (slower but more thorough)
  }): Promise<ExperimentResult> {
    const startTime = Date.now();
    const datasetName = `skill_${params.skillId}_scenarios`;

    // Generate experiment name if not provided
    const experimentName = params.experimentName ||
      `${params.skillName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 16).replace(':', '-')}`;

    console.log(`[ExperimentRunner] Starting experiment: ${experimentName}`);

    // Start a trace for this experiment run
    const traceId = await opikService.startTrace({
      name: 'experiment_run',
      input: {
        experimentName,
        datasetName,
        skillId: params.skillId,
        skillName: params.skillName,
        useFullEvaluation: params.useFullEvaluation || false,
      },
      tags: ['experiment', `skill:${params.skillName}`],
    });

    try {
      // Load dataset items
      const datasetItems = await opikService.getDatasetItems(datasetName);

      if (datasetItems.length === 0) {
        throw new Error(`No dataset items found for ${datasetName}`);
      }

      console.log(`[ExperimentRunner] Found ${datasetItems.length} dataset items`);

      const results: ExperimentResult['results'] = [];
      const experimentItems: Array<{
        datasetItemId: string;
        output: Record<string, unknown>;
        trace?: {
          name: string;
          input: Record<string, unknown>;
          output: Record<string, unknown>;
          startTime: string;
          endTime: string;
        };
        spans?: Array<{
          name: string;
          type: 'llm' | 'general';
          model?: string;
          provider?: string;
          startTime: string;
          endTime: string;
          input?: Record<string, unknown>;
          output?: Record<string, unknown>;
          usage?: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
          };
          totalEstimatedCost?: number;
        }>;
        feedbackScores: Array<{ name: string; value: number; reason?: string }>;
      }> = [];

      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      // Process each dataset item
      let processedCount = 0;
      for (const item of datasetItems) {
        processedCount++;
        const itemId = item.id as string;
        const data = item.data as FlatDatasetItem;

        // Debug: log first item structure
        if (processedCount === 1) {
          console.log(`[ExperimentRunner] First item structure:`, JSON.stringify(item, null, 2).slice(0, 500));
        }

        console.log(`[ExperimentRunner] Processing item ${processedCount}/${datasetItems.length}`);

        if (!data?.skill_name) {
          console.warn(`[ExperimentRunner] Skipping item ${itemId} - no skill_name in data. Keys: ${Object.keys(data || {}).join(', ')}`);
          continue;
        }

        try {
          // Generate a challenge for this scenario
          console.log(`[ExperimentRunner] Calling LLM for difficulty ${data.difficulty}...`);
          const genStartTime = Date.now();
          const llmResult = await this.llmProvider.generateChallenge({
            skillId: params.skillId,
            skillName: data.skill_name,
            skillDescription: data.skill_description,
            difficulty: data.difficulty,
          });

          const genDurationMs = Date.now() - genStartTime;
          console.log(`[ExperimentRunner] LLM call completed in ${genDurationMs}ms`);
          const { challenge, usage } = llmResult;

          totalInputTokens += usage.inputTokens;
          totalOutputTokens += usage.outputTokens;

          // Build expected_output object for scoring
          const expectedOutput = {
            difficulty_range: [data.difficulty_range_min, data.difficulty_range_max] as [number, number],
            required_concepts: data.required_concepts,
          };

          // Score the generated challenge
          const scores = await this.scoreChallenge({
            challenge,
            expectedOutput,
            expectedConcepts: data.expected_concepts || [],
            targetDifficulty: data.difficulty,
            skillName: data.skill_name,
            skillDescription: data.skill_description,
            useFullEvaluation: params.useFullEvaluation || false,
          });

          // Create span for this evaluation
          await opikService.createSpan({
            traceId,
            name: `evaluate_d${data.difficulty}`,
            type: 'llm',
            model: 'claude-haiku-4-5-20251001',
            provider: 'anthropic',
            input: {
              scenario: data.scenario,
              difficulty: data.difficulty,
            },
            output: {
              question: challenge.question,
              scores,
            },
            promptTokens: usage.inputTokens,
            completionTokens: usage.outputTokens,
            durationMs: genDurationMs,
          });

          results.push({
            datasetItemId: itemId,
            difficulty: data.difficulty,
            success: true,
            scores,
          });

          const startTimeISO = new Date(genStartTime).toISOString();
          const endTimeISO = new Date(genStartTime + genDurationMs).toISOString();

          // Build output with optional judge evaluation
          const experimentOutput: Record<string, unknown> = {
            question: challenge.question,
            options: challenge.options,
            correctAnswerIndex: challenge.correctAnswerIndex,
            explanation: challenge.explanation,
            actualDifficulty: challenge.actualDifficulty,
          };

          // Add judge evaluation details if available
          if (Object.keys(this.lastJudgeReasons).length > 0) {
            experimentOutput.judge_evaluation = {
              clarity: this.lastJudgeReasons.judge_clarity,
              difficulty: this.lastJudgeReasons.judge_difficulty,
              distractors: this.lastJudgeReasons.judge_distractors,
              educational: this.lastJudgeReasons.judge_educational,
              relevance: this.lastJudgeReasons.judge_relevance,
              overall: this.lastJudgeReasons.judge_composite,
            };
          }

          experimentItems.push({
            datasetItemId: itemId,
            output: experimentOutput,
            trace: {
              name: `challenge_generation_d${data.difficulty}`,
              input: {
                scenario: data.scenario,
                difficulty: data.difficulty,
                skill_name: data.skill_name,
              },
              output: experimentOutput,  // Full output including question, options, explanation
              startTime: startTimeISO,
              endTime: endTimeISO,
            },
            spans: [{
              name: 'llm_generate_challenge',
              type: 'llm' as const,
              model: 'claude-haiku-4-5-20251001',
              provider: 'anthropic',
              startTime: startTimeISO,
              endTime: endTimeISO,
              input: {
                scenario: data.scenario,
                difficulty: data.difficulty,
              },
              output: {
                question: challenge.question,
              },
              usage: {
                prompt_tokens: usage.inputTokens,
                completion_tokens: usage.outputTokens,
                total_tokens: usage.inputTokens + usage.outputTokens,
              },
              totalEstimatedCost: calculateCost(usage.inputTokens, usage.outputTokens),
            }],
            feedbackScores: Object.entries(scores).map(([name, value]) => ({
              name,
              value,
              reason: this.getScoreReason(name, value),
            })),
          });

        } catch (error) {
          console.error(`[ExperimentRunner] Error processing item ${itemId}:`, error);

          results.push({
            datasetItemId: itemId,
            difficulty: data.difficulty,
            success: false,
            scores: { error: 0 },
            error: String(error),
          });

          experimentItems.push({
            datasetItemId: itemId,
            output: { error: String(error) },
            feedbackScores: [{ name: 'success', value: 0, reason: String(error) }],
          });
        }
      }

      // Log all experiment items to Opik
      await opikService.logExperimentItems({
        experimentName,
        datasetName,
        items: experimentItems,
      });

      // Calculate average scores
      const averageScores = this.calculateAverageScores(results);
      const totalDurationMs = Date.now() - startTime;

      // End trace with summary
      await opikService.endTrace({
        traceId,
        output: {
          experimentName,
          itemsEvaluated: results.length,
          averageScores,
          totalInputTokens,
          totalOutputTokens,
          totalDurationMs,
        },
      });

      // Add summary feedback scores to trace
      await opikService.addFeedbackScores(traceId, [
        { name: 'avg_valid_structure', value: averageScores.valid_structure || 0 },
        { name: 'avg_difficulty_match', value: averageScores.difficulty_match || 0 },
        { name: 'avg_overall', value: averageScores.overall || 0 },
      ], 'online_scoring');

      console.log(`[ExperimentRunner] Experiment complete: ${results.length} items evaluated`);

      return {
        experimentName,
        datasetName,
        itemsEvaluated: results.length,
        averageScores,
        results,
        totalDurationMs,
        totalInputTokens,
        totalOutputTokens,
      };

    } catch (error) {
      await opikService.endTrace({
        traceId,
        output: { error: String(error) },
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Score a generated challenge against expected criteria.
   * Simplified scoring with 4 meaningful metrics.
   */
  private async scoreChallenge(params: {
    challenge: GeneratedChallenge;
    expectedOutput: { difficulty_range: [number, number]; required_concepts: string[] };
    expectedConcepts: string[];
    targetDifficulty: number;
    skillName: string;
    skillDescription: string;
    useFullEvaluation: boolean;
  }): Promise<Record<string, number>> {
    const { challenge, targetDifficulty } = params;

    // ============= 1. Valid Format (Binary) =============
    // Has 4 unique options, question exists, explanation exists, valid answer index
    const has4Options = Array.isArray(challenge.options) && challenge.options.length === 4;
    const hasQuestion = (challenge.question?.length || 0) >= 10;
    const hasExplanation = (challenge.explanation?.length || 0) > 10;
    const validAnswerIndex = challenge.correctAnswerIndex >= 0 && challenge.correctAnswerIndex <= 3;
    const uniqueOptions = has4Options && new Set(challenge.options).size === 4;

    const validFormat = has4Options && hasQuestion && hasExplanation && validAnswerIndex && uniqueOptions;

    // ============= 2. Option Balance (Continuous 0-1) =============
    // Options should be similar length so correct answer isn't obvious
    const optionBalance = this.calculateOptionBalance(challenge.options);

    // ============= 3. Explanation Quality (Continuous 0-1) =============
    // Explanation should be substantive - at least as detailed as the question
    const explanationQuality = this.calculateExplanationQuality(
      challenge.question,
      challenge.explanation || ''
    );

    // Start with basic format validation
    const scores: Record<string, number> = {
      valid_format: validFormat ? 1.0 : 0.0,
    };

    // Use LLM-as-judge for deeper evaluation if enabled
    // Store reasons separately so we can use them for feedback scores
    let judgeReasons: Record<string, string> = {};
    let judgeEvaluationRan = false;

    if (params.useFullEvaluation && isEvaluationEnabled()) {
      try {
        const evaluator = getEvaluator();
        const evaluation = await evaluator.evaluate({
          challenge,
          skillName: params.skillName,
          skillDescription: params.skillDescription,
          targetDifficulty,
        });

        judgeEvaluationRan = true;

        // Add LLM judge scores
        scores.judge_clarity = evaluation.scores.clarity;
        scores.judge_difficulty = evaluation.scores.difficultyAlignment;
        scores.judge_distractors = evaluation.scores.distractorQuality;
        scores.judge_educational = evaluation.scores.educationalValue;
        scores.judge_relevance = evaluation.scores.skillRelevance;
        scores.judge_composite = evaluation.compositeScore;

        // Veto mechanism: if ANY judge score is below 40%, mark as failed
        const VETO_THRESHOLD = 0.4;
        const judgeScores = [
          evaluation.scores.clarity,
          evaluation.scores.difficultyAlignment,
          evaluation.scores.distractorQuality,
          evaluation.scores.educationalValue,
          evaluation.scores.skillRelevance,
        ];
        const vetoTriggered = judgeScores.some(s => s < VETO_THRESHOLD);
        if (vetoTriggered) {
          const failingScores = [];
          if (evaluation.scores.clarity < VETO_THRESHOLD) failingScores.push('clarity');
          if (evaluation.scores.difficultyAlignment < VETO_THRESHOLD) failingScores.push('difficulty');
          if (evaluation.scores.distractorQuality < VETO_THRESHOLD) failingScores.push('distractors');
          if (evaluation.scores.educationalValue < VETO_THRESHOLD) failingScores.push('educational');
          if (evaluation.scores.skillRelevance < VETO_THRESHOLD) failingScores.push('relevance');
          scores.veto_failed = 1.0;  // Flag that veto was triggered
          judgeReasons.veto_failed = `Auto-failed: ${failingScores.join(', ')} score(s) below 40% threshold`;
        }

        // Store reasons from LLM evaluation
        judgeReasons = {
          ...judgeReasons,
          judge_clarity: evaluation.reasons.clarity,
          judge_difficulty: evaluation.reasons.difficultyAlignment,
          judge_distractors: evaluation.reasons.distractorQuality,
          judge_educational: evaluation.reasons.educationalValue,
          judge_relevance: evaluation.reasons.skillRelevance,
          judge_composite: evaluation.reasons.overall,
        };
      } catch (error) {
        console.warn('[ExperimentRunner] LLM evaluation failed:', error);
      }
    }

    // Only include heuristic scores if LLM judge didn't run
    // When judge runs, it provides better quality assessment than heuristics
    if (!judgeEvaluationRan) {
      scores.option_balance = optionBalance;
      scores.explanation_quality = explanationQuality;
    }

    // Store judge reasons for use in getScoreReason
    this.lastJudgeReasons = judgeReasons;

    // Calculate overall score (average of all scores)
    const scoreValues = Object.values(scores);
    scores.overall = scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length;

    return scores;
  }

  /**
   * Calculate how balanced option lengths are.
   * Returns 1.0 if all options are similar length, decreases as variance increases.
   * This helps detect when the correct answer is obviously different in length.
   */
  private calculateOptionBalance(options: string[]): number {
    if (!options || options.length === 0) return 0;

    const lengths = options.map(o => o?.length || 0);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

    if (avgLength === 0) return 0;

    // Calculate coefficient of variation (std dev / mean)
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgLength;

    // CV of 0 = perfect balance (1.0), CV of 1+ = poor balance (0.0)
    return Math.max(0, Math.min(1, 1 - cv));
  }

  /**
   * Calculate explanation quality relative to question.
   * Good explanations should be substantive, not just "The answer is X".
   */
  private calculateExplanationQuality(question: string, explanation: string): number {
    const questionLength = question?.length || 1;
    const explanationLength = explanation?.length || 0;

    // Ideal: explanation is 1-3x question length
    const ratio = explanationLength / questionLength;

    if (ratio < 0.5) {
      // Too short
      return ratio;
    } else if (ratio <= 3) {
      // Good range - scale from 0.5 to 1.0
      return 0.5 + (ratio - 0.5) * 0.2;
    } else {
      // Very detailed is fine
      return 1.0;
    }
  }

  /**
   * Calculate average scores across all results.
   */
  private calculateAverageScores(results: ExperimentResult['results']): Record<string, number> {
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length === 0) {
      return { overall: 0 };
    }

    const scoreNames = new Set<string>();
    successfulResults.forEach(r => Object.keys(r.scores).forEach(k => scoreNames.add(k)));

    const averages: Record<string, number> = {};
    for (const name of scoreNames) {
      const values = successfulResults
        .map(r => r.scores[name])
        .filter(v => v !== undefined);
      averages[name] = values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
        : 0;
    }

    return averages;
  }

  /**
   * Get a human-readable reason for a score.
   */
  private getScoreReason(scoreName: string, value: number): string {
    const pct = (value * 100).toFixed(0);

    switch (scoreName) {
      case 'valid_format':
        return value === 1
          ? 'Valid format: 4 unique options, question present, explanation present, valid answer index (0-3)'
          : 'Invalid format: Check for missing/duplicate options, missing question/explanation, or invalid answer index';

      case 'veto_failed':
        // Use stored reason from judge evaluation
        const vetoReason = this.lastJudgeReasons?.veto_failed;
        return vetoReason || 'Auto-failed: One or more judge scores fell below 40% threshold';

      case 'option_balance':
        if (value >= 0.8) {
          return `Well-balanced options (${pct}%): Answer choices are similar in length, reducing the chance of length being a giveaway`;
        } else if (value >= 0.5) {
          return `Moderately balanced options (${pct}%): Some variance in option lengths - correct answer may be identifiable by length`;
        } else {
          return `Poorly balanced options (${pct}%): Significant length differences between options - correct answer may be obvious from length alone`;
        }

      case 'explanation_quality':
        if (value >= 0.8) {
          return `Strong explanation (${pct}%): Explanation is detailed and substantive relative to question complexity`;
        } else if (value >= 0.5) {
          return `Adequate explanation (${pct}%): Explanation provides basic reasoning but could be more thorough`;
        } else {
          return `Weak explanation (${pct}%): Explanation is too brief - should provide more context and reasoning`;
        }

      case 'overall':
        if (value >= 0.8) {
          return `Overall: ${pct}% - High quality challenge meeting most criteria`;
        } else if (value >= 0.6) {
          return `Overall: ${pct}% - Acceptable quality with room for improvement`;
        } else {
          return `Overall: ${pct}% - Below expectations, review individual scores for issues`;
        }

      default:
        if (scoreName.startsWith('judge_')) {
          // Use actual LLM reason if available
          const judgeReason = this.lastJudgeReasons[scoreName];
          if (judgeReason && judgeReason !== 'No reason provided' && judgeReason !== 'No overall summary provided') {
            return judgeReason;
          }
          const judgeName = scoreName.replace('judge_', '');
          return `LLM evaluation of ${judgeName}: ${pct}%`;
        }
        return `${scoreName}: ${pct}%`;
    }
  }
}

// Export singleton instance
export const experimentRunner = new ExperimentRunner();
