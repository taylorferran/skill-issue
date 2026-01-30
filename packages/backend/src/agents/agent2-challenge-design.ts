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

export class ChallengeDesignAgent {
  private llmProvider = createLLMProvider();

  /**
   * Design and create a challenge based on scheduling decision
   */
  async designChallenge(decision: SchedulingDecision, traceId?: string): Promise<Challenge | null> {
    const startTime = Date.now();
    const supabase = getSupabase();

    try {
      // Load skill details
      const { data: skill, error: skillError } = await supabase
        .from('skills')
        .select('*')
        .eq('id', decision.skillId)
        .single<SkillRow>();

      if (skillError || !skill) {
        throw new Error(`Skill not found: ${decision.skillId}`);
      }

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
      if (traceId) {
        await opikService.createSpan({
          traceId,
          name: 'validate_challenge',
          type: 'general',
          input: { question: generatedChallenge.question, optionCount: generatedChallenge.options?.length },
          output: { isValid: validation.isValid, errors: validation.errors },
        });
      }

      if (!validation.isValid) {
        console.error('[Agent 2] Invalid challenge generated:', validation.errors);

        // Track failure
        await opikService.trackAgentExecution({
          agentName: 'challenge_design',
          input: { decision, skill },
          output: { error: 'Validation failed', errors: validation.errors },
          durationMs: Date.now() - startTime,
          success: false,
          traceId,
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
        if (traceId) {
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
        }

        // Quality gate: reject low-quality challenges
        if (!evaluation.passed) {
          console.warn(`[Agent 2] Challenge rejected by LLM judge: score=${evaluation.compositeScore.toFixed(2)}, threshold=${EVALUATION_CONFIG.qualityThreshold}`);
          console.warn(`[Agent 2] Reasoning: ${evaluation.reasons.overall}`);

          await opikService.trackAgentExecution({
            agentName: 'challenge_design',
            input: { decision, skill },
            output: {
              error: 'Quality gate failed',
              evaluation: {
                compositeScore: evaluation.compositeScore,
                threshold: EVALUATION_CONFIG.qualityThreshold,
                reasons: evaluation.reasons,
              },
            },
            durationMs: Date.now() - startTime,
            success: false,
            traceId,
          });

          return null;
        }

        console.log(`[Agent 2] Challenge passed quality gate: score=${evaluation.compositeScore.toFixed(2)}`);
      }

      // Store challenge in database
      const insertData: ChallengeInsert = {
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

      // Track successful execution with nested LLM span
      await opikService.trackAgentExecution({
        agentName: 'challenge_design',
        input: {
          decision,
          skill,
        },
        output: {
          challengeId: challenge.id,
          generatedChallenge: {
            question: generatedChallenge.question,
            options: generatedChallenge.options,
            correctAnswerIndex: generatedChallenge.correctAnswerIndex,
            explanation: generatedChallenge.explanation,
          },
        },
        durationMs: Date.now() - startTime,
        success: true,
        traceId,
        metadata: {
          actualDifficulty: generatedChallenge.actualDifficulty,
          targetDifficulty: decision.difficultyTarget,
          promptVersion: promptVersion.commit,
          ...(selectedVariant && {
            abTest: {
              experiment: CHALLENGE_PROMPT_EXPERIMENT.experimentName,
              variant: selectedVariant.variantName,
              ...selectedVariant.metadata,
            },
          }),
          ...(evaluation && {
            evaluation: {
              compositeScore: evaluation.compositeScore,
              scores: evaluation.scores,
              passed: evaluation.passed,
            },
          }),
        },
        llmCalls: [
          {
            model: 'claude-haiku-4-5-20251001',
            prompt: actualPrompt,
            response: rawResponse,
            promptTokens: usage.inputTokens,
            completionTokens: usage.outputTokens,
            durationMs: llmDuration,
          },
          // Note: Evaluation LLM call is tracked separately via llm_judge_evaluation span
        ],
      });

      // Convert database row to Challenge type
      return this.dbRowToChallenge(challenge);
    } catch (error) {
      console.error('[Agent 2] Challenge design error:', error);

      await opikService.trackAgentExecution({
        agentName: 'challenge_design',
        input: { decision },
        output: { error: String(error) },
        durationMs: Date.now() - startTime,
        success: false,
        traceId,
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
