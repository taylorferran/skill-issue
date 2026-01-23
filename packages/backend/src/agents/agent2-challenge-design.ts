import { getSupabase } from '@/lib/supabase';
import { createLLMProvider } from '@/lib/llm-provider';
import { opikService } from '@/lib/opik';
import type { SchedulingDecision, Challenge, GeneratedChallenge } from '@/types';
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
  async designChallenge(decision: SchedulingDecision): Promise<Challenge | null> {
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

      // Generate challenge via LLM
      const llmStartTime = Date.now();
      const generatedChallenge = await this.llmProvider.generateChallenge({
        skillId: decision.skillId,
        skillName: skill.name,
        skillDescription: skill.description,
        difficulty: decision.difficultyTarget,
        userId: decision.userId,
      });
      const llmDuration = Date.now() - llmStartTime;

      // Track LLM call - Todo: LLM config paramters to populate this Opik call.
      await opikService.trackLLMCall({
        model: 'claude-haiku-4-5-20251001',
        prompt: `Skill: ${skill.name}, Difficulty: ${decision.difficultyTarget}`,
        response: JSON.stringify(generatedChallenge),
        durationMs: llmDuration,
        success: true,
        metadata: {
          skillId: decision.skillId,
          userId: decision.userId,
        },
      });

      // Validate challenge
      const validation = this.validateChallenge(generatedChallenge);
      if (!validation.isValid) {
        console.error('[Agent 2] Invalid challenge generated:', validation.errors);

        // Track failure
        await opikService.trackAgentExecution({
          agentName: 'challenge_design',
          input: { decision, skill },
          output: { error: 'Validation failed', errors: validation.errors },
          durationMs: Date.now() - startTime,
          success: false,
        });

        return null;
      }

      // Store challenge in database
      const insertData: ChallengeInsert = {
        skill_id: decision.skillId,
        user_id: decision.userId,
        difficulty: decision.difficultyTarget,
        llm: 'claude-haiku-4-5-20251001', // Todo: populate with LLM config from env vars
        prompt_version: 'v1',
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

      // Track successful execution
      await opikService.trackAgentExecution({
        agentName: 'challenge_design',
        input: { decision, skill },
        output: { challengeId: challenge.id },
        durationMs: Date.now() - startTime,
        success: true,
        metadata: {
          actualDifficulty: generatedChallenge.actualDifficulty,
          targetDifficulty: decision.difficultyTarget,
        },
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
