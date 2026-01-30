import { randomUUID } from 'crypto';
import { getSupabase } from '@/lib/supabase';
import { createLLMProvider, AnthropicProvider } from '@/lib/llm-provider';
import { opikService } from '@/lib/opik';
import { getEvaluator, isEvaluationEnabled } from '@/lib/evaluator';
import { CHALLENGE_PROMPT_EXPERIMENT } from '@/config/ab-tests';
import { EVALUATION_CONFIG } from '@/config/evaluation';
import type { SchedulingDecision, Challenge, GeneratedChallenge, ChallengeEvaluation } from '@/types';
import type { Database } from '@/types/database';

type SkillRow = Database['public']['Tables']['skills']['Row'];
type ChallengeRow = Database['public']['Tables']['challenges']['Row'];
type ChallengeInsert = Database['public']['Tables']['challenges']['Insert'];
type PushEventInsert = Database['public']['Tables']['push_events']['Insert'];

/**
 * Agent 2: Challenge Design
 *
 * Generates appropriate challenges at target difficulty.
 * Calls LLM to generate MCQ, validates output, stores challenge, and creates push event.
 *
 * Responsibilities:
 * - Load skill context
 * - Call LLM with appropriate prompt
 * - Validate generated challenge
 * - Store in database
 * - Create push event record
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface ChallengeResult {
  challenge: Challenge;
  traceId: string;
}

export class ChallengeDesignAgent {
  private llmProvider = createLLMProvider();

  /**
   * Design and create a challenge based on scheduling decision.
   * Creates its own trace for this challenge generation.
   *
   * @param decision - The scheduling decision from Agent 1
   * @param tickTraceId - Optional trace ID from the scheduling tick (for linking)
   * @returns Challenge with its generation trace ID, or null if failed
   */
  async designChallenge(decision: SchedulingDecision, tickTraceId?: string): Promise<ChallengeResult | null> {
    const startTime = Date.now();
    const supabase = getSupabase();

    // Generate challenge ID upfront so we can use it in trace tags
    const challengeId = randomUUID();

    // Load skill details first so we can include skill name in tags
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('*')
      .eq('id', decision.skillId)
      .single<SkillRow>();

    if (skillError || !skill) {
      console.error(`[Agent 2] Skill not found: ${decision.skillId}`);
      return null;
    }

    // Create our own root trace for this challenge generation
    const traceId = await opikService.startTrace({
      name: 'challenge_generation',
      input: {
        challengeId,
        userId: decision.userId,
        skillId: decision.skillId,
        skillName: skill.name,
        targetDifficulty: decision.difficultyTarget,
      },
      metadata: {
        tickTraceId, // Link back to scheduling tick
      },
      tags: [
        `challenge:${challengeId}`,
        `skill:${skill.name}`,
        `difficulty:${decision.difficultyTarget}`,
      ],
    });

    try {
      console.log(`[Agent 2] Designing ${skill.name} challenge at difficulty ${decision.difficultyTarget}`);

      // A/B Testing: Select prompt variant if experiment is enabled
      let selectedVariant: { variantName: string; template: string; tags: string[]; metadata: Record<string, unknown> } | null = null;
      let templateToUse: string | undefined;

      if (CHALLENGE_PROMPT_EXPERIMENT.enabled) {
        // Prepare variants with actual templates
        const variants = CHALLENGE_PROMPT_EXPERIMENT.variants.map(v => ({
          name: v.name,
          template: v.template ?? AnthropicProvider.getChallengePromptTemplate(),
          weight: v.weight,
          tags: v.tags,
          metadata: v.metadata,
        }));

        selectedVariant = opikService.selectPromptVariant({
          experimentName: CHALLENGE_PROMPT_EXPERIMENT.experimentName,
          variants,
        });

        templateToUse = selectedVariant.template;
        console.log(`[Agent 2] Using A/B test variant: ${selectedVariant.variantName}`);
      }

      // Generate challenge via LLM
      const llmStartTime = Date.now();
      const llmResult = await this.llmProvider.generateChallenge({
        skillId: decision.skillId,
        skillName: skill.name,
        skillDescription: skill.description,
        difficulty: decision.difficultyTarget,
        userId: decision.userId,
        customTemplate: templateToUse,
      });
      const llmDuration = Date.now() - llmStartTime;
      const { challenge: generatedChallenge, usage, prompt: actualPrompt, rawResponse } = llmResult;

      // Register prompt with Opik
      const promptVersion = await opikService.createOrGetPrompt({
        name: selectedVariant
          ? `${CHALLENGE_PROMPT_EXPERIMENT.experimentName}_${selectedVariant.variantName}`
          : 'challenge_generation',
        template: templateToUse || AnthropicProvider.getChallengePromptTemplate(),
        metadata: {
          model: 'claude-haiku-4-5-20251001',
          ...(selectedVariant?.metadata || {}),
        },
        tags: selectedVariant?.tags || ['v0.1-base'],
      });

      // Validate challenge
      const validation = this.validateChallenge(generatedChallenge);

      // Track validation step as a span
      await opikService.createSpan({
        traceId,
        name: 'validate_challenge',
        type: 'general',
        input: { question: generatedChallenge.question, optionCount: generatedChallenge.options?.length },
        output: { isValid: validation.isValid, errors: validation.errors },
      });

      if (!validation.isValid) {
        console.error('[Agent 2] Invalid challenge generated:', validation.errors);

        // End trace with failure
        await opikService.endTrace({
          traceId,
          output: { error: 'Validation failed', errors: validation.errors },
          error: new Error('Validation failed'),
        });

        return null;
      }

      // LLM-as-Judge Evaluation (quality gate)
      let evaluation: ChallengeEvaluation | null = null;
      if (isEvaluationEnabled()) {
        console.log('[Agent 2] Running LLM-as-Judge evaluation...');
        const evaluator = getEvaluator();

        evaluation = await evaluator.evaluate({
          challenge: generatedChallenge,
          skillName: skill.name,
          skillDescription: skill.description,
          targetDifficulty: decision.difficultyTarget,
        });

        // Track evaluation as an LLM span
        await opikService.createSpan({
          traceId,
          name: 'llm_judge_evaluation',
          type: 'llm',
          model: EVALUATION_CONFIG.model,
          provider: 'anthropic',
          input: {
            challenge: {
              question: generatedChallenge.question,
              options: generatedChallenge.options,
              correctAnswerIndex: generatedChallenge.correctAnswerIndex,
            },
            targetDifficulty: decision.difficultyTarget,
          },
          output: {
            scores: evaluation.scores,
            reasons: evaluation.reasons,
            compositeScore: evaluation.compositeScore,
            passed: evaluation.passed,
          },
          promptTokens: evaluation.usage.inputTokens,
          completionTokens: evaluation.usage.outputTokens,
          durationMs: evaluation.durationMs,
        });

        // Add individual feedback scores with per-dimension LLM reasoning
        await opikService.addFeedbackScores(traceId, [
          { name: 'judge_clarity', value: evaluation.scores.clarity, reason: evaluation.reasons.clarity },
          { name: 'judge_difficulty', value: evaluation.scores.difficultyAlignment, reason: evaluation.reasons.difficultyAlignment },
          { name: 'judge_distractors', value: evaluation.scores.distractorQuality, reason: evaluation.reasons.distractorQuality },
          { name: 'judge_educational', value: evaluation.scores.educationalValue, reason: evaluation.reasons.educationalValue },
          { name: 'judge_relevance', value: evaluation.scores.skillRelevance, reason: evaluation.reasons.skillRelevance },
          { name: 'judge_composite', value: evaluation.compositeScore, reason: evaluation.reasons.overall },
        ], 'online_scoring');

        // Quality gate: reject low-quality challenges
        if (!evaluation.passed) {
          console.warn(`[Agent 2] Challenge rejected by LLM judge: score=${evaluation.compositeScore.toFixed(2)}, threshold=${EVALUATION_CONFIG.qualityThreshold}`);
          console.warn(`[Agent 2] Reasoning: ${evaluation.reasons.overall}`);

          // End trace with failure
          await opikService.endTrace({
            traceId,
            output: {
              error: 'Quality gate failed',
              compositeScore: evaluation.compositeScore,
              threshold: EVALUATION_CONFIG.qualityThreshold,
            },
            error: new Error('Quality gate failed'),
          });

          return null;
        }

        console.log(`[Agent 2] Challenge passed quality gate: score=${evaluation.compositeScore.toFixed(2)}`);
      }

      // Store challenge in database
      const insertData: ChallengeInsert = {
        id: challengeId, // Use our pre-generated ID for trace linking
        skill_id: decision.skillId,
        user_id: decision.userId,
        difficulty: decision.difficultyTarget,
        llm: 'claude-haiku-4-5-20251001',
        prompt_version: promptVersion.commit || 'v1',
        question: generatedChallenge.question,
        options_json: generatedChallenge.options,
        correct_option: generatedChallenge.correctAnswerIndex,
        explanation: generatedChallenge.explanation,
      };

      const { data: challenge, error: insertError } = await supabase
        .from('challenges')
        // @ts-expect-error - Supabase type inference issue with Insert types
        .insert(insertData)
        .select()
        .single<ChallengeRow>();

      if (insertError || !challenge) {
        throw new Error(`Failed to store challenge: ${insertError?.message}`);
      }

      console.log(`[Agent 2] Challenge created: ${challenge.id}`);

      // Create push event record
      const pushEventData: PushEventInsert = {
        challenge_id: challenge.id,
        status: 'sent',
      };

      await supabase
        .from('push_events')
        // @ts-expect-error - Supabase type inference issue with Insert types
        .insert(pushEventData);

      // Update user_skill_state last_challenged_at
      await supabase
        .from('user_skill_state')
        // @ts-expect-error - Supabase type inference issue
        .update({
          last_challenged_at: new Date().toISOString(),
        })
        .eq('user_id', decision.userId)
        .eq('skill_id', decision.skillId);

      // Create LLM generation span
      await opikService.createSpan({
        traceId,
        name: 'llm_generation',
        type: 'llm',
        model: 'claude-haiku-4-5-20251001',
        provider: 'anthropic',
        input: { prompt: actualPrompt },
        output: { response: rawResponse },
        promptTokens: usage.inputTokens,
        completionTokens: usage.outputTokens,
        durationMs: llmDuration,
      });

      // End trace with success
      await opikService.endTrace({
        traceId,
        output: {
          challengeId: challenge.id,
          question: generatedChallenge.question,
          difficulty: decision.difficultyTarget,
          ...(evaluation && {
            judgeScore: evaluation.compositeScore,
          }),
          ...(selectedVariant && {
            abTestVariant: selectedVariant.variantName,
          }),
        },
      });

      // Convert database row to Challenge type and return with trace ID
      return {
        challenge: this.dbRowToChallenge(challenge),
        traceId,
      };
    } catch (error) {
      console.error('[Agent 2] Challenge design error:', error);

      // End trace with error
      await opikService.endTrace({
        traceId,
        output: { error: String(error) },
        error: error as Error,
      });

      return null;
    }
  }

  /**
   * Validate generated challenge meets quality standards - Todo: we need to discuss what makes a good challenge.
   */
  private validateChallenge(challenge: GeneratedChallenge): ValidationResult {
    const errors: string[] = [];

    // Check question
    if (!challenge.question || challenge.question.length < 10) {
      errors.push('Question too short');
    }
    if (challenge.question.length > 500) {
      errors.push('Question too long');
    }

    // Check options
    if (!Array.isArray(challenge.options) || challenge.options.length !== 4) {
      errors.push('Must have exactly 4 options');
    } else {
      challenge.options.forEach((option, idx) => {
        if (!option || option.length < 1) {
          errors.push(`Option ${idx} is empty`);
        }
        if (option.length > 200) {
          errors.push(`Option ${idx} is too long`);
        }
      });
    }

    // Check correct answer
    if (
      typeof challenge.correctAnswerIndex !== 'number' ||
      challenge.correctAnswerIndex < 0 ||
      challenge.correctAnswerIndex > 3
    ) {
      errors.push('Invalid correct answer index');
    }

    // Check for duplicate options
    const uniqueOptions = new Set(challenge.options);
    if (uniqueOptions.size !== challenge.options.length) {
      errors.push('Duplicate options detected');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert database row to Challenge type
   */
  private dbRowToChallenge(row: ChallengeRow): Challenge {
    return {
      id: row.id,
      skillId: row.skill_id,
      userId: row.user_id,
      difficulty: row.difficulty,
      type: 'mcq',
      question: row.question,
      options: Array.isArray(row.options_json) ? row.options_json : [],
      correctAnswerIndex: row.correct_option,
      explanation: row.explanation,
      generatedAt: new Date(row.created_at),
    };
  }
}

// Export singleton instance
export const challengeDesignAgent = new ChallengeDesignAgent();
