import { randomUUID, createHash } from 'crypto';
import { getSupabase } from '@/lib/supabase';
import { createLLMProvider, AnthropicProvider } from '@/lib/llm-provider';
import { opikService } from '@/lib/opik';
import { getEvaluator, isEvaluationEnabled } from '@/lib/evaluator';
import { findAvailablePoolQuestions } from '@/lib/question-pool';
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
  private readonly MAX_RETRIES = 3;
  private readonly RECENT_QUESTIONS_LIMIT = 10;
  private readonly QUESTION_POOL_ENABLED = process.env.QUESTION_POOL_ENABLED !== 'false'; // Default: enabled
  private readonly QUESTION_POOL_MIN_RATING = parseFloat(process.env.QUESTION_POOL_MIN_RATING || '2.0');
  private readonly ADD_TO_POOL = process.env.ADD_GENERATED_TO_POOL !== 'false'; // Default: add generated questions to pool

  /**
   * Design and create a challenge based on scheduling decision.
   * Creates its own trace for this challenge generation.
   *
   * @param decision - The scheduling decision from Agent 1
   * @param tickTraceId - Optional trace ID from the scheduling tick (for linking)
   * @returns Challenge with its generation trace ID, or null if failed
   */
  async designChallenge(decision: SchedulingDecision, tickTraceId?: string): Promise<ChallengeResult | null> {
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

      // Try to get from question pool first
      const poolResult = await this.tryGetFromPool(
        decision.userId,
        decision.skillId,
        decision.difficultyTarget
      );

      if (poolResult) {
        console.log('[Agent 2] Using question from pool (no LLM call needed)');

        // Create challenge from pool question
        const insertData: ChallengeInsert = {
          id: challengeId,
          skill_id: decision.skillId,
          user_id: decision.userId,
          difficulty: decision.difficultyTarget,
          llm: 'pool', // Indicate this is from pool
          prompt_version: 'pool',
          question: poolResult.poolQuestion.question,
          question_hash: null, // Pool questions have their own hash
          question_pool_id: poolResult.poolId,
          options_json: poolResult.poolQuestion.options_json,
          correct_option: poolResult.poolQuestion.correct_option,
          explanation: poolResult.poolQuestion.explanation,
        };

        const { data: challenge, error: insertError } = await supabase
          .from('challenges')
          // @ts-expect-error - Supabase type inference issue
          .insert(insertData)
          .select()
          .single<ChallengeRow>();

        if (insertError || !challenge) {
          throw new Error(`Failed to store pool challenge: ${insertError?.message}`);
        }

        // Create push event
        await supabase
          .from('push_events')
          // @ts-expect-error - Supabase type inference issue
          .insert({ challenge_id: challenge.id, status: 'sent' });

        // Update user_skill_state last_challenged_at
        await supabase
          .from('user_skill_state')
          // @ts-expect-error - Supabase type inference issue
          .update({ last_challenged_at: new Date().toISOString() })
          .eq('user_id', decision.userId)
          .eq('skill_id', decision.skillId);

        // Track pool usage in Opik
        await opikService.createSpan({
          traceId,
          name: 'pool_question_used',
          type: 'general',
          input: { poolId: poolResult.poolId },
          output: {
            timesUsed: poolResult.poolQuestion.times_used,
            avgRating: poolResult.poolQuestion.avg_rating,
          },
        });

        // End trace with success
        await opikService.endTrace({
          traceId,
          output: {
            challengeId: challenge.id,
            source: 'pool',
            poolId: poolResult.poolId,
            difficulty: decision.difficultyTarget,
          },
        });

        return {
          challenge: this.dbRowToChallenge(challenge),
          traceId,
        };
      }

      // No pool question available, generate via LLM
      console.log('[Agent 2] No pool question available, generating via LLM');

      // Fetch recent questions for this user-skill to avoid duplicates
      const recentQuestions = await this.fetchRecentQuestions(decision.userId, decision.skillId);
      console.log(`[Agent 2] Found ${recentQuestions.length} recent questions for context`);

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

      // Add history context to the template
      const historyContext = this.buildHistoryContext(recentQuestions);
      if (templateToUse && historyContext) {
        templateToUse = templateToUse + historyContext;
      }

      // Try up to MAX_RETRIES times to generate a unique challenge
      let generatedChallenge: GeneratedChallenge | null = null;
      let llmResult: any = null;
      let llmDuration = 0;
      let attempt = 0;

      while (attempt < this.MAX_RETRIES && !generatedChallenge) {
        attempt++;
        console.log(`[Agent 2] Generation attempt ${attempt}/${this.MAX_RETRIES}`);

        // Generate challenge via LLM
        const llmStartTime = Date.now();
        llmResult = await this.llmProvider.generateChallenge({
          skillId: decision.skillId,
          skillName: skill.name,
          skillDescription: skill.description + historyContext,
          difficulty: decision.difficultyTarget,
          customTemplate: templateToUse,
        });
        llmDuration = Date.now() - llmStartTime;

        const challenge = llmResult.challenge;

        // Generate hash and check for duplicate
        const questionHash = this.generateQuestionHash(challenge.question);
        const isDuplicate = await this.checkDuplicateHash(
          decision.userId,
          decision.skillId,
          questionHash
        );

        if (isDuplicate) {
          console.log(`[Agent 2] Duplicate question detected (hash match), retrying...`);
          // Add this question to the history for next attempt
          recentQuestions.unshift(challenge.question);
          const newHistoryContext = this.buildHistoryContext(recentQuestions);
          if (templateToUse) {
            // Remove old history and add new
            templateToUse = templateToUse.split('\n\nRECENT QUESTIONS TO AVOID')[0] + newHistoryContext;
          }
          continue;
        }

        // No duplicate, we're good
        generatedChallenge = challenge;
      }

      if (!generatedChallenge) {
        throw new Error(`Failed to generate unique challenge after ${this.MAX_RETRIES} attempts`);
      }

      const { challenge: finalChallenge, usage, prompt: actualPrompt, rawResponse } = llmResult;

      // Create LLM generation span immediately after the call
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
        metadata: { attempts: attempt, recentQuestionsCount: recentQuestions.length },
      });

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
      const validation = this.validateChallenge(finalChallenge);

      // Track validation step as a span
      await opikService.createSpan({
        traceId,
        name: 'validate_challenge',
        type: 'general',
        input: { question: finalChallenge.question, optionCount: finalChallenge.options?.length },
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
          challenge: finalChallenge,
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
              question: finalChallenge.question,
              options: finalChallenge.options,
              correctAnswerIndex: finalChallenge.correctAnswerIndex,
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

      // Generate and store question hash for duplicate detection
      const questionHash = this.generateQuestionHash(finalChallenge.question);

      // Try to add to pool (for future reuse)
      const poolId = await this.addToPool(
        decision.skillId,
        decision.difficultyTarget,
        finalChallenge.question,
        questionHash,
        finalChallenge.options,
        finalChallenge.correctAnswerIndex,
        finalChallenge.explanation,
        'claude-haiku-4-5-20251001',
        promptVersion.commit || 'v1'
      );

      // Store challenge in database
      const insertData: ChallengeInsert = {
        id: challengeId, // Use our pre-generated ID for trace linking
        skill_id: decision.skillId,
        user_id: decision.userId,
        difficulty: decision.difficultyTarget,
        llm: 'claude-haiku-4-5-20251001',
        prompt_version: promptVersion.commit || 'v1',
        question: finalChallenge.question,
        question_hash: questionHash,
        question_pool_id: poolId, // Link to pool if added
        options_json: finalChallenge.options,
        correct_option: finalChallenge.correctAnswerIndex,
        explanation: finalChallenge.explanation,
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

      // End trace with success
      await opikService.endTrace({
        traceId,
        output: {
          challengeId: challenge.id,
          question: finalChallenge.question,
          difficulty: decision.difficultyTarget,
          attempts: attempt,
          recentQuestionsCount: recentQuestions.length,
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
   * Validate generated challenge meets quality standards
   * Enforces brevity requirements to reduce token costs and improve UX
   */
  private validateChallenge(challenge: GeneratedChallenge): ValidationResult {
    const errors: string[] = [];

    // Check question exists and has minimum length
    if (!challenge.question || challenge.question.length < 10) {
      errors.push('Question too short (min 10 characters)');
    }

    // Enforce maximum character length for brevity
    if (challenge.question.length > 150) {
      errors.push(`Question too long (${challenge.question.length} chars, max 150)`);
    }

    // Enforce maximum word count for brevity
    const wordCount = challenge.question.trim().split(/\s+/).length;
    if (wordCount > 25) {
      errors.push(`Question too wordy (${wordCount} words, max 25)`);
    }

    // Check options
    if (!Array.isArray(challenge.options) || challenge.options.length !== 4) {
      errors.push('Must have exactly 4 options');
    } else {
      challenge.options.forEach((option, idx) => {
        if (!option || option.length < 1) {
          errors.push(`Option ${idx} is empty`);
        }

        // Enforce word limit on options
        const optionWords = option.trim().split(/\s+/).length;
        if (optionWords > 8) {
          errors.push(`Option ${idx} too long (${optionWords} words, max 8)`);
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

    // Check explanation brevity (if provided)
    if (challenge.explanation) {
      const explanationWords = challenge.explanation.trim().split(/\s+/).length;
      if (explanationWords > 30) {
        errors.push(`Explanation too long (${explanationWords} words, max 30)`);
      }
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

  /**
   * Generate SHA-256 hash of a question for duplicate detection
   */
  private generateQuestionHash(question: string): string {
    return createHash('sha256').update(question.toLowerCase().trim()).digest('hex');
  }

  /**
   * Check if a question hash already exists for this user-skill combination
   */
  private async checkDuplicateHash(
    userId: string,
    skillId: string,
    questionHash: string
  ): Promise<boolean> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('challenges')
      .select('id')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .eq('question_hash', questionHash)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[Agent 2] Error checking duplicate hash:', error);
    }

    return !!data;
  }

  /**
   * Fetch recent questions for this user-skill to include in LLM prompt
   * Returns the last N questions to avoid generating similar content
   */
  private async fetchRecentQuestions(
    userId: string,
    skillId: string,
    limit: number = this.RECENT_QUESTIONS_LIMIT
  ): Promise<string[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('challenges')
      .select('question')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Agent 2] Error fetching recent questions:', error);
      return [];
    }

    return (data || []).map((row: any) => row.question);
  }

  /**
   * Build history context string to append to LLM prompt
   */
  private buildHistoryContext(recentQuestions: string[]): string {
    if (recentQuestions.length === 0) {
      return '';
    }

    const questionsList = recentQuestions
      .map((q, i) => `${i + 1}. ${q}`)
      .join('\n');

    return `\n\nRECENT QUESTIONS TO AVOID (generate something different):\n${questionsList}\n\nEnsure your new question is substantively different from all the above questions.`;
  }

  /**
   * Try to get a question from the shared pool
   * Returns a pool question if available, null otherwise
   */
  private async tryGetFromPool(
    userId: string,
    skillId: string,
    difficulty: number
  ): Promise<{ poolQuestion: any; poolId: string } | null> {
    if (!this.QUESTION_POOL_ENABLED) {
      return null;
    }

    try {
      // Use the typed helper function to find available questions
      const { data, error } = await findAvailablePoolQuestions(
        userId,
        skillId,
        difficulty,
        this.QUESTION_POOL_MIN_RATING,
        1 // Just get one question
      );

      if (error) {
        console.error('[Agent 2] Error querying question pool:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('[Agent 2] No suitable questions found in pool');
        return null;
      }

      const poolQuestion = data[0];
      console.log(`[Agent 2] Found pool question (used ${poolQuestion.times_used} times, avg rating: ${poolQuestion.avg_rating || 'N/A'})`);

      return {
        poolQuestion,
        poolId: poolQuestion.pool_question_id,
      };
    } catch (error) {
      console.error('[Agent 2] Exception querying pool:', error);
      return null;
    }
  }

  /**
   * Add a generated question to the pool for reuse
   * Only adds if hash doesn't already exist
   */
  private async addToPool(
    skillId: string,
    difficulty: number,
    question: string,
    questionHash: string,
    options: string[],
    correctOption: number,
    explanation: string | null,
    llm: string,
    promptVersion: string
  ): Promise<string | null> {
    if (!this.ADD_TO_POOL) {
      return null;
    }

    const supabase = getSupabase();

    try {
      // Check if question with this hash already exists in pool
      const { data: existing } = await supabase
        .from('question_pool')
        .select('id')
        .eq('skill_id', skillId)
        .eq('difficulty', difficulty)
        .eq('question_hash', questionHash)
        .single();

      if (existing) {
        console.log('[Agent 2] Question already exists in pool, skipping add');
        return (existing as any).id;
      }

      // Insert into pool
      // Note: question_pool types ARE defined in database.ts, but Supabase client doesn't infer them properly
      const { data: poolQuestion, error } = await supabase
        .from('question_pool')
        // @ts-expect-error - Supabase client type inference limitation for question_pool table
        .insert({
          skill_id: skillId,
          difficulty,
          question,
          question_hash: questionHash,
          options_json: options,
          correct_option: correctOption,
          explanation,
          llm,
          prompt_version: promptVersion,
        })
        .select('id')
        .single();

      if (error) {
        console.error('[Agent 2] Error adding to pool:', error);
        return null;
      }

      const poolId = (poolQuestion as any).id;
      console.log(`[Agent 2] Added question to pool: ${poolId}`);
      return poolId;
    } catch (error) {
      console.error('[Agent 2] Exception adding to pool:', error);
      return null;
    }
  }
}

// Export singleton instance
export const challengeDesignAgent = new ChallengeDesignAgent();
