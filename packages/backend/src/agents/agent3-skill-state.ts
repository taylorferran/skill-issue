import { getSupabase } from '@/lib/supabase';
import { opikService } from '@/lib/opik';
import type { SkillUpdateRequest } from '@/types';
import type { Database } from '@/types/database';

type UserSkillStateRow = Database['public']['Tables']['user_skill_state']['Row'];
type UserSkillStateUpdate = Database['public']['Tables']['user_skill_state']['Update'];

/**
 * Agent 3: Skill State
 *
 * Updates the system's belief about user competence after each answer.
 * Adjusts difficultyTarget based on performance.
 *
 * Key decisions:
 * - When to increase/decrease difficulty
 * - How to track streaks (correct/incorrect)
 * - How to detect mastery vs struggling - Todo: This needs to be discussed, we don't want to lock users out of skills too quickly
 *  or maybe at all.
 */

interface UpdateResult {
  newDifficultyTarget: number;
  newStreakCorrect: number;
  newStreakIncorrect: number;
  adjustmentReason: string;
}

export class SkillStateAgent {
  /**
   * Update user skill state after challenge answer
   */
  async updateSkillState(request: SkillUpdateRequest, traceId?: string): Promise<void> {
    const startTime = Date.now();
    const supabase = getSupabase();

    try {
      // Load current user skill state
      const { data: userSkillState, error: fetchError } = await supabase
        .from('user_skill_state')
        .select('*')
        .eq('user_id', request.userId)
        .eq('skill_id', request.skillId)
        .single<UserSkillStateRow>();

      if (fetchError || !userSkillState) {
        throw new Error(`User skill state not found for user ${request.userId}, skill ${request.skillId}`);
      }

      console.log(`[Agent 3] Updating skill state for user ${request.userId}, skill ${request.skillId}`);

      // Calculate new state
      const update = this.calculateUpdate(userSkillState, request);

      // Update database
      const updateData: UserSkillStateUpdate = {
        difficulty_target: update.newDifficultyTarget,
        attempts_total: userSkillState.attempts_total + 1,
        correct_total: userSkillState.correct_total + (request.isCorrect ? 1 : 0),
        streak_correct: update.newStreakCorrect,
        streak_incorrect: update.newStreakIncorrect,
        last_result: request.isCorrect ? 'correct' : 'incorrect',
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('user_skill_state')
        // @ts-expect-error - Supabase type inference issue with Update types
        .update(updateData)
        .eq('user_id', request.userId)
        .eq('skill_id', request.skillId);

      if (updateError) {
        throw updateError;
      }

      console.log(`[Agent 3] Updated: difficulty ${userSkillState.difficulty_target} → ${update.newDifficultyTarget}`);
      console.log(`[Agent 3]   Streaks: correct=${update.newStreakCorrect}, incorrect=${update.newStreakIncorrect}`);

      // Track with Opik
      await opikService.trackAgentExecution({
        agentName: 'skill_state',
        input: {
          userId: request.userId,
          skillId: request.skillId,
          isCorrect: request.isCorrect,
          difficulty: request.difficulty,
        },
        output: {
          difficultyChange: update.newDifficultyTarget - userSkillState.difficulty_target,
          streakCorrect: update.newStreakCorrect,
          streakIncorrect: update.newStreakIncorrect,
          reason: update.adjustmentReason,
        },
        durationMs: Date.now() - startTime,
        success: true,
        traceId,
        metadata: {
          previousDifficulty: userSkillState.difficulty_target,
          newDifficulty: update.newDifficultyTarget,
          totalAttempts: userSkillState.attempts_total + 1,
          accuracy: ((userSkillState.correct_total + (request.isCorrect ? 1 : 0)) / (userSkillState.attempts_total + 1)),
        },
      });
    } catch (error) {
      console.error('[Agent 3] Skill state update error:', error);

      await opikService.trackAgentExecution({
        agentName: 'skill_state',
        input: { request },
        output: { error: String(error) },
        durationMs: Date.now() - startTime,
        success: false,
        traceId,
      });

      throw error;
    }
  }

  /**
   * Calculate new skill state based on answer
   *
   * Uses adaptive difficulty adjustment:
   * - First 5 attempts: Aggressive adjustment to quickly find user's level
   * - After 5 attempts: Conservative adjustment based on sustained performance
   */
  private calculateUpdate(userSkillState: UserSkillStateRow, request: SkillUpdateRequest): UpdateResult {
    const currentDifficulty = userSkillState.difficulty_target;
    const currentStreakCorrect = userSkillState.streak_correct;
    const currentStreakIncorrect = userSkillState.streak_incorrect;
    const totalAttempts = userSkillState.attempts_total + 1;
    const correctTotal = userSkillState.correct_total + (request.isCorrect ? 1 : 0);

    let newDifficultyTarget = currentDifficulty;
    let newStreakCorrect = currentStreakCorrect;
    let newStreakIncorrect = currentStreakIncorrect;
    let adjustmentReason = '';

    // Calculate accuracy
    const accuracy = correctTotal / totalAttempts;

    // Response time factor (faster = more confident)
    const responseTimeFactor = this.getResponseTimeFactor(request.responseTimeMs, request.difficulty);

    if (request.isCorrect) {
      // Correct answer - increase correct streak, reset incorrect streak
      newStreakCorrect = currentStreakCorrect + 1;
      newStreakIncorrect = 0;
      adjustmentReason = 'Correct answer';

      // Adaptive difficulty increase based on sample size:
      // - Early on (< 5 attempts): Increase after every correct answer (quickly find user's level)
      // - Later (5+ attempts): Require streak of 2+ (more conservative)
      const requiredStreak = totalAttempts < 5 ? 1 : 2;
      const requiredAccuracy = totalAttempts < 5 ? 0.6 : 0.7;

      if (newStreakCorrect >= requiredStreak && accuracy > requiredAccuracy) {
        newDifficultyTarget = Math.min(10, currentDifficulty + 1);
        adjustmentReason += ` + ${totalAttempts < 5 ? 'early exploration' : 'strong performance'} → difficulty increased`;
      }
    } else {
      // Incorrect answer - increase incorrect streak, reset correct streak
      newStreakCorrect = 0;
      newStreakIncorrect = currentStreakIncorrect + 1;
      adjustmentReason = 'Incorrect answer';

      // Adaptive difficulty decrease based on sample size:
      // - Early on (< 5 attempts): Decrease after 1 incorrect (quickly find user's level)
      // - Later (5+ attempts): Require streak of 2+ or low accuracy
      const shouldDecrease = totalAttempts < 5
        ? newStreakIncorrect >= 1 && accuracy < 0.6  // Early: decrease after 1 wrong if accuracy low
        : newStreakIncorrect >= 2 || accuracy < 0.5 || responseTimeFactor < 0.3;  // Later: stricter

      if (shouldDecrease) {
        newDifficultyTarget = Math.max(1, currentDifficulty - 1);
        adjustmentReason += ` + ${totalAttempts < 5 ? 'early calibration' : 'poor performance'} → difficulty decreased`;
      }
    }

    return {
      newDifficultyTarget,
      newStreakCorrect,
      newStreakIncorrect,
      adjustmentReason,
    };
  }

  /**
   * Calculate response time factor (0-1)
   * Lower response time = higher confidence = higher factor
   */
  private getResponseTimeFactor(responseTimeMs: number, difficulty: number): number {
    // Expected time increases with difficulty
    // Difficulty 1: ~10s, Difficulty 10: ~60s
    const expectedTimeMs = (10 + (difficulty - 1) * 5.5) * 1000;

    // Factor = 1.0 if response time <= expected
    // Factor decreases as response time increases
    if (responseTimeMs <= expectedTimeMs) {
      return 1.0;
    }

    // Decay factor for slow responses
    const ratio = responseTimeMs / expectedTimeMs;
    return Math.max(0, 1 - (ratio - 1) * 0.5);
  }
}

// Export singleton instance
export const skillStateAgent = new SkillStateAgent();
